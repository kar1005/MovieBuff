// src/services/subscriptionService.js
import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api';
const PLANS_URL = `${BASE_URL}/subscription-plans`;
const SUBSCRIPTIONS_URL = `${BASE_URL}/subscriptions`;

export const subscriptionService = {
    getAllPlans: async () => {
        try {
            const response = await axios.get(PLANS_URL);
            return response.data;
        } catch (error) {
            throw error.response?.data || 'Failed to fetch subscription plans';
        }
    },

    getActivePlans: async () => {
        try {
            const response = await axios.get(`${PLANS_URL}?activeOnly=true`);
            return response.data;
        } catch (error) {
            throw error.response?.data || 'Failed to fetch active plans';
        }
    },

    initiateSubscription: async (managerId, planId) => {
        try {
            const response = await axios.post(SUBSCRIPTIONS_URL, {
                managerId,
                planId
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || 'Failed to initiate subscription';
        }
    },

    initiatePayment: async (subscriptionId, amount) => {
        try {
            const response = await axios.post(`${SUBSCRIPTIONS_URL}/payment/initiate`, {
                subscriptionId,
                amount
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || 'Failed to initiate payment';
        }
    },

    verifyPayment: async (paymentData) => {
        try {
            const response = await axios.post(`${SUBSCRIPTIONS_URL}/payment/verify`, paymentData);
            return response.data;
        } catch (error) {
            throw error.response?.data || 'Failed to verify payment';
        }
    },

    getManagerActiveSubscription: async (managerId) => {
        try {
            const response = await axios.get(`${SUBSCRIPTIONS_URL}/manager/active?managerId=${managerId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || 'Failed to fetch active subscription';
        }
    },

    getSubscriptionHistory: async (managerId) => {
        try {
            const response = await axios.get(`${SUBSCRIPTIONS_URL}/manager/history?managerId=${managerId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || 'Failed to fetch subscription history';
        }
    },

    checkSubscriptionStatus: async (managerId) => {
        try {
            const response = await axios.get(`${SUBSCRIPTIONS_URL}/manager/status?managerId=${managerId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || 'Failed to check subscription status';
        }
    }
};

export default subscriptionService;