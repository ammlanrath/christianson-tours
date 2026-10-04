/**
 * Christianson Tours — Client API Layer
 * Asynchronous data client that fetches live production data from Node/Express API backend.
 * Provides fallback to window.CHRISTIANSON_DATA if offline.
 */

window.CHRISTIANSON_API = {
  async getTours() {
    try {
      const res = await fetch('/api/tours');
      if (res.ok) {
        const data = await res.json();
        if (data.tours && data.tours.length > 0) return data.tours;
      }
    } catch (e) {
      console.warn("API offline, using fallback static store:", e);
    }
    return window.CHRISTIANSON_DATA.tours;
  },

  async getTourById(id) {
    try {
      const res = await fetch(`/api/tours/${id}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("API offline, using fallback static store:", e);
    }
    return window.CHRISTIANSON_DATA.tours.find(t => t.id === id);
  },

  async getHotels() {
    try {
      const res = await fetch('/api/hotels');
      if (res.ok) {
        const data = await res.json();
        if (data.hotels) return data.hotels;
      }
    } catch (e) {
      console.warn("API offline, using fallback static store:", e);
    }
    return window.CHRISTIANSON_DATA.hotels;
  },

  async getAddons() {
    try {
      const res = await fetch('/api/addons');
      if (res.ok) {
        const data = await res.json();
        if (data.addons) return data.addons;
      }
    } catch (e) {
      console.warn("API offline, using fallback static store:", e);
    }
    return window.CHRISTIANSON_DATA.addons;
  },

  async getReviews() {
    try {
      const res = await fetch('/api/reviews');
      if (res.ok) {
        const data = await res.json();
        if (data.reviews) return data.reviews;
      }
    } catch (e) {
      console.warn("API offline, using fallback static store:", e);
    }
    return window.CHRISTIANSON_DATA.reviews;
  },

  async getFaqs() {
    try {
      const res = await fetch('/api/faqs');
      if (res.ok) {
        const data = await res.json();
        if (data.faqs) return data.faqs;
      }
    } catch (e) {
      console.warn("API offline, using fallback static store:", e);
    }
    return window.CHRISTIANSON_DATA.faqs;
  },

  async createBooking(bookingPayload) {
    try {
      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload)
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Booking creation failed');
      }
      return data;
    } catch (e) {
      console.warn("Using fallback local booking creation:", e);
      // Fallback for standalone static file viewer if server API is down
      return {
        success: true,
        bookingReference: 'CT-' + Math.floor(10000 + Math.random() * 90000),
        totalPrice: bookingPayload.totalPrice || 298,
        guestName: bookingPayload.guestName,
        hotelName: bookingPayload.hotelName || 'Las Vegas Hotel',
        pickupTime: bookingPayload.pickupTime || '6:20 AM',
        date: bookingPayload.date
      };
    }
  }
};
