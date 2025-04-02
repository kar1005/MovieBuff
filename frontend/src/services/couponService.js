// src/services/couponService.js
import axiosInstance from './axiosConfig';

const BASE_URL = '/coupons';

const couponService = {
  // Get all coupons with optional filters
  getAllCoupons: async (status, campaignId) => {
    try {
      let params = {};
      if (status) params.status = status;
      if (campaignId) params.campaignId = campaignId;
      
      const response = await axiosInstance.get(BASE_URL, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Failed to fetch coupons';
    }
  },

  // Get coupon by ID
  getCouponById: async (id) => {
    try {
      const response = await axiosInstance.get(`${BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to fetch coupon with ID ${id}`;
    }
  },

  // Get coupon by code
  getCouponByCode: async (code) => {
    try {
      const response = await axiosInstance.get(`${BASE_URL}/code/${code}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to fetch coupon with code ${code}`;
    }
  },

  // Create a new coupon
  createCoupon: async (couponData) => {
    try {
      const response = await axiosInstance.post(BASE_URL, couponData);
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Failed to create coupon';
    }
  },

  // Update an existing coupon
  updateCoupon: async (id, couponData) => {
    try {
      const response = await axiosInstance.put(`${BASE_URL}/${id}`, couponData);
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to update coupon ${id}`;
    }
  },

  // Delete a coupon
  deleteCoupon: async (id) => {
    try {
      await axiosInstance.delete(`${BASE_URL}/${id}`);
      return id;
    } catch (error) {
      throw error.response?.data || `Failed to delete coupon ${id}`;
    }
  },

  // Update coupon status
  updateCouponStatus: async (id, status, reason) => {
    try {
      const response = await axiosInstance.patch(`${BASE_URL}/${id}/status`, {
        status,
        reason
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to update status for coupon ${id}`;
    }
  },

  // Validate a coupon for a specific booking
  validateCoupon: async (code, userId, movieId, theaterId, experience, city, bookingAmount) => {
    try {
      let params = {
        code,
        userId,
        bookingAmount
      };
      
      if (movieId) params.movieId = movieId;
      if (theaterId) params.theaterId = theaterId;
      if (experience) params.experience = experience;
      if (city) params.city = city;
      
      const response = await axiosInstance.get(`${BASE_URL}/validate`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to validate coupon ${code}`;
    }
  },

  // Get applicable coupons for a user
  getUserApplicableCoupons: async (userId, movieId, theaterId, bookingAmount) => {
    try {
      let params = {};
      if (movieId) params.movieId = movieId;
      if (theaterId) params.theaterId = theaterId;
      if (bookingAmount) params.bookingAmount = bookingAmount;
      
      const response = await axiosInstance.get(`${BASE_URL}/user/${userId}`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to fetch applicable coupons for user ${userId}`;
    }
  },

  // Get coupon analytics
  getCouponAnalytics: async (campaignId, startDate, endDate) => {
    try {
      let params = {};
      if (campaignId) params.campaignId = campaignId;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const response = await axiosInstance.get(`${BASE_URL}/analytics`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Failed to fetch coupon analytics';
    }
  }
};

export default couponService;