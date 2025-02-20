// src/services/authService.js
import axiosInstance from './axiosConfig';
import { toast } from 'react-toastify';

const API_URL = '/auth';

export const authService = {
  login: async (credentials) => {
    const response = await axiosInstance.post(`${API_URL}/login`, credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  register: async (userData) => {
    return await axiosInstance.post(`${API_URL}/register`, userData);
  },

  registerTManager: async (userData) => {
    try {
      const response = await axiosInstance.post(`${API_URL}/registertmanager`, userData);

      if (response.data) {
        console.log("Service Response",JSON.stringify(response.data));
        toast.success('Theater manager registered successfully! Credentials have been sent via email.');
      }
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data || 'Registration failed service';
      toast.error(errorMessage);
      throw error;
    }
  },

  logout: async () => {
    localStorage.removeItem('token');
    return await axiosInstance.post(`${API_URL}/logout`);
  },

  getCurrentUser: async () => {
    return await axiosInstance.get(`${API_URL}/me`);
  }
};

export const { login, register, registerTManager, logout } = authService;
export default authService;