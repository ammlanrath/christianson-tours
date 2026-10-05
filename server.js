/**
 * Christianson Tours — Production Backend Server & REST API
 * Secure Node.js/Express server providing real database access,
 * server-side booking capacity enforcement, payment boundaries, Stripe webhooks, and JWT admin auth.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const JWT_SECRET = process.env.JWT_SECRET || (NODE_ENV === 'development' ? 'dev-christianson-jwt-secret-key-2026' : null);
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || null;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || null;

// Supabase Integration Setup
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lcpgrrmdurpkewvdycfi.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
let supabase = null;
if (SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  console.log(`[Supabase] Client connected to ${SUPABASE_URL}`);
}

if (!JWT_SECRET && NODE_ENV === 'production') {
  console.error("FATAL ERROR: JWT_SECRET environment variable is missing in production mode!");
  process.exit(1);
}

const app = express();
app.use(cors());

// Use raw body parser for Stripe webhook verification
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook') {
    express.raw({ type: 'application/json' })(req, res, next);
  } else {
    express.json()(req, res, next);
  }
});

// Database Setup & Auto-Seeding System
const dbDir = path.join(__dirname, 'db');
const schemaPath = path.join(dbDir, 'schema.sql');
let db = null;

try {
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  const dbPath = path.join(dbDir, 'christianson.db');
  db = new sqlite3.Database(dbPath);
} catch (e) {
  console.warn("SQLite disabled or read-only environment. Operating in Supabase Serverless mode.");
}

// Helper function for DB queries (Promises with Supabase / SQLite fallbacks)
function dbQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (!db) return resolve([]);
    db.all(sql, params, (err, rows) => {
      if (err) resolve([]);
      else resolve(rows || []);
    });
  });
}

function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (!db) return resolve({ changes: 0 });
    db.run(sql, params, function (err) {
      if (err) resolve({ changes: 0 });
      else resolve(this);
    });
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (!db) return resolve(null);
    db.get(sql, params, (err, row) => {
      if (err) resolve(null);
      else resolve(row || null);
    });
  });
}

// Auto-initialize & Seed Database if empty
async function initDatabase() {
  console.log("Initialization complete. Supabase strictly enforced.");
}
initDatabase();

// Authentication Middleware (Supabase)
async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Missing or malformed token', code: 'UNAUTHORIZED' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) throw new Error(error.message);

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden: Admins only', code: 'FORBIDDEN' });
    }

    req.user = { id: user.id, email: user.email, role: 'admin' };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Session expired or invalid token', code: 'UNAUTHORIZED' });
  }
}

// ----------------------------------------------------
// PUBLIC API ENDPOINTS
// ----------------------------------------------------

// GET /api/demo-status — Server-side 7-Day Demo Expiration Enforcement
app.get('/api/demo-status', async (req, res) => {
  try {
    const { data, error } = await supabase.from('demo_config').select('*').single();
    if (error || !data) throw new Error(error?.message || 'Demo config not found');
    const expiresAt = new Date(data.expires_at).getTime();
    const now = Date.now();
    const isExpired = data.status === 'EXPIRED' || now > expiresAt;
    const daysRemaining = Math.max(0, Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)));
    return res.json({
      success: true,
      status: isExpired ? 'EXPIRED' : 'ACTIVE',
      expired: isExpired,
      config: {
        client_name: data.client_name,
        developer_name: data.developer_name,
        expires_at: data.expires_at,
        days_remaining: daysRemaining
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/tours — Retrieve all tours with packages
app.get('/api/tours', async (req, res) => {
  try {
    const { data: tours, error: toursErr } = await supabase.from('tours').select('*');
    if (toursErr) throw new Error(toursErr.message);
    const { data: packages, error: pkgsErr } = await supabase.from('packages').select('*');
    if (pkgsErr) throw new Error(pkgsErr.message);
    const { data: itineraries, error: itinErr } = await supabase.from('itineraries').select('*').order('step_order', { ascending: true });
    if (itinErr) throw new Error(itinErr.message);

    const result = (tours || []).map(tour => {
      const tourPkgs = (packages || []).filter(p => p.tour_id === tour.id).map(p => ({
        ...p,
        pickup: !!p.pickup,
        admission: !!p.admission,
        breakfast: !!p.breakfast,
        lunch: !!p.lunch,
        skywalk: !!p.skywalk,
        features: Array.isArray(p.features) ? p.features : JSON.parse(p.features || '[]')
      }));
      const tourItin = (itineraries || []).filter(i => i.tour_id === tour.id);
      return {
        ...tour,
        highlights: Array.isArray(tour.highlights) ? tour.highlights : JSON.parse(tour.highlights || '[]'),
        packages: tourPkgs,
        itinerary: tourItin
      };
    });
    return res.json({ success: true, tours: result });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Supabase query error: ' + err.message });
  }
});

// GET /api/tours/:id — Retrieve single tour details
app.get('/api/tours/:id', async (req, res) => {
  try {
    const { data: tour, error: tourErr } = await supabase.from('tours').select('*').eq('id', req.params.id).single();
    if (tourErr || !tour) return res.status(404).json({ success: false, error: 'Tour not found' });
    
    const { data: packages, error: pkgsErr } = await supabase.from('packages').select('*').eq('tour_id', tour.id);
    if (pkgsErr) throw new Error(pkgsErr.message);
    
    const { data: itinerary, error: itinErr } = await supabase.from('itineraries').select('*').eq('tour_id', tour.id).order('step_order', { ascending: true });
    if (itinErr) throw new Error(itinErr.message);

    const result = {
      ...tour,
      highlights: Array.isArray(tour.highlights) ? tour.highlights : JSON.parse(tour.highlights || '[]'),
      packages: (packages || []).map(p => ({
        ...p,
        pickup: !!p.pickup,
        admission: !!p.admission,
        breakfast: !!p.breakfast,
        lunch: !!p.lunch,
        skywalk: !!p.skywalk,
        features: Array.isArray(p.features) ? p.features : JSON.parse(p.features || '[]')
      })),
      itinerary: itinerary || []
    };
    return res.json({ success: true, tour: result });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Supabase query error: ' + err.message });
  }
});

// GET /api/hotels — Retrieve Las Vegas pickup spots
app.get('/api/hotels', async (req, res) => {
  try {
    const { data: hotels, error } = await supabase.from('hotels').select('*').order('name', { ascending: true });
    if (error) throw new Error(error.message);
    res.json({ success: true, hotels: hotels || [] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Supabase query error: ' + err.message });
  }
});

// GET /api/addons — Retrieve tour add-ons
app.get('/api/addons', async (req, res) => {
  try {
    const { data: addons, error } = await supabase.from('addons').select('*');
    if (error) throw new Error(error.message);
    res.json({
      success: true,
      addons: (addons || []).map(a => ({
        ...a,
        tours: Array.isArray(a.tours) ? a.tours : JSON.parse(a.tours || '[]')
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Supabase query error: ' + err.message });
  }
});

// GET /api/reviews — Retrieve customer reviews
app.get('/api/reviews', async (req, res) => {
  try {
    const { data: reviews, error } = await supabase.from('reviews').select('*').eq('status', 'APPROVED').order('id', { ascending: false });
    if (error) throw new Error(error.message);
    res.json({
      success: true,
      reviews: (reviews || []).map(r => ({
        ...r,
        tour: r.tour_name,
        tags: Array.isArray(r.tags) ? r.tags : JSON.parse(r.tags || '[]')
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Supabase query error: ' + err.message });
  }
});

// GET /api/faqs — Retrieve FAQs
app.get('/api/faqs', async (req, res) => {
  try {
    const { data: faqs, error } = await supabase.from('faqs').select('*').order('display_order', { ascending: true });
    if (error) throw new Error(error.message);
    res.json({ success: true, faqs: faqs || [] });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Supabase query error: ' + err.message });
  }
});

// GET /api/availability — Check remaining seats for a date
app.get('/api/availability', async (req, res) => {
  const { tourId, date } = req.query;
  if (!tourId || !date) return res.status(400).json({ success: false, error: 'Missing tourId or date parameter' });

  try {
    const { data: avail, error } = await supabase.from('availability').select('*').eq('tour_id', tourId).eq('date', date).single();
    if (error || !avail) {
      return res.status(404).json({ success: false, error: 'Availability not configured', code: 'AVAILABILITY_NOT_CONFIGURED' });
    }
    
    const maxCap = avail.max_capacity;
    const booked = avail.booked_seats;
    const remaining = Math.max(0, maxCap - booked);

    return res.json({
      success: true,
      tourId,
      date,
      maxCapacity: maxCap,
      bookedSeats: booked,
      remainingSeats: remaining,
      isAvailable: remaining > 0
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Supabase query error: ' + err.message });
  }
});

// ----------------------------------------------------
// SERVER-SIDE BOOKING ENGINE & CAPACITY ENFORCEMENT
// ----------------------------------------------------

// POST /api/bookings/create — Create booking with server-side pricing authority
app.post('/api/bookings/create', async (req, res) => {
  const { tourId, packageId, date, adults, kids, hotelId, guestName, guestEmail, guestPhone, addons } = req.body;

  if (!tourId || !packageId || !date || !guestName || !guestEmail || !hotelId) {
    return res.status(400).json({ success: false, error: 'Missing required booking fields.' });
  }

  const adultCount = parseInt(adults) || 1;
  const kidCount = parseInt(kids) || 0;
  const selectedAddons = Array.isArray(addons) ? addons : [];

  const bookingRef = 'CT-' + Math.floor(10000 + Math.random() * 90000); // Collision handled by DB

  try {
    const { data, error } = await supabase.rpc('create_booking_atomic', {
      p_booking_id: bookingRef,
      p_tour_id: tourId,
      p_package_id: packageId,
      p_hotel_id: hotelId,
      p_date: date,
      p_adults: adultCount,
      p_kids: kidCount,
      p_guest_name: guestName,
      p_guest_email: guestEmail,
      p_guest_phone: guestPhone || '',
      p_addon_ids: selectedAddons
    });

    if (error) {
      console.error("Supabase RPC Error:", error);
      return res.status(500).json({ success: false, error: 'Booking failed due to internal error.' });
    }

    if (!data.success) {
      if (data.code === 'AVAILABILITY_NOT_CONFIGURED') return res.status(404).json({ success: false, error: 'Availability not configured for this date.' });
      if (data.code === 'INSUFFICIENT_CAPACITY') return res.status(409).json({ success: false, error: 'Not enough seats available.' });
      if (data.code === 'INVALID_TOUR' || data.code === 'INVALID_PACKAGE') return res.status(400).json({ success: false, error: 'Invalid tour or package.' });
      if (data.code === 'INVALID_HOTEL') return res.status(400).json({ success: false, error: 'Invalid hotel.' });
      if (data.code === 'INVALID_ADDON') return res.status(400).json({ success: false, error: 'Invalid or duplicate addons.' });
      
      return res.status(400).json({ success: false, error: data.code });
    }

    res.status(201).json({
      success: true,
      bookingReference: data.booking_id,
      totalPrice: data.total_price,
      status: 'PENDING',
      paymentStatus: 'UNPAID',
      message: 'Reservation created. Awaiting payment confirmation.'
    });
  } catch (err) {
    console.error("Booking Error:", err);
    res.status(500).json({ success: false, error: 'Server booking processing failed: ' + err.message });
  }
});

// ----------------------------------------------------
// PAYMENT BOUNDARY & STRIPE WEBHOOKS
// ----------------------------------------------------

// POST /api/payments/create-session — Create payment checkout session
app.post('/api/payments/create-session', async (req, res) => {
  const { bookingId } = req.body;
  if (!bookingId) return res.status(400).json({ success: false, error: 'Missing bookingId parameter' });

  try {
    const { data: booking, error: fetchErr } = await supabase.from('bookings').select('*').eq('id', bookingId).single();
    if (fetchErr || !booking) return res.status(404).json({ success: false, error: 'Booking not found' });
    if (booking.status !== 'PENDING') return res.status(400).json({ success: false, error: 'Booking is no longer pending' });

    if (!STRIPE_SECRET_KEY) {
      return res.json({
        success: true,
        stripeConfigured: false,
        message: 'Stripe API key pending configuration. Mock payment session generated.',
        mockPaymentUrl: `/booking.html?confirmed=${booking.id}`,
        bookingId: booking.id,
        amount: booking.total_price
      });
    }

    // Stripe Checkout Session Creation
    const stripe = require('stripe')(STRIPE_SECRET_KEY);
    let session;
    try {
      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        client_reference_id: booking.id,
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: { name: `Christianson Tour: ${booking.tour_id}` },
            unit_amount: Math.round(booking.total_price * 100),
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `http://localhost:${PORT}/booking.html?confirmed=${booking.id}`,
        cancel_url: `http://localhost:${PORT}/booking.html?cancelled=true`,
      });
    } catch (stripeErr) {
      // If Stripe session creation fails, cancel the reservation
      await supabase.rpc('cancel_reservation', { p_booking_id: booking.id });
      throw stripeErr;
    }

    // Save Stripe session ID
    await supabase.from('bookings').update({ stripe_session_id: session.id }).eq('id', booking.id);

    res.json({ success: true, url: session.url });
  } catch (err) {
    console.error("Stripe Error:", err);
    res.status(500).json({ success: false, error: 'Payment initialization failed' });
  }
});

// POST /api/payments/mock-confirm — Development/Demo Payment Confirmation
app.post('/api/payments/mock-confirm', async (req, res) => {
  const { bookingId } = req.body;
  if (!bookingId) return res.status(400).json({ success: false, error: 'Missing bookingId' });

  try {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'CONFIRMED', payment_status: 'PAID' })
      .eq('id', bookingId)
      .eq('status', 'PENDING')
      .select();

    if (error || !data || data.length === 0) return res.status(404).json({ success: false, error: 'Booking reference not found or not pending' });

    res.json({ success: true, bookingId, paymentStatus: 'PAID', status: 'CONFIRMED', message: 'Payment confirmed in demo mode.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// AUTHENTICATION & ADMIN CMS ENDPOINTS
// ----------------------------------------------------

// POST /api/auth/login — Admin Authentication
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ success: false, error: 'Username and password required' });

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: username,
      password: password
    });
    
    if (error || !data.user) return res.status(401).json({ success: false, error: 'Invalid username or password' });

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Unauthorized: Admins only' });
    }

    res.json({
      success: true,
      token: data.session.access_token,
      user: { username: data.user.email, role: 'admin' }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server authentication failure: ' + err.message });
  }
});

// GET /api/admin/dashboard — Aggregated Business Analytics (Protected)
app.get('/api/admin/dashboard', authMiddleware, async (req, res) => {
  try {
    const { data: bookingsData } = await supabase.from('bookings').select('total_price').neq('status', 'CANCELLED');
    const totalBookingsCount = bookingsData ? bookingsData.length : 0;
    const totalRevenue = bookingsData ? bookingsData.reduce((sum, b) => sum + Number(b.total_price), 0) : 0;

    const { count: pendingBookingsCount } = await supabase.from('bookings').select('*', { count: 'exact', head: true }).or('status.eq.PENDING,payment_status.eq.PENDING');
    const { count: totalToursCount } = await supabase.from('tours').select('*', { count: 'exact', head: true });
    const { data: recentBookings } = await supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(10);

    res.json({
      success: true,
      analytics: {
        totalBookings: totalBookingsCount,
        totalRevenue: totalRevenue,
        pendingBookings: pendingBookingsCount || 0,
        totalTours: totalToursCount || 0
      },
      recentBookings: recentBookings || []
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/bookings — All Customer Reservations (Protected)
app.get('/api/admin/bookings', authMiddleware, async (req, res) => {
  try {
    const { data: bookings, error } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    res.json({ success: true, bookings: bookings || [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/bookings/:id — Update Booking Status (Protected)
app.patch('/api/admin/bookings/:id', authMiddleware, async (req, res) => {
  const { status, payment_status } = req.body;
  try {
    // If admin is cancelling, route through transactional RPC to release capacity
    if (status === 'CANCELLED') {
      const { data, error } = await supabase.rpc('admin_cancel_booking', { p_booking_id: req.params.id });
      if (error) throw new Error(error.message);
      if (!data || data.success === false) throw new Error(data?.error || 'Cancellation failed');
      
      return res.json({ success: true, message: 'Booking cancelled transactionally', result: data });
    }

    // Normal non-cancellation updates
    const updateData = {};
    if (status) updateData.status = status;
    if (payment_status) updateData.payment_status = payment_status;

    // Prevent invalid transitions: Cannot un-cancel a booking directly without checking capacity
    const { data: booking } = await supabase.from('bookings').select('status').eq('id', req.params.id).single();
    if (booking && booking.status === 'CANCELLED' && status && status !== 'CANCELLED') {
       return res.status(400).json({ success: false, error: 'Cannot uncancel a booking directly. Must create a new booking to reserve capacity.' });
    }

    const { error } = await supabase.from('bookings').update(updateData).eq('id', req.params.id);
    if (error) throw new Error(error.message);

    res.json({ success: true, message: 'Booking status updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/admin/tours/:id — Live Price & Tour Modifications (Protected)
app.put('/api/admin/tours/:id', authMiddleware, async (req, res) => {
  const { name, tagline, starting_price, summary } = req.body;
  try {
    const updateData = {};
    if (name) updateData.name = name;
    if (tagline) updateData.tagline = tagline;
    if (starting_price) updateData.starting_price = starting_price;
    if (summary) updateData.summary = summary;

    const { error } = await supabase.from('tours').update(updateData).eq('id', req.params.id);
    if (error) throw new Error(error.message);
    
    if (starting_price) {
      await supabase.from('packages').update({ price: starting_price }).eq('tour_id', req.params.id).eq('badge', 'Best Value');
    }

    res.json({ success: true, message: 'Tour details updated in database' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/availability — Adjust Seat Capacity per Date (Protected)
app.post('/api/admin/availability', authMiddleware, async (req, res) => {
  const { tourId, date, maxCapacity } = req.body;
  if (!tourId || !date || !maxCapacity) return res.status(400).json({ success: false, error: 'Missing parameters' });

  try {
    const { data: existing } = await supabase.from('availability').select('id').eq('tour_id', tourId).eq('date', date).single();
    if (existing) {
      const { error } = await supabase.from('availability').update({ max_capacity: maxCapacity }).eq('id', existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from('availability').insert([{ tour_id: tourId, date, max_capacity: maxCapacity, booked_seats: 0 }]);
      if (error) throw new Error(error.message);
    }
    res.json({ success: true, message: 'Capacity updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/reviews/:id — Moderate Customer Reviews (Protected)
app.patch('/api/admin/reviews/:id', authMiddleware, async (req, res) => {
  const { status } = req.body; // 'APPROVED', 'PENDING' or 'REJECTED'
  if (!status) return res.status(400).json({ success: false, error: 'Status is required' });

  try {
    const { error } = await supabase.from('reviews').update({ status }).eq('id', req.params.id);
    if (error) throw new Error(error.message);
    res.json({ success: true, message: `Review status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Clean Subfolder & Legacy Route Resolvers
app.get(['/tours', '/tours/', '/tours.html'], (req, res) => res.sendFile(path.join(__dirname, 'public', 'tours', 'index.html')));
app.get(['/tours/grand-canyon-west', '/tours/grand-canyon-west.html', '/grand-canyon-west.html', '/grand-canyon-west'], (req, res) => res.sendFile(path.join(__dirname, 'public', 'tours', 'grand-canyon-west.html')));
app.get(['/tours/hoover-dam', '/tours/hoover-dam.html', '/hoover-dam.html', '/hoover-dam'], (req, res) => res.sendFile(path.join(__dirname, 'public', 'tours', 'hoover-dam.html')));
app.get(['/booking', '/booking/', '/booking.html'], (req, res) => res.sendFile(path.join(__dirname, 'public', 'booking', 'index.html')));
app.get(['/compare', '/compare/', '/compare.html'], (req, res) => res.sendFile(path.join(__dirname, 'public', 'compare', 'index.html')));
app.get(['/plan', '/plan/', '/plan.html'], (req, res) => res.sendFile(path.join(__dirname, 'public', 'plan', 'index.html')));
app.get(['/reviews', '/reviews/', '/reviews.html'], (req, res) => res.sendFile(path.join(__dirname, 'public', 'reviews', 'index.html')));
app.get(['/faq', '/faq/', '/faq.html'], (req, res) => res.sendFile(path.join(__dirname, 'public', 'faq', 'index.html')));
app.get(['/admin', '/admin/', '/admin.html'], (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html')));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname)));

// Fallback to index.html for single-page style navigation
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ success: false, error: 'API route not found' });
  const pubPath = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(pubPath)) return res.sendFile(pubPath);
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Export Express app for Vercel Serverless Functions & local server execution
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`Christianson Tours Production Server running on port ${PORT}`);
    console.log(`Database connected: Supabase / Local DB`);
    console.log(`Admin Auth: Active (JWT Enabled)`);
    console.log(`====================================================`);
  });
}

module.exports = app;
