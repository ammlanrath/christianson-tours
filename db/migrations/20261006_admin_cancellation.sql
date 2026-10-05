-- Atomic RPC for Admin Cancellation
CREATE OR REPLACE FUNCTION public.admin_cancel_booking(
  p_booking_id VARCHAR
) RETURNS JSONB AS $$
DECLARE
  v_booking RECORD;
  v_guests INT;
BEGIN
  -- Lock the booking to ensure no race with Stripe/Expiration
  SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Booking not found');
  END IF;

  IF v_booking.status = 'CANCELLED' THEN
    RETURN jsonb_build_object('success', true, 'already_cancelled', true, 'released_guests', 0);
  END IF;

  v_guests := v_booking.adults + v_booking.kids;

  -- Safely decrement capacity with guards
  UPDATE public.availability 
  SET booked_seats = booked_seats - v_guests 
  WHERE tour_id = v_booking.tour_id AND date = v_booking.date AND booked_seats >= v_guests;

  -- Mark Cancelled atomically
  -- If it was PAID, it stays PAID (so admin knows it needs refunding)
  -- Or if it was UNPAID/PENDING, it becomes FAILED
  UPDATE public.bookings 
  SET 
    status = 'CANCELLED', 
    payment_status = CASE 
      WHEN payment_status = 'UNPAID' OR payment_status = 'PENDING' THEN 'FAILED'
      ELSE payment_status
    END
  WHERE id = v_booking.id;

  RETURN jsonb_build_object(
    'success', true, 
    'booking_id', p_booking_id, 
    'previous_status', v_booking.status, 
    'new_status', 'CANCELLED', 
    'released_guests', v_guests
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.admin_cancel_booking FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_cancel_booking TO service_role;
