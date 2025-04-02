// src/services/subscriptionService.js
import axiosInstance from './axiosConfig';

// Service that handles both subscription plans and subscriptions
const subscriptionService = {
  // SUBSCRIPTION PLANS
  // ==================
  getAllPlans: async (activeOnly, duration) => {
    try {
      let params = {};
      if (activeOnly !== undefined) params.activeOnly = activeOnly;
      if (duration) params.duration = duration;
      
      const response = await axiosInstance.get('/subscription-plans', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Failed to fetch subscription plans';
    }
  },

  getActivePlans: async () => {
    try {
      const response = await axiosInstance.get('/subscription-plans', {
        params: { activeOnly: true }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Failed to fetch active plans';
    }
  },

  getPlanById: async (id) => {
    try {
      const response = await axiosInstance.get(`/subscription-plans/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to fetch subscription plan with ID ${id}`;
    }
  },

  getPlanByName: async (name) => {
    try {
      const response = await axiosInstance.get(`/subscription-plans/by-name/${name}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to fetch subscription plan with name ${name}`;
    }
  },

  getPlansByDuration: async (duration) => {
    try {
      const response = await axiosInstance.get('/subscription-plans', { 
        params: { duration } 
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to fetch subscription plans with duration ${duration}`;
    }
  },

  // Admin operations for plans
  createPlan: async (planData) => {
    try {
      const response = await axiosInstance.post('/subscription-plans', planData);
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Failed to create subscription plan';
    }
  },

  updatePlan: async (id, planData) => {
    try {
      const response = await axiosInstance.put(`/subscription-plans/${id}`, planData);
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to update subscription plan ${id}`;
    }
  },

  deletePlan: async (id) => {
    try {
      await axiosInstance.delete(`/subscription-plans/${id}`);
      return id;
    } catch (error) {
      throw error.response?.data || `Failed to delete subscription plan ${id}`;
    }
  },

  togglePlanStatus: async (id) => {
    try {
      const response = await axiosInstance.patch(`/subscription-plans/${id}/toggle-status`);
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to toggle status for subscription plan ${id}`;
    }
  },

  // SUBSCRIPTIONS
  // =============
  // Subscription initiation and management
  initiateSubscription: async (managerId, planId) => {
    try {
      const response = await axiosInstance.post('/subscriptions', {
        managerId,
        planId
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Failed to initiate subscription';
    }
  },

  // Subscription information
  getSubscription: async (id) => {
    try {
      const response = await axiosInstance.get(`/subscriptions/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to fetch subscription with ID ${id}`;
    }
  },

  getManagerActiveSubscription: async (managerId) => {
    try {
      const response = await axiosInstance.get('/subscriptions/manager/active', {
        params: { managerId }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to fetch active subscription for manager ${managerId}`;
    }
  },

  getSubscriptionHistory: async (managerId) => {
    try {
      const response = await axiosInstance.get('/subscriptions/manager/history', {
        params: { managerId }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to fetch subscription history for manager ${managerId}`;
    }
  },

  checkSubscriptionStatus: async (managerId) => {
    try {
      const response = await axiosInstance.get('/subscriptions/manager/status', {
        params: { managerId }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to check subscription status for manager ${managerId}`;
    }
  }
};

export default subscriptionService;