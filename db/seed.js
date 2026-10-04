/**
 * Christianson Tours — Database Seeder
 * Populates db/christianson.db from static data and creates admin credentials.
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'christianson.db');
const schemaPath = path.join(__dirname, 'schema.sql');

// Load static data from data.js
const dataJsContent = fs.readFileSync(path.join(__dirname, '..', 'data.js'), 'utf8');
const dataMatch = dataJsContent.match(/window\.CHRISTIANSON_DATA\s*=\s*(\{[\s\S]*\});/);

if (!dataMatch) {
  console.error("Could not parse data.js!");
  process.exit(1);
}

const CHRISTIANSON_DATA = eval('(' + dataMatch[1] + ')');

const db = new sqlite3.Database(dbPath);

db.serialize(async () => {
  console.log("Initializing database schema...");
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  
  db.exec(schemaSql, (err) => {
    if (err) {
      console.error("Error creating schema:", err);
      process.exit(1);
    }
  });

  // Clear existing tables
  db.run("DELETE FROM tours");
  db.run("DELETE FROM packages");
  db.run("DELETE FROM itineraries");
  db.run("DELETE FROM addons");
  db.run("DELETE FROM hotels");
  db.run("DELETE FROM reviews");
  db.run("DELETE FROM faqs");
  db.run("DELETE FROM users");

  // 1. Seed Tours & Packages & Itineraries
  const stmtTour = db.prepare(`INSERT INTO tours (id, slug, name, tagline, badge, rating, review_count, duration, duration_type, category, starting_price, hero_image, summary, highlights) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const stmtPkg = db.prepare(`INSERT INTO packages (id, tour_id, name, subtitle, price, original_price, badge, pickup, admission, breakfast, lunch, skywalk, features) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const stmtItin = db.prepare(`INSERT INTO itineraries (tour_id, step_order, time, title, location, description, image, icon) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

  for (const tour of CHRISTIANSON_DATA.tours) {
    stmtTour.run(
      tour.id,
      tour.slug,
      tour.name,
      tour.tagline,
      tour.badge,
      tour.rating,
      tour.reviewCount,
      tour.duration,
      tour.durationType,
      tour.category,
      tour.startingPrice,
      tour.heroImage,
      tour.summary,
      JSON.stringify(tour.highlights)
    );

    for (const pkg of tour.packages) {
      stmtPkg.run(
        pkg.id,
        tour.id,
        pkg.name,
        pkg.subtitle,
        pkg.price,
        pkg.originalPrice,
        pkg.badge,
        pkg.pickup ? 1 : 0,
        pkg.admission ? 1 : 0,
        pkg.breakfast ? 1 : 0,
        pkg.lunch ? 1 : 0,
        pkg.skywalk ? 1 : 0,
        JSON.stringify(pkg.features)
      );
    }

    if (tour.itinerary) {
      tour.itinerary.forEach((step, idx) => {
        stmtItin.run(
          tour.id,
          idx + 1,
          step.time,
          step.title,
          step.location,
          step.description,
          step.image,
          step.icon
        );
      });
    }
  }

  stmtTour.finalize();
  stmtPkg.finalize();
  stmtItin.finalize();

  // 2. Seed Addons
  const stmtAddon = db.prepare(`INSERT INTO addons (id, name, description, price, tours) VALUES (?, ?, ?, ?, ?)`);
  for (const addon of CHRISTIANSON_DATA.addons) {
    stmtAddon.run(addon.id, addon.name, addon.description, addon.price, JSON.stringify(addon.tours));
  }
  stmtAddon.finalize();

  // 3. Seed Hotels
  const stmtHotel = db.prepare(`INSERT INTO hotels (id, name, zone, pickup_time, location) VALUES (?, ?, ?, ?, ?)`);
  for (const hotel of CHRISTIANSON_DATA.hotels) {
    stmtHotel.run(hotel.id, hotel.name, hotel.zone, hotel.pickupTime, hotel.location);
  }
  stmtHotel.finalize();

  // 4. Seed Reviews
  const stmtRev = db.prepare(`INSERT INTO reviews (author, rating, date, tour_name, tags, comment, owner_response, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const rev of CHRISTIANSON_DATA.reviews) {
    stmtRev.run(rev.author, rev.rating, rev.date, rev.tour, JSON.stringify(rev.tags), rev.comment, rev.ownerResponse, 'APPROVED');
  }
  stmtRev.finalize();

  // 5. Seed FAQs
  const stmtFaq = db.prepare(`INSERT INTO faqs (category, question, answer, display_order) VALUES (?, ?, ?, ?)`);
  CHRISTIANSON_DATA.faqs.forEach((faq, idx) => {
    stmtFaq.run(faq.category, faq.question, faq.answer, idx + 1);
  });
  stmtFaq.finalize();

  // 6. Seed Admin User (Username: admin, Password: admin123)
  const passwordHash = await bcrypt.hash('admin123', 10);
  db.run(`INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)`, ['admin', passwordHash, 'admin']);

  // 7. Seed Sample Bookings
  db.run(`INSERT INTO bookings (id, tour_id, package_id, date, adults, kids, hotel_id, hotel_name, pickup_time, guest_name, guest_email, guest_phone, addons, total_price, status, payment_status) VALUES 
    ('CT-98421', 'grand-canyon-west', 'best', '2026-10-15', 2, 0, 'bellagio', 'Bellagio Las Vegas', '6:20 AM', 'Krystal Thomas', 'krystal@example.com', '+1 702-555-0199', '["skywalk-pass"]', 298.0, 'CONFIRMED', 'PAID'),
    ('CT-84192', 'hoover-dam', 'hoover-standard', '2026-10-16', 1, 0, 'caesars', 'Caesars Palace', '6:30 AM', 'Donovan E.', 'donovan@example.com', '+1 702-555-0144', '[]', 50.0, 'CONFIRMED', 'PAID')
  `);

  console.log("Database seeded successfully with tours, packages, hotels, reviews, FAQs, admin credentials, and sample bookings!");
});
