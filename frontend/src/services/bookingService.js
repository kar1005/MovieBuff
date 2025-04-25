// src/services/bookingService.js
import axiosInstance from './axiosConfig';

const BASE_URL = '/bookings';

const bookingService = {
  // Get all bookings with optional filters
  getAllBookings: async (status, movieId, theaterId) => {
    try {
      let params = {};
      if (status) params.status = status;
      if (movieId) params.movieId = movieId;
      if (theaterId) params.theaterId = theaterId;
      
      const response = await axiosInstance.get(BASE_URL, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Failed to fetch bookings';
    }
  },

  // Get booking by ID
  getBookingById: async (id) => {
    try {
      const response = await axiosInstance.get(`${BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to fetch booking with ID ${id}`;
    }
  },

  // Get booking by booking number
  getBookingByNumber: async (bookingNumber) => {
    try {
      const response = await axiosInstance.get(`${BASE_URL}/number/${bookingNumber}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to fetch booking with number ${bookingNumber}`;
    }
  },

  // Get bookings for a user
  getUserBookings: async (userId) => {
    try {
      const response = await axiosInstance.get(`${BASE_URL}/user/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to fetch bookings for user ${userId}`;
    }
  },

  // Get bookings for a show
  getShowBookings: async (showId) => {
    try {
      const response = await axiosInstance.get(`${BASE_URL}/show/${showId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to fetch bookings for show ${showId}`;
    }
  },

  // Create a new booking manually
  createBooking: async (bookingData) => {
    try {
      const response = await axiosInstance.post(BASE_URL, bookingData);
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Failed to create booking';
    }
  },

  // Initiate a new booking (first step)
  initiateBooking: async (bookingData) => {
    try {
      const response = await axiosInstance.post(`${BASE_URL}/initiate`, bookingData);
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Failed to initiate booking';
    }
  },

  // Confirm a booking after payment (second step)
  confirmBooking: async (paymentData) => {
    try {
      const response = await axiosInstance.post(`${BASE_URL}/confirm`, paymentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Failed to confirm booking';
    }
  },

  // Update an existing booking
  updateBooking: async (id, bookingData) => {
    try {
      const response = await axiosInstance.put(`${BASE_URL}/${id}`, bookingData);
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to update booking ${id}`;
    }
  },

  // Delete a booking
  deleteBooking: async (id) => {
    try {
      await axiosInstance.delete(`${BASE_URL}/${id}`);
      return id;
    } catch (error) {
      throw error.response?.data || `Failed to delete booking ${id}`;
    }
  },

  // Cancel a booking
  cancelBooking: async (id, reason, cancelledBy) => {
    try {
      const response = await axiosInstance.post(`${BASE_URL}/${id}/cancel`, {
        reason,
        cancelledBy
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to cancel booking ${id}`;
    }
  },

  // Request a refund for a booking
  requestRefund: async (id) => {
    try {
      const response = await axiosInstance.post(`${BASE_URL}/${id}/request-refund`);
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to request refund for booking ${id}`;
    }
  },

  // Process a refund for a booking
  processRefund: async (id, refundData) => {
    try {
      const response = await axiosInstance.post(`${BASE_URL}/${id}/process-refund`, refundData);
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to process refund for booking ${id}`;
    }
  },

  // Generate a ticket for a booking
  generateTicket: async (id) => {
    try {
      const response = await axiosInstance.post(`${BASE_URL}/${id}/generate-ticket`);
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to generate ticket for booking ${id}`;
    }
  },

  // Get the QR code for a booking
  getTicketQRCode: async (id) => {
    try {
      const response = await axiosInstance.get(`${BASE_URL}/${id}/qr-code`);
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to get QR code for booking ${id}`;
    }
  },

  // Send ticket notification
  sendTicketNotification: async (id, notificationOptions) => {
    try {
      const response = await axiosInstance.post(`${BASE_URL}/${id}/send-notification`, notificationOptions);
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to send notification for booking ${id}`;
    }
  },

  // Check in a booking at the theater
  checkInBooking: async (bookingNumber) => {
    try {
      const response = await axiosInstance.get(`${BASE_URL}/check-in/${bookingNumber}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to check in booking ${bookingNumber}`;
    }
  },

  // Get booking analytics
  getBookingAnalytics: async (startDate, endDate, movieId, theaterId) => {
    try {
      let params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (movieId) params.movieId = movieId;
      if (theaterId) params.theaterId = theaterId;
      
      const response = await axiosInstance.get(`${BASE_URL}/analytics`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Failed to fetch booking analytics';
    }
  },

  // Get all booked seats for a specific show
  getBookedSeats: async (showId) => {
    try {
      const response = await axiosInstance.get(`${BASE_URL}/show/${showId}/booked-seats`);
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to fetch booked seats for show ${showId}`;
    }
  },

  // Get all reserved (temporarily held) seats for a show
  getReservedSeats: async (showId) => {
    try {
      const response = await axiosInstance.get(`${BASE_URL}/show/${showId}/reserved-seats`);
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to fetch reserved seats for show ${showId}`;
    }
  },

  // Reserve a single seat
  reserveSeat: async (showId, seatId) => {
    try {
      const response = await axiosInstance.post(`${BASE_URL}/reserve`, { 
        showId, 
        seatId 
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to reserve seat ${seatId} for show ${showId}`;
    }
  },

  // Reserve multiple seats at once
  reserveSeats: async (showId, seatIds) => {
    try {
      const response = await axiosInstance.post(`${BASE_URL}/reserve-multiple`, { 
        showId, 
        seatIds 
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to reserve seats for show ${showId}`;
    }
  },

  // Release a single reserved seat
  releaseSeat: async (showId, seatId) => {
    try {
      const response = await axiosInstance.post(`${BASE_URL}/release`, { 
        showId, 
        seatId 
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to release seat ${seatId} for show ${showId}`;
    }
  },
  
  // Release multiple seats at once
  releaseSeats: async (showId, seatIds) => {
    try {
      const response = await axiosInstance.post(`${BASE_URL}/release-multiple`, { 
        showId, 
        seatIds 
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to release seats for show ${showId}`;
    }
  },
  
  // Create a temporary booking record
  createTemporaryBooking: async (showId) => {
    try {
      const response = await axiosInstance.post(`${BASE_URL}/create-temporary`, { 
        showId 
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to create temporary booking for show ${showId}`;
    }
  },
  
  // Confirm seat reservation - transition from reserved to booked
  confirmReservation: async (showId, seatIds, bookingId) => {
    try {
      const response = await axiosInstance.post(`${BASE_URL}/confirm-reservation`, {
        showId,
        seatIds,
        bookingId
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to confirm reservation for booking ${bookingId}`;
    }
  },
  
  // Finalize booking after payment
  finalizeBooking: async (bookingId, paymentDetails) => {
    try {
      const response = await axiosInstance.post(`${BASE_URL}/finalize/${bookingId}`, paymentDetails);
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to finalize booking ${bookingId}`;
    }
  },

  // Check seat availability before attempting to reserve
  checkSeatAvailability: async (showId, seatIds) => {
    try {
      const response = await axiosInstance.post(`${BASE_URL}/check-availability`, {
        showId,
        seatIds
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to check seat availability for show ${showId}`;
    }
  },

  // Get reservation details by token
  getReservationByToken: async (token) => {
    try {
      const response = await axiosInstance.get(`${BASE_URL}/reservation/${token}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to get reservation with token ${token}`;
    }
  },

  // Manually expire reservations for a show (admin operation)
  expireReservations: async (showId) => {
    try {
      const response = await axiosInstance.post(`${BASE_URL}/expire-reservations/${showId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to expire reservations for show ${showId}`;
    }
  },

  // Schedule reservation expiry
  scheduleReservationExpiry: async (reservationId, timeoutMinutes) => {
    try {
      const response = await axiosInstance.post(`${BASE_URL}/schedule-expiry`, {
        reservationId,
        timeoutMinutes
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to schedule expiry for reservation ${reservationId}`;
    }
  },

  // Admin endpoint to manually expire all reservations
  expireAllReservations: async () => {
    try {
      const response = await axiosInstance.post(`${BASE_URL}/expire-all-reservations`);
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Failed to expire all reservations';
    }
  }
};

export default bookingService;