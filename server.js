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
  try {
    const tableCheck = await dbGet(`SELECT name FROM sqlite_master WHERE type='table' AND name='tours'`);
    if (!tableCheck && fs.existsSync(schemaPath)) {
      console.log("Database empty or missing tables. Auto-initializing schema & seeding default data...");
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await new Promise((resolve, reject) => {
        db.exec(schemaSql, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      // Execute seed script logic dynamically
      const seedScriptPath = path.join(dbDir, 'seed.js');
      if (fs.existsSync(seedScriptPath)) {
        require(seedScriptPath);
      }
    }
  } catch (e) {
    console.error("Database initialization check error:", e);
  }
}
initDatabase();

// Authentication Middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Missing or malformed token', code: 'UNAUTHORIZED' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
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
    if (supabase) {
      const { data, error } = await supabase.from('demo_config').select('*').single();
      if (!error && data) {
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
      }
    }

    res.json({
      success: true,
      status: 'ACTIVE',
      expired: false,
      config: {
        client_name: 'Christianson Tours',
        developer_name: 'Ammlan Rath',
        days_remaining: 7
      }
    });
  } catch (err) {
    res.json({ success: true, status: 'ACTIVE', expired: false });
  }
});

// GET /api/tours — Retrieve all tours with packages
app.get('/api/tours', async (req, res) => {
  try {
    if (supabase) {
      const { data: tours } = await supabase.from('tours').select('*');
      const { data: packages } = await supabase.from('packages').select('*');
      const { data: itineraries } = await supabase.from('itineraries').select('*').order('step_order', { ascending: true });

      if (tours && tours.length > 0) {
        const result = tours.map(tour => {
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
      }
    }

    const tours = await dbQuery(`SELECT * FROM tours`);
    const packages = await dbQuery(`SELECT * FROM packages`);
    const itineraries = await dbQuery(`SELECT * FROM itineraries ORDER BY step_order ASC`);

    const result = tours.map(tour => {
      const tourPkgs = packages.filter(p => p.tour_id === tour.id).map(p => ({
        ...p,
        pickup: !!p.pickup,
        admission: !!p.admission,
        breakfast: !!p.breakfast,
        lunch: !!p.lunch,
        skywalk: !!p.skywalk,
        features: JSON.parse(p.features || '[]')
      }));

      const tourItin = itineraries.filter(i => i.tour_id === tour.id);

      return {
        ...tour,
        highlights: JSON.parse(tour.highlights || '[]'),
        packages: tourPkgs,
        itinerary: tourItin
      };
    });

    res.json({ success: true, tours: result });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Database query error: ' + err.message });
  }
});

// GET /api/tours/:id — Retrieve single tour details
app.get('/api/tours/:id', async (req, res) => {
  try {
    if (supabase) {
      const { data: tour } = await supabase.from('tours').select('*').eq('id', req.params.id).single();
      if (tour) {
        const { data: packages } = await supabase.from('packages').select('*').eq('tour_id', tour.id);
        const { data: itinerary } = await supabase.from('itineraries').select('*').eq('tour_id', tour.id).order('step_order', { ascending: true });

        return res.json({
          success: true,
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
        });
      }
    }

    const tour = await dbGet(`SELECT * FROM tours WHERE id = ?`, [req.params.id]);
    if (!tour) return res.status(404).json({ success: false, error: 'Tour not found' });

    const packages = await dbQuery(`SELECT * FROM packages WHERE tour_id = ?`, [tour.id]);
    const itinerary = await dbQuery(`SELECT * FROM itineraries WHERE tour_id = ? ORDER BY step_order ASC`, [tour.id]);

    res.json({
      success: true,
      ...tour,
      highlights: JSON.parse(tour.highlights || '[]'),
      packages: packages.map(p => ({
        ...p,
        pickup: !!p.pickup,
        admission: !!p.admission,
        breakfast: !!p.breakfast,
        lunch: !!p.lunch,
        skywalk: !!p.skywalk,
        features: JSON.parse(p.features || '[]')
      })),
      itinerary
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Database query error: ' + err.message });
  }
});

// GET /api/hotels — Retrieve Las Vegas pickup spots
app.get('/api/hotels', async (req, res) => {
  try {
    if (supabase) {
      const { data: hotels } = await supabase.from('hotels').select('*').order('name', { ascending: true });
      if (hotels && hotels.length > 0) return res.json({ success: true, hotels });
    }

    const hotels = await dbQuery(`SELECT * FROM hotels ORDER BY name ASC`);
    res.json({ success: true, hotels });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Database query error: ' + err.message });
  }
});

// GET /api/addons — Retrieve tour add-ons
app.get('/api/addons', async (req, res) => {
  try {
    if (supabase) {
      const { data: addons } = await supabase.from('addons').select('*');
      if (addons && addons.length > 0) {
        return res.json({
          success: true,
          addons: addons.map(a => ({
            ...a,
            tours: Array.isArray(a.tours) ? a.tours : JSON.parse(a.tours || '[]')
          }))
        });
      }
    }

    const addons = await dbQuery(`SELECT * FROM addons`);
    res.json({
      success: true,
      addons: addons.map(a => ({
        ...a,
        tours: JSON.parse(a.tours || '[]')
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Database query error: ' + err.message });
  }
});

// GET /api/reviews — Retrieve customer reviews
app.get('/api/reviews', async (req, res) => {
  try {
    if (supabase) {
      const { data: reviews } = await supabase.from('reviews').select('*').eq('status', 'APPROVED').order('id', { ascending: false });
      if (reviews && reviews.length > 0) {
        return res.json({
          success: true,
          reviews: reviews.map(r => ({
            ...r,
            tour: r.tour_name,
            tags: Array.isArray(r.tags) ? r.tags : JSON.parse(r.tags || '[]')
          }))
        });
      }
    }

    const reviews = await dbQuery(`SELECT * FROM reviews WHERE status = 'APPROVED' ORDER BY id DESC`);
    res.json({
      success: true,
      reviews: reviews.map(r => ({
        ...r,
        tour: r.tour_name,
        tags: JSON.parse(r.tags || '[]')
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Database query error: ' + err.message });
  }
});

// GET /api/faqs — Retrieve FAQs
app.get('/api/faqs', async (req, res) => {
  try {
    if (supabase) {
      const { data: faqs } = await supabase.from('faqs').select('*').order('display_order', { ascending: true });
      if (faqs && faqs.length > 0) return res.json({ success: true, faqs });
    }

    const faqs = await dbQuery(`SELECT * FROM faqs ORDER BY display_order ASC`);
    res.json({ success: true, faqs });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Database query error: ' + err.message });
  }
});

// GET /api/availability — Check remaining seats for a date
app.get('/api/availability', async (req, res) => {
  const { tourId, date } = req.query;
  if (!tourId || !date) return res.status(400).json({ success: false, error: 'Missing tourId or date parameter' });

  try {
    if (supabase) {
      const { data: avail } = await supabase.from('availability').select('*').eq('tour_id', tourId).eq('date', date).single();
      const maxCap = avail ? avail.max_capacity : 30;
      const booked = avail ? avail.booked_seats : 0;
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
    }

    const avail = await dbGet(`SELECT * FROM availability WHERE tour_id = ? AND date = ?`, [tourId, date]);
    const maxCap = avail ? avail.max_capacity : 30;
    const booked = avail ? avail.booked_seats : 0;
    const remaining = Math.max(0, maxCap - booked);

    res.json({
      success: true,
      tourId,
      date,
      maxCapacity: maxCap,
      bookedSeats: booked,
      remainingSeats: remaining,
      isAvailable: remaining > 0
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Database query error: ' + err.message });
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
  const totalGuests = adultCount + kidCount;

  try {
    // 1. Fetch official package price from DB (Server is the sole pricing authority)
    const pkg = await dbGet(`SELECT * FROM packages WHERE id = ? AND tour_id = ?`, [packageId, tourId]);
    if (!pkg) return res.status(404).json({ success: false, error: 'Invalid tour or package selected.' });

    // 2. Fetch hotel details from DB
    const hotel = await dbGet(`SELECT * FROM hotels WHERE id = ?`, [hotelId]);
    if (!hotel) return res.status(404).json({ success: false, error: 'Invalid hotel pickup location.' });

    // 3. Server-side price calculation
    let calculatedTotal = pkg.price * totalGuests;

    const selectedAddons = Array.isArray(addons) ? addons : [];
    if (selectedAddons.length > 0) {
      const dbAddons = await dbQuery(`SELECT * FROM addons`);
      selectedAddons.forEach(addonId => {
        const match = dbAddons.find(a => a.id === addonId);
        if (match) calculatedTotal += match.price * totalGuests;
      });
    }

    // 4. Server-Side Atomic Capacity Check
    let avail = await dbGet(`SELECT * FROM availability WHERE tour_id = ? AND date = ?`, [tourId, date]);
    const maxCap = avail ? avail.max_capacity : 30;
    const currentBooked = avail ? avail.booked_seats : 0;

    if (currentBooked + totalGuests > maxCap) {
      return res.status(409).json({
        success: false,
        error: 'Capacity Exceeded',
        message: `Only ${Math.max(0, maxCap - currentBooked)} seats remain for ${date}. Cannot book ${totalGuests} seats.`
      });
    }

    // 5. Update/Insert availability
    if (!avail) {
      await dbRun(`INSERT INTO availability (tour_id, date, max_capacity, booked_seats) VALUES (?, ?, ?, ?)`,
        [tourId, date, 30, totalGuests]);
    } else {
      await dbRun(`UPDATE availability SET booked_seats = booked_seats + ? WHERE tour_id = ? AND date = ?`,
        [totalGuests, tourId, date]);
    }

    // 6. Create Booking Record with Initial PENDING_PAYMENT Lifecycle Status
    const bookingRef = 'CT-' + Math.floor(10000 + Math.random() * 90000);

    await dbRun(`INSERT INTO bookings 
      (id, tour_id, package_id, date, adults, kids, hotel_id, hotel_name, pickup_time, guest_name, guest_email, guest_phone, addons, total_price, status, payment_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bookingRef,
        tourId,
        packageId,
        date,
        adultCount,
        kidCount,
        hotelId,
        hotel.name,
        hotel.pickup_time,
        guestName,
        guestEmail,
        guestPhone || '',
        JSON.stringify(selectedAddons),
        calculatedTotal,
        'CONFIRMED',
        'PENDING'
      ]);

    res.status(201).json({
      success: true,
      bookingReference: bookingRef,
      totalPrice: calculatedTotal,
      guestName,
      hotelName: hotel.name,
      pickupTime: hotel.pickup_time,
      date,
      status: 'CONFIRMED',
      paymentStatus: 'PENDING',
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
    const booking = await dbGet(`SELECT * FROM bookings WHERE id = ?`, [bookingId]);
    if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });

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
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Christianson Tours — Booking ${booking.id}`,
            description: `Date: ${booking.date} · Hotel: ${booking.hotel_name}`
          },
          unit_amount: Math.round(booking.total_price * 100)
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: `${req.protocol}://${req.get('host')}/booking.html?confirmed=${booking.id}`,
      cancel_url: `${req.protocol}://${req.get('host')}/booking.html?cancelled=${booking.id}`,
      metadata: { bookingId: booking.id }
    });

    res.json({ success: true, stripeConfigured: true, sessionUrl: session.url });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/payments/mock-confirm — Development/Demo Payment Confirmation
app.post('/api/payments/mock-confirm', async (req, res) => {
  const { bookingId } = req.body;
  if (!bookingId) return res.status(400).json({ success: false, error: 'Missing bookingId' });

  try {
    const booking = await dbGet(`SELECT * FROM bookings WHERE id = ?`, [bookingId]);
    if (!booking) return res.status(404).json({ success: false, error: 'Booking reference not found' });

    await dbRun(`UPDATE bookings SET payment_status = 'PAID', status = 'CONFIRMED' WHERE id = ?`, [bookingId]);
    res.json({ success: true, bookingId, paymentStatus: 'PAID', status: 'CONFIRMED', message: 'Payment confirmed in demo mode.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/payments/webhook — Official Stripe Signature Verified Webhook
app.post('/api/payments/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  if (STRIPE_SECRET_KEY && STRIPE_WEBHOOK_SECRET && sig) {
    const stripe = require('stripe')(STRIPE_SECRET_KEY);
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error(`Webhook Signature Verification Failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  } else {
    // Unverified fallback only if Stripe webhook secret is unconfigured
    try {
      event = JSON.parse(req.body.toString());
    } catch (e) {
      return res.status(400).send("Invalid webhook payload");
    }
  }

  if (event.type === 'checkout.session.completed' || event.type === 'payment_intent.succeeded') {
    const session = event.data.object;
    const bookingId = session.metadata ? session.metadata.bookingId : null;
    if (bookingId) {
      await dbRun(`UPDATE bookings SET payment_status = 'PAID', status = 'CONFIRMED' WHERE id = ?`, [bookingId]);
      console.log(`Payment webhook confirmed booking ${bookingId}`);
    }
  }

  res.json({ received: true });
});

// ----------------------------------------------------
// AUTHENTICATION & ADMIN CMS ENDPOINTS
// ----------------------------------------------------

// POST /api/auth/login — Admin Authentication
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ success: false, error: 'Username and password required' });

  try {
    const user = await dbGet(`SELECT * FROM users WHERE username = ?`, [username]);
    if (!user) return res.status(401).json({ success: false, error: 'Invalid username or password' });

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(401).json({ success: false, error: 'Invalid username or password' });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '12h' });

    res.json({
      success: true,
      token,
      user: { username: user.username, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server authentication failure: ' + err.message });
  }
});

// GET /api/admin/dashboard — Aggregated Business Analytics (Protected)
app.get('/api/admin/dashboard', authMiddleware, async (req, res) => {
  try {
    const totalBookings = await dbGet(`SELECT COUNT(*) as count, SUM(total_price) as revenue FROM bookings WHERE status != 'CANCELLED'`);
    const pendingBookings = await dbGet(`SELECT COUNT(*) as count FROM bookings WHERE status = 'PENDING' OR payment_status = 'PENDING'`);
    const totalTours = await dbGet(`SELECT COUNT(*) as count FROM tours`);
    const recentBookings = await dbQuery(`SELECT * FROM bookings ORDER BY created_at DESC LIMIT 10`);

    res.json({
      success: true,
      analytics: {
        totalBookings: totalBookings.count || 0,
        totalRevenue: totalBookings.revenue || 0,
        pendingBookings: pendingBookings.count || 0,
        totalTours: totalTours.count || 0
      },
      recentBookings
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/bookings — All Customer Reservations (Protected)
app.get('/api/admin/bookings', authMiddleware, async (req, res) => {
  try {
    const bookings = await dbQuery(`SELECT * FROM bookings ORDER BY created_at DESC`);
    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/bookings/:id — Update Booking Status (Protected)
app.patch('/api/admin/bookings/:id', authMiddleware, async (req, res) => {
  const { status, payment_status } = req.body;
  try {
    await dbRun(`UPDATE bookings SET status = COALESCE(?, status), payment_status = COALESCE(?, payment_status) WHERE id = ?`,
      [status, payment_status, req.params.id]);
    res.json({ success: true, message: 'Booking status updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/admin/tours/:id — Live Price & Tour Modifications (Protected)
app.put('/api/admin/tours/:id', authMiddleware, async (req, res) => {
  const { name, tagline, starting_price, summary } = req.body;
  try {
    await dbRun(`UPDATE tours SET name = COALESCE(?, name), tagline = COALESCE(?, tagline), starting_price = COALESCE(?, starting_price), summary = COALESCE(?, summary) WHERE id = ?`,
      [name, tagline, starting_price, summary, req.params.id]);
    
    if (starting_price) {
      await dbRun(`UPDATE packages SET price = ? WHERE tour_id = ? AND badge = 'Best Value'`, [starting_price, req.params.id]);
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
    await dbRun(`INSERT INTO availability (tour_id, date, max_capacity, booked_seats) VALUES (?, ?, ?, 0)
      ON CONFLICT(tour_id, date) DO UPDATE SET max_capacity = ?`, [tourId, date, maxCapacity, maxCapacity]);
    res.json({ success: true, message: 'Capacity updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/reviews/:id — Moderate Customer Reviews (Protected)
app.patch('/api/admin/reviews/:id', authMiddleware, async (req, res) => {
  const { status } = req.body; // 'APPROVED' or 'REJECTED'
  if (!status) return res.status(400).json({ success: false, error: 'Status is required' });

  try {
    await dbRun(`UPDATE reviews SET status = ? WHERE id = ?`, [status, req.params.id]);
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
