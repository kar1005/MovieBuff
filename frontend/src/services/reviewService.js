// src/services/reviewService.js
import axiosInstance from './axiosConfig';

const BASE_URL = '/reviews';

const reviewService = {
  // Get all reviews with optional filters
  getAllReviews: async (movieId, status) => {
    try {
      let params = {};
      if (movieId) params.movieId = movieId;
      if (status) params.status = status;
      
      const response = await axiosInstance.get(BASE_URL, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Failed to fetch reviews';
    }
  },

  // Get review by ID
  getReviewById: async (id) => {
    try {
      const response = await axiosInstance.get(`${BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to fetch review with ID ${id}`;
    }
  },

  // Get reviews by user ID
  getUserReviews: async (userId) => {
    try {
      const response = await axiosInstance.get(`${BASE_URL}/user/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to fetch reviews for user ${userId}`;
    }
  },

  // Get reviews by movie ID
  getMovieReviews: async (movieId, status) => {
    try {
      let params = {};
      if (status) params.status = status;
      
      const response = await axiosInstance.get(`${BASE_URL}/movie/${movieId}`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to fetch reviews for movie ${movieId}`;
    }
  },

  // Create a new review
  createReview: async (reviewData) => {
    try {
      const response = await axiosInstance.post(BASE_URL, reviewData);
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Failed to create review';
    }
  },

  // Update an existing review
  updateReview: async (id, reviewData) => {
    try {
      const response = await axiosInstance.put(`${BASE_URL}/${id}`, reviewData);
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to update review ${id}`;
    }
  },

  // Delete a review
  deleteReview: async (id) => {
    try {
      await axiosInstance.delete(`${BASE_URL}/${id}`);
      return id;
    } catch (error) {
      throw error.response?.data || `Failed to delete review ${id}`;
    }
  },

  // Moderate a review
  moderateReview: async (id, moderationData) => {
    try {
      const response = await axiosInstance.patch(`${BASE_URL}/${id}/moderate`, moderationData);
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to moderate review ${id}`;
    }
  },

  // Mark a review as helpful
  markHelpful: async (id, userId) => {
    try {
      const response = await axiosInstance.post(`${BASE_URL}/${id}/helpful`, { userId });
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to mark review ${id} as helpful`;
    }
  },

  // Mark a review as unhelpful
  markUnhelpful: async (id, userId) => {
    try {
      const response = await axiosInstance.post(`${BASE_URL}/${id}/unhelpful`, { userId });
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to mark review ${id} as unhelpful`;
    }
  },

  // Report a review
  reportReview: async (id, reportData) => {
    try {
      const response = await axiosInstance.post(`${BASE_URL}/${id}/report`, reportData);
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to report review ${id}`;
    }
  },

  // Get review statistics for a movie
  getReviewStats: async (movieId) => {
    try {
      const response = await axiosInstance.get(`${BASE_URL}/stats/${movieId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to fetch review stats for movie ${movieId}`;
    }
  }
};

export default reviewService;