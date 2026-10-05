-- Supabase Migration: Booking Transaction and Stripe Idempotency

-- 1. Add Stripe tracking columns and reservation expiration
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(255) UNIQUE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255) UNIQUE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- 2. Fix dangerous defaults and enforce strict state lifecycles
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check 
  CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'));
ALTER TABLE public.bookings ALTER COLUMN status SET DEFAULT 'PENDING';

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_payment_status_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_payment_status_check 
  CHECK (payment_status IN ('UNPAID', 'PENDING', 'PAID', 'FAILED', 'REFUNDED'));
ALTER TABLE public.bookings ALTER COLUMN payment_status SET DEFAULT 'UNPAID';

-- 3. Prevent booking ID collisions
ALTER TABLE public.bookings ADD CONSTRAINT bookings_id_unique UNIQUE(id);

-- 4. Atomic RPC Function for Booking Creation
CREATE OR REPLACE FUNCTION public.create_booking_atomic(
  p_booking_id VARCHAR,
  p_tour_id VARCHAR,
  p_package_id VARCHAR,
  p_hotel_id VARCHAR,
  p_date VARCHAR,
  p_adults INT,
  p_kids INT,
  p_guest_name VARCHAR,
  p_guest_email VARCHAR,
  p_guest_phone VARCHAR,
  p_addon_ids VARCHAR[]
) RETURNS JSON AS $$
DECLARE
  v_avail RECORD;
  v_tour RECORD;
  v_package RECORD;
  v_hotel RECORD;
  v_total_guests INT := p_adults + p_kids;
  v_calculated_total DECIMAL(10,2) := 0;
  v_addon_price DECIMAL(10,2) := 0;
  v_addon_json JSONB := '[]'::JSONB;
  v_requested_addon_count INT := array_length(p_addon_ids, 1);
  v_matched_addon_count INT := 0;
BEGIN
  -- 1. Lock Availability Row (waits in queue if concurrent)
  SELECT * INTO v_avail FROM public.availability 
  WHERE tour_id = p_tour_id AND date = p_date FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'code', 'AVAILABILITY_NOT_CONFIGURED');
  END IF;

  -- 2. Verify Capacity 
  IF (v_avail.booked_seats + v_total_guests) > v_avail.max_capacity THEN
    RETURN json_build_object('success', false, 'code', 'INSUFFICIENT_CAPACITY');
  END IF;

  -- 3. Validate Tour & Package Ownership
  SELECT * INTO v_tour FROM public.tours WHERE id = p_tour_id;
  IF NOT FOUND THEN RETURN json_build_object('success', false, 'code', 'INVALID_TOUR'); END IF;

  SELECT * INTO v_package FROM public.packages WHERE id = p_package_id AND tour_id = p_tour_id;
  IF NOT FOUND THEN RETURN json_build_object('success', false, 'code', 'INVALID_PACKAGE'); END IF;

  -- 4. Validate Hotel
  SELECT * INTO v_hotel FROM public.hotels WHERE id = p_hotel_id;
  IF NOT FOUND THEN RETURN json_build_object('success', false, 'code', 'INVALID_HOTEL'); END IF;

  -- 5. Calculate Base Price
  v_calculated_total := v_package.price * v_total_guests;

  -- 6. Validate Addons & Calculate Addon Price
  IF v_requested_addon_count > 0 THEN
    -- Check for duplicate IDs in request
    IF (SELECT count(DISTINCT unnest(p_addon_ids))) != v_requested_addon_count THEN
      RETURN json_build_object('success', false, 'code', 'INVALID_ADDON');
    END IF;

    SELECT COUNT(*), COALESCE(SUM(price), 0), COALESCE(jsonb_agg(jsonb_build_object('id', id, 'name', name, 'price', price)), '[]'::JSONB)
    INTO v_matched_addon_count, v_addon_price, v_addon_json
    FROM public.addons 
    WHERE id = ANY(p_addon_ids) AND tours ? p_tour_id; 

    IF v_matched_addon_count != v_requested_addon_count THEN
       RETURN json_build_object('success', false, 'code', 'INVALID_ADDON');
    END IF;

    v_calculated_total := v_calculated_total + (v_addon_price * v_total_guests);
  END IF;

  -- 7. Reserve Capacity (Increment booked_seats)
  UPDATE public.availability 
  SET booked_seats = booked_seats + v_total_guests 
  WHERE id = v_avail.id;

  -- 8. Create PENDING booking (Locks capacity, awaits Stripe)
  INSERT INTO public.bookings (
    id, tour_id, package_id, date, adults, kids, hotel_id, hotel_name, pickup_time, 
    guest_name, guest_email, guest_phone, addons, total_price, status, payment_status, expires_at
  ) VALUES (
    p_booking_id, p_tour_id, p_package_id, p_date, p_adults, p_kids, p_hotel_id, v_hotel.name, v_hotel.pickup_time,
    p_guest_name, p_guest_email, p_guest_phone, v_addon_json, v_calculated_total, 'PENDING', 'UNPAID', (NOW() + INTERVAL '30 minutes')
  );

  RETURN json_build_object('success', true, 'booking_id', p_booking_id, 'total_price', v_calculated_total);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.create_booking_atomic FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_booking_atomic TO service_role;

-- 5. Atomic RPC for Releasing Reservations
CREATE OR REPLACE FUNCTION public.cancel_reservation(
  p_booking_id VARCHAR
) RETURNS VOID AS $$
DECLARE
  v_booking RECORD;
  v_guests INT;
BEGIN
  -- Lock the booking to ensure no race with Stripe
  SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
  
  -- If already CONFIRMED or CANCELLED, do nothing
  IF NOT FOUND OR v_booking.status != 'PENDING' THEN
    RETURN;
  END IF;

  v_guests := v_booking.adults + v_booking.kids;

  -- Safely decrement capacity with guards
  UPDATE public.availability 
  SET booked_seats = booked_seats - v_guests 
  WHERE tour_id = v_booking.tour_id AND date = v_booking.date AND booked_seats >= v_guests;

  -- Mark Cancelled atomically
  UPDATE public.bookings 
  SET status = 'CANCELLED', payment_status = 'FAILED' 
  WHERE id = v_booking.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.cancel_reservation FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_reservation TO service_role;

-- 6. Cron Job Logic (release_expired_bookings)
CREATE OR REPLACE FUNCTION public.release_expired_bookings() RETURNS VOID AS $$
DECLARE
  v_booking RECORD;
  v_guests INT;
BEGIN
  FOR v_booking IN 
    SELECT * FROM public.bookings WHERE status = 'PENDING' AND expires_at < NOW() FOR UPDATE SKIP LOCKED
  LOOP
    v_guests := v_booking.adults + v_booking.kids;
    -- Safely decrement capacity
    UPDATE public.availability 
    SET booked_seats = booked_seats - v_guests 
    WHERE tour_id = v_booking.tour_id AND date = v_booking.date AND booked_seats >= v_guests;
    
    -- Mark Cancelled
    UPDATE public.bookings 
    SET status = 'CANCELLED', payment_status = 'FAILED' 
    WHERE id = v_booking.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.release_expired_bookings FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.release_expired_bookings TO service_role;
