# Christianson Tours — Supabase Integration & Deployment Guide

This project is fully prepared for Supabase backend integration with:
- **Supabase URL**: `https://lcpgrrmdurpkewvdycfi.supabase.co`

---

## 1. Database Setup (SQL Schema)

1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project (`lcpgrrmdurpkewvdycfi`).
3. Navigate to **SQL Editor** in the left navigation sidebar.
4. Click **New Query** and copy-paste the contents of [`db/supabase_schema.sql`](file:///d:/Project/Ammlanrath/p1/db/supabase_schema.sql).
5. Click **Run** to create all tables (`tours`, `packages`, `itineraries`, `addons`, `hotels`, `reviews`, `faqs`, `availability`, `bookings`) with Row Level Security (RLS) policies.

---

## 2. Setting Your Supabase Key

Add your Supabase Anon/Service Key to your local `.env` file:

```env
SUPABASE_URL=https://lcpgrrmdurpkewvdycfi.supabase.co
SUPABASE_KEY=your_actual_supabase_key_here
```

To prompt and set it securely via terminal:
```bash
printf "Enter SUPABASE_KEY: " && read -s val && echo && echo "SUPABASE_KEY=$val" >> .env && echo "Saved."
```

---

## 3. Seed Production Data

Once your `SUPABASE_KEY` is set in `.env`, run the seed script:

```bash
npm run seed:supabase
```

Or execute:
```bash
node db/seed_supabase.js
```

---

## 4. Features & Compatibility

- Both **SQLite** (local development) and **Supabase** (cloud backend) are supported.
- Frontend API client (`js/api.js`) connects seamlessly to Express API (`server.js`), which handles database synchronization.
