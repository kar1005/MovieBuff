import axiosInstance from './axiosConfig';
import { toast } from 'react-toastify';

const BASE_URL = '/auth';

export const authService = {
  login: async (credentials) => {
    const response = await axiosInstance.post(`${BASE_URL}/login`, credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  googleAuth: async (idToken) => {
    try {

      const response = axiosInstance.post(`${BASE_URL}/google`, { idToken });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed with status: ${response.status}`);
      }

      const data = await response.json();
      
      // Store user data in localStorage if token exists
      if (data.token) {
        localStorage.setItem('token', data.token);
        
        // Handle different response structures
        const userId = data.user ? data.user.id : data.id;
        const userEmail = data.user ? data.user.email : data.email;
        
        if (userId) {
          localStorage.setItem('userId', userId);
        }
        
        if (userEmail) {
          localStorage.setItem('userEmail', userEmail);
        }
      }
      
      return data;
    } catch (error) {
      console.error("Google authentication error:", error);
      throw error;
    }
  },

  register: async (userData) => {
    return await axiosInstance.post(`${BASE_URL}/register`, userData);
  },

  registerTManager: async (userData) => {
    try {
      const response = await axiosInstance.post(`${BASE_URL}/registertmanager`, userData);
      
      if (response.data) {
        console.log("Service Response", JSON.stringify(response.data));
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
    try {
      const response = await axiosInstance.post(`${BASE_URL}/logout`);
      
      // Clear token even if the server response fails
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('userEmail');
      
      return response.data;
    } catch (error) {
      console.error('Logout error:', error);
      // Ensure token is removed even if request fails
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('userEmail');
      throw error;
    }
  },

  getCurrentUser: async () => {
    return await axiosInstance.get(`${BASE_URL}/me`);
  }
};

export const { login, googleAuth, register, registerTManager, logout, getCurrentUser } = authService;
export default authService;