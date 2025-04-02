// src/services/paymentService.js
import axiosInstance from './axiosConfig';

const paymentService = {
  // Subscription payments
  initiateSubscriptionPayment: async (subscriptionId, amount, currency = 'INR') => {
    try {
      const response = await axiosInstance.post('/subscriptions/payment/initiate', {
        subscriptionId,
        amount,
        currency
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Failed to initiate subscription payment';
    }
  },

  verifySubscriptionPayment: async (paymentData) => {
    try {
      const response = await axiosInstance.post('/subscriptions/payment/verify', paymentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Failed to verify subscription payment';
    }
  },

  // Booking payments - can be extended when you implement direct payment for bookings
  initiateBookingPayment: async (bookingId, amount, paymentMethod) => {
    try {
      const response = await axiosInstance.post('/bookings/payment/initiate', {
        bookingId,
        amount,
        paymentMethod
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Failed to initiate booking payment';
    }
  },
  
  verifyBookingPayment: async (paymentData) => {
    try {
      const response = await axiosInstance.post('/bookings/payment/verify', paymentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Failed to verify booking payment';
    }
  },
  
  // General payment methods that can be used across the application
  getPaymentHistory: async (userId, type) => {
    try {
      const params = { userId };
      if (type) params.type = type;
      
      const response = await axiosInstance.get('/payments/history', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Failed to fetch payment history';
    }
  },

  getPaymentDetails: async (paymentId) => {
    try {
      const response = await axiosInstance.get(`/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to fetch payment details for ${paymentId}`;
    }
  },
  
  // Refund processing
  processRefund: async (paymentId, amount, reason) => {
    try {
      const response = await axiosInstance.post('/payments/refund', {
        paymentId,
        amount,
        reason
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Failed to process refund';
    }
  },
  
  // Payment gateway specific methods
  getPaymentGateways: async () => {
    try {
      const response = await axiosInstance.get('/payments/gateways');
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Failed to fetch payment gateways';
    }
  },
  
  // Payment analytics for admin
  getPaymentAnalytics: async (startDate, endDate, type) => {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (type) params.type = type;
      
      const response = await axiosInstance.get('/payments/analytics', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Failed to fetch payment analytics';
    }
  }
};

export default paymentService;