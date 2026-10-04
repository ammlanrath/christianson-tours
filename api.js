/**
 * Christianson Tours — Unified Client API Layer
 * Configurable API client layer with environment-aware API_BASE_URL,
 * JWT session management, rich error classification, and fallback data support.
 */

(function () {
  const API_BASE_URL = window.API_BASE_URL || (
    window.location.protocol === 'file:'
      ? 'http://localhost:3000/api'
      : (window.location.origin + '/api')
  );

  const TOKEN_KEY = 'christianson_admin_token';

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function setToken(token) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }

  function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  }

  function isLoggedIn() {
    return !!getToken();
  }

  /**
   * Core HTTP request helper with unified error classification
   */
  async function fetchAPI(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, { ...options, headers });
      
      let data = {};
      try {
        data = await response.json();
      } catch (e) {
        data = { error: 'Invalid JSON response from server' };
      }

      if (!response.ok) {
        if (response.status === 401) {
          clearToken();
          const err = new Error(data.error || data.message || 'Session expired or unauthorized access.');
          err.code = 'UNAUTHORIZED';
          err.status = 401;
          throw err;
        }

        const err = new Error(data.error || data.message || `API request failed with status ${response.status}`);
        err.code = data.code || `HTTP_${response.status}`;
        err.status = response.status;
        throw err;
      }

      return data;
    } catch (err) {
      if (err.code || err.status) throw err;
      // Network fetch error (server connection failure)
      const networkErr = new Error('Server connection failed. Please check if backend server is running on port 3000.');
      networkErr.code = 'BACKEND_UNAVAILABLE';
      networkErr.status = 0;
      throw networkErr;
    }
  }

  window.CHRISTIANSON_API = {
    API_BASE_URL,
    getToken,
    setToken,
    clearToken,
    isLoggedIn,

    // ----------------------------------------------------
    // PUBLIC CLIENT ENDPOINTS
    // ----------------------------------------------------

    async getTours() {
      try {
        const res = await fetchAPI('/tours');
        if (res.tours && res.tours.length > 0) return res.tours;
      } catch (e) {
        console.warn("[API Layer] Using fallback static data for getTours:", e.message);
      }
      return (window.CHRISTIANSON_DATA && window.CHRISTIANSON_DATA.tours) ? window.CHRISTIANSON_DATA.tours : [];
    },

    async getTourById(id) {
      try {
        const res = await fetchAPI(`/tours/${id}`);
        if (res.id) return res;
      } catch (e) {
        console.warn(`[API Layer] Using fallback static data for getTourById(${id}):`, e.message);
      }
      return (window.CHRISTIANSON_DATA && window.CHRISTIANSON_DATA.tours)
        ? window.CHRISTIANSON_DATA.tours.find(t => t.id === id)
        : null;
    },

    async getHotels() {
      try {
        const res = await fetchAPI('/hotels');
        if (res.hotels) return res.hotels;
      } catch (e) {
        console.warn("[API Layer] Using fallback static data for getHotels:", e.message);
      }
      return (window.CHRISTIANSON_DATA && window.CHRISTIANSON_DATA.hotels) ? window.CHRISTIANSON_DATA.hotels : [];
    },

    async getAddons() {
      try {
        const res = await fetchAPI('/addons');
        if (res.addons) return res.addons;
      } catch (e) {
        console.warn("[API Layer] Using fallback static data for getAddons:", e.message);
      }
      return (window.CHRISTIANSON_DATA && window.CHRISTIANSON_DATA.addons) ? window.CHRISTIANSON_DATA.addons : [];
    },

    async getReviews() {
      try {
        const res = await fetchAPI('/reviews');
        if (res.reviews) return res.reviews;
      } catch (e) {
        console.warn("[API Layer] Using fallback static data for getReviews:", e.message);
      }
      return (window.CHRISTIANSON_DATA && window.CHRISTIANSON_DATA.reviews) ? window.CHRISTIANSON_DATA.reviews : [];
    },

    async getFaqs() {
      try {
        const res = await fetchAPI('/faqs');
        if (res.faqs) return res.faqs;
      } catch (e) {
        console.warn("[API Layer] Using fallback static data for getFaqs:", e.message);
      }
      return (window.CHRISTIANSON_DATA && window.CHRISTIANSON_DATA.faqs) ? window.CHRISTIANSON_DATA.faqs : [];
    },

    async getAvailability(tourId, date) {
      try {
        return await fetchAPI(`/availability?tourId=${encodeURIComponent(tourId)}&date=${encodeURIComponent(date)}`);
      } catch (e) {
        return { isAvailable: true, remainingSeats: 25, maxCapacity: 30 };
      }
    },

    async createBooking(bookingPayload) {
      try {
        return await fetchAPI('/bookings/create', {
          method: 'POST',
          body: JSON.stringify(bookingPayload)
        });
      } catch (e) {
        if (e.code === 'BACKEND_UNAVAILABLE') {
          console.warn("[API Layer] Server offline. Simulating local demo booking reference.");
          return {
            success: true,
            bookingReference: 'CT-' + Math.floor(10000 + Math.random() * 90000),
            totalPrice: bookingPayload.totalPrice || 97,
            guestName: bookingPayload.guestName,
            hotelName: bookingPayload.hotelName || 'Las Vegas Hotel',
            pickupTime: bookingPayload.pickupTime || '6:20 AM',
            date: bookingPayload.date,
            status: 'CONFIRMED',
            paymentStatus: 'PAID',
            demoMode: true
          };
        }
        throw e;
      }
    },

    async confirmPayment(bookingId) {
      return await fetchAPI('/payments/mock-confirm', {
        method: 'POST',
        body: JSON.stringify({ bookingId })
      });
    },

    // ----------------------------------------------------
    // AUTHENTICATION & ADMIN CMS ENDPOINTS
    // ----------------------------------------------------

    async login(username, password) {
      const data = await fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });

      if (data.token) {
        setToken(data.token);
      }
      return data;
    },

    async getAdminDashboard() {
      return await fetchAPI('/admin/dashboard');
    },

    async getAdminBookings() {
      return await fetchAPI('/admin/bookings');
    },

    async updateBookingStatus(bookingId, status, paymentStatus) {
      return await fetchAPI(`/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, payment_status: paymentStatus })
      });
    },

    async updateTour(tourId, tourData) {
      return await fetchAPI(`/admin/tours/${tourId}`, {
        method: 'PUT',
        body: JSON.stringify(tourData)
      });
    },

    async setAvailability(tourId, date, maxCapacity) {
      return await fetchAPI('/admin/availability', {
        method: 'POST',
        body: JSON.stringify({ tourId, date, maxCapacity })
      });
    },

    async moderateReview(reviewId, status) {
      return await fetchAPI(`/admin/reviews/${reviewId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    }
  };
})();
