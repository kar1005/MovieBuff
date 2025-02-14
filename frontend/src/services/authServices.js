// src/services/authService.js
import axiosInstance from './axiosConfig';

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
    return await axiosInstance.post(`${API_URL}/registertmanager`, userData);
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