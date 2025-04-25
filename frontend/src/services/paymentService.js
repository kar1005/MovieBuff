// src/services/paymentService.js
import axiosInstance from './axiosConfig';

const BASE_URL = '/payments';

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

  // Initiate payment for a booking
  initiateBookingPayment: async (bookingId, amount, currency = 'INR') => {
    try {
      // Log the values being sent
      console.log('Initiating payment with:', { bookingId, amount, currency });
      
      // We'll use the endpoint from the logs: /api/payments/booking/initiate
      const response = await axiosInstance.post('/payments/booking/initiate', {
        bookingId,
        amount: parseFloat(amount), // Ensure amount is a number
        currency
      });
      
      console.log('Payment initiation response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Payment initiation error:', error);
      
      // Log the full error object for debugging
      console.log('Full error:', error);
      
      // Extract detailed error information
      const errorData = error.response?.data;
      const errorStatus = error.response?.status;
      const errorMessage = 
        errorData?.message || 
        errorData?.error || 
        error.message ||
        'Failed to initiate payment';
      
      // Create a detailed error object
      const enhancedError = new Error(errorMessage);
      enhancedError.status = errorStatus;
      enhancedError.data = errorData;
      
      throw enhancedError;
    }
  },

  // Verify payment after completion
  verifyBookingPayment: async (verificationData) => {
    try {
      // Ensure all required verification fields are present
      const requiredFields = ['razorpayOrderId', 'razorpayPaymentId', 'razorpaySignature', 'bookingId'];
      requiredFields.forEach(field => {
        if (!verificationData[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      });

      const response = await axiosInstance.post('/payments/booking/verify', verificationData);
      return response.data;
    } catch (error) {
      console.error('Payment verification error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message ||
                          'Failed to verify payment';
      throw new Error(errorMessage);
    }
  },

  // Process refund if needed
  processRefund: async (bookingId, amount, reason = 'Customer requested refund') => {
    try {
      const response = await axiosInstance.post('/payments/booking/refund', {
        bookingId,
        amount: parseFloat(amount),
        reason
      });
      return response.data;
    } catch (error) {
      console.error('Refund processing error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Failed to process refund';
      throw new Error(errorMessage);
    }
  },

  // Get available payment gateways
  getPaymentGateways: async () => {
    try {
      const response = await axiosInstance.get('/payments/gateways');
      return response.data;
    } catch (error) {
      console.error('Error fetching payment gateways:', error);
      throw new Error('Failed to fetch payment gateways');
    }
  },

  // Get payment analytics (admin function)
  getPaymentAnalytics: async (startDate, endDate) => {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const response = await axiosInstance.get('/payments/analytics', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching payment analytics:', error);
      throw new Error('Failed to fetch payment analytics');
    }
  }

};

export default paymentService;