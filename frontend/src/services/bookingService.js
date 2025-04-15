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
  getBookedSeats(showId) {
    return axiosInstance.get(`${BASE_URL}/show/${showId}`).data;
  },

  // Get all reserved (temporarily held) seats for a show
  getReservedSeats(showId) {
    return axiosInstance.get(`${BASE_URL}/show/${showId}/reserved-seats`).data;
  },

  // Reserve a single seat
  reserveSeat(showId, seatId) {
    return axiosInstance.post(`${BASE_URL}/reserve`, { 
      showId, 
      seatId 
    }).data;
  },

  // Release a single reserved seat
  releaseSeat(showId, seatId) {
    return axiosInstance.post(`${BASE_URL}/release`, { 
      showId, 
      seatId 
    }).data;
  },
  
  // Release multiple seats at once
  releaseSeats(showId, seatIds) {
    return axiosInstance.post(`${BASE_URL}/release-multiple`, { 
      showId, 
      seatIds 
    }).data;
  },
  
  // Create a temporary booking record
  createTemporaryBooking(showId) {
    return axiosInstance.post(`${BASE_URL}/create-temporary`, { 
      showId 
    }).data;
  },
  
  // Confirm seat reservation - transition from reserved to booked
  confirmReservation(showId, seatIds, bookingId) {
    return axiosInstance.post(`${BASE_URL}/confirm`, {
      showId,
      seatIds,
      bookingId
    }).data;
  },
  
  // Finalize booking after payment
  finalizeBooking(bookingId, paymentDetails) {
    return axiosInstance.post(`${BASE_URL}/finalize/${bookingId}`, paymentDetails).data;
  },
  
  // Get booking details
  getBookingById(bookingId) {
    return axiosInstance.get(`${BASE_URL}/${bookingId}`).data;
  },

};

export default bookingService;