-- Christianson Tours Database Schema (SQLite3)

CREATE TABLE IF NOT EXISTS tours (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT,
  badge TEXT,
  rating REAL DEFAULT 4.9,
  review_count INTEGER DEFAULT 0,
  duration TEXT NOT NULL,
  duration_type TEXT NOT NULL,
  category TEXT NOT NULL,
  starting_price REAL NOT NULL,
  hero_image TEXT,
  summary TEXT,
  highlights TEXT -- JSON array of strings
);

CREATE TABLE IF NOT EXISTS packages (
  id TEXT PRIMARY KEY,
  tour_id TEXT NOT NULL,
  name TEXT NOT NULL,
  subtitle TEXT,
  price REAL NOT NULL,
  original_price REAL,
  badge TEXT,
  pickup INTEGER DEFAULT 1,
  admission INTEGER DEFAULT 1,
  breakfast INTEGER DEFAULT 1,
  lunch INTEGER DEFAULT 0,
  skywalk INTEGER DEFAULT 0,
  features TEXT, -- JSON array of strings
  FOREIGN KEY (tour_id) REFERENCES tours (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS itineraries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tour_id TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  time TEXT NOT NULL,
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  image TEXT,
  icon TEXT,
  FOREIGN KEY (tour_id) REFERENCES tours (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS addons (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  tours TEXT -- JSON array of tour IDs
);

CREATE TABLE IF NOT EXISTS hotels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  zone TEXT NOT NULL,
  pickup_time TEXT NOT NULL,
  location TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author TEXT NOT NULL,
  rating INTEGER DEFAULT 5,
  date TEXT NOT NULL,
  tour_name TEXT NOT NULL,
  tags TEXT, -- JSON array of tags
  comment TEXT NOT NULL,
  owner_response TEXT,
  status TEXT DEFAULT 'APPROVED' -- APPROVED, PENDING
);

CREATE TABLE IF NOT EXISTS faqs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS availability (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tour_id TEXT NOT NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD
  max_capacity INTEGER DEFAULT 30,
  booked_seats INTEGER DEFAULT 0,
  UNIQUE(tour_id, date),
  FOREIGN KEY (tour_id) REFERENCES tours (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY, -- e.g. CT-98421
  tour_id TEXT NOT NULL,
  package_id TEXT NOT NULL,
  date TEXT NOT NULL,
  adults INTEGER DEFAULT 1,
  kids INTEGER DEFAULT 0,
  hotel_id TEXT NOT NULL,
  hotel_name TEXT NOT NULL,
  pickup_time TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT,
  addons TEXT, -- JSON array of selected addon IDs
  total_price REAL NOT NULL,
  status TEXT DEFAULT 'CONFIRMED', -- PENDING, CONFIRMED, CANCELLED
  payment_status TEXT DEFAULT 'PAID', -- PENDING, PAID, REFUNDED
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tour_id) REFERENCES tours (id)
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
