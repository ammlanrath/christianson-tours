/**
 * Christianson Tours — Supabase Seeding Script
 * Populates Supabase tables with initial production data.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lcpgrrmdurpkewvdycfi.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error("SUPABASE_KEY environment variable is required to seed Supabase.");
  console.error("Please add SUPABASE_KEY=your_key_here to your .env file or run the SQL script in Supabase Dashboard.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TOURS = [
  {
    id: 'grand-canyon-west',
    slug: 'grand-canyon-west',
    name: 'Grand Canyon West Rim Luxury Day Tour',
    tagline: 'Witness breathtaking vista points, Skywalk glass bridge, and Eagle Point',
    badge: 'Most Popular',
    rating: 4.95,
    review_count: 1420,
    duration: '10–11 Hours',
    duration_type: 'Full Day Excursion',
    category: 'Sightseeing & National Parks',
    starting_price: 97.00,
    hero_image: '/assets/canyon_hero.jpg',
    summary: 'Traverse the breathtaking Mojave Desert in a luxury Mercedes Sprinter. Arrive at the West Rim of the Grand Canyon for exclusive access to Eagle Point, Guano Point, and optional Skywalk entry.',
    highlights: JSON.stringify([
      'Hotel pickup & drop-off from key Las Vegas Strip resorts',
      'Hot cooked breakfast & gourmet picnic lunch included',
      'Exclusive Skywalk Glass Bridge VIP access',
      'Guided photography stops at Joshua Tree Forest & Mike O\'Callaghan Bridge'
    ])
  },
  {
    id: 'hoover-dam-express',
    slug: 'hoover-dam',
    name: 'Hoover Dam VIP Express Experience',
    tagline: 'An engineering marvel of the modern world with power plant access',
    badge: 'Best Seller',
    rating: 4.88,
    review_count: 980,
    duration: '4.5–5 Hours',
    duration_type: 'Half Day Excursion',
    category: 'Engineering & History',
    starting_price: 65.00,
    hero_image: '/assets/hoover_hero.jpg',
    summary: 'Experience the triumph of 1930s engineering. Walk along the top of Hoover Dam, view Lake Mead, and enjoy inside access to the generator room and visitor center.',
    highlights: JSON.stringify([
      'Inside generator room tour access with historic film presentation',
      'Photo stop at the famous Welcome to Las Vegas sign',
      'Walk across the Bypass Bridge for iconic panoramic views',
      'Luxury air-conditioned Mercedes Sprinter transport'
    ])
  }
];

const PACKAGES = [
  {
    id: 'gc-west-classic',
    tour_id: 'grand-canyon-west',
    name: 'Classic Explorer Package',
    subtitle: 'Standard Grand Canyon Entry + Strip Transportation',
    price: 97.00,
    original_price: 129.00,
    badge: 'Great Value',
    pickup: 1,
    admission: 1,
    breakfast: 1,
    lunch: 0,
    skywalk: 0,
    features: JSON.stringify(['West Rim Park Entrance Pass', 'Hot Breakfast Sandwich & Coffee', 'Mojave Desert & Joshua Tree Photo Stops', 'Luxury Mercedes Sprinter Shuttle'])
  },
  {
    id: 'gc-west-skywalk',
    tour_id: 'grand-canyon-west',
    name: 'Skywalk VIP Experience',
    subtitle: 'Includes Skywalk Glass Bridge Ticket & Scenic Lunch',
    price: 147.00,
    original_price: 189.00,
    badge: 'Most Popular',
    pickup: 1,
    admission: 1,
    breakfast: 1,
    lunch: 1,
    skywalk: 1,
    features: JSON.stringify(['VIP Skywalk Glass Bridge Access', 'Gourmet Picnic Lunch at Guano Point', 'All Classic Explorer Package Benefits', 'Guaranteed Front Row/Window Seating Options'])
  },
  {
    id: 'hoover-classic',
    tour_id: 'hoover-dam-express',
    name: 'Hoover Dam Express Shuttle',
    subtitle: 'Top of Dam Walk & Bypass Bridge Views',
    price: 65.00,
    original_price: 85.00,
    badge: 'Best Price',
    pickup: 1,
    admission: 1,
    breakfast: 1,
    lunch: 0,
    skywalk: 0,
    features: JSON.stringify(['Strip Hotel Express Pickup', 'Bypass Bridge Walkway Access', 'Welcome to Las Vegas Sign Stop', 'Complimentary Bottled Water & Snacks'])
  }
];

const HOTELS = [
  { id: 'bellagio', name: 'Bellagio Las Vegas', zone: 'Central Strip', pickup_time: '6:15 AM', location: 'Underground Bus Concourse' },
  { id: 'caesars', name: 'Caesars Palace', zone: 'Central Strip', pickup_time: '6:20 AM', location: 'Main Entrance Valet' },
  { id: 'mgm-grand', name: 'MGM Grand', zone: 'South Strip', pickup_time: '6:00 AM', location: 'Underground Tour Bus Lobby' },
  { id: 'venetian', name: 'The Venetian Resort', zone: 'North Strip', pickup_time: '6:30 AM', location: 'Lower Level Porte-Cochère' }
];

async function seed() {
  console.log("Seeding Supabase data...");

  const { error: tErr } = await supabase.from('tours').upsert(TOURS);
  if (tErr) console.error("Error seeding tours:", tErr);
  else console.log("Tours seeded.");

  const { error: pErr } = await supabase.from('packages').upsert(PACKAGES);
  if (pErr) console.error("Error seeding packages:", pErr);
  else console.log("Packages seeded.");

  const { error: hErr } = await supabase.from('hotels').upsert(HOTELS);
  if (hErr) console.error("Error seeding hotels:", hErr);
  else console.log("Hotels seeded.");

  console.log("Supabase seeding script complete.");
}

seed();
