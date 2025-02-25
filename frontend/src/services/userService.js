// src/services/userService.js
import axiosInstance from "./axiosConfig";

const BASE_URL = "/users";

const userService = {
  // Get all users
  getAllUsers: async () => {
    try {
      const response = await axiosInstance.get(BASE_URL);
      return response.data;
    } catch (error) {
      throw error.response?.data || "Failed to fetch users";
    }
  },

  // Get customers only
  getCustomers: async () => {
    try {
      const response = await axiosInstance.get(`${BASE_URL}/customer`);
      return response.data;
    } catch (error) {
      throw error.response?.data || "Failed to fetch customers";
    }
  },

  // Get theater managers only
  getTheaterManagers: async () => {
    try {
      const response = await axiosInstance.get(`${BASE_URL}/theatremanager`);
      return response.data;
    } catch (error) {
      throw error.response?.data || "Failed to fetch theater managers";
    }
  },

  // Get user by ID
  getUserById: async (id) => {
    try {
      const response = await axiosInstance.get(`${BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || "Failed to fetch user details";
    }
  },

  // Create new user
  createUser: async (userData) => {
    try {
      const response = await axiosInstance.post(BASE_URL, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || "Failed to create user";
    }
  },

  // Update user
  updateUser: async (id, userData) => {
    try {
      const response = await axiosInstance.put(`${BASE_URL}/${id}`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || "Failed to update user";
    }
  },

  // Delete user
  deleteUser: async (id) => {
    try {
      await axiosInstance.delete(`${BASE_URL}/${id}`);
      return id;
    } catch (error) {
      throw error.response?.data || "Failed to delete user";
    }
  },

  // Search user by username
  searchUserByUsername: async (username) => {
    try {
      const response = await axiosInstance.get(`${BASE_URL}/search`, {
        params: { username },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || "Failed to search user";
    }
  },

  // Helper function to format user data before sending to server
  formatUserData: (userData) => {
    return {
      ...userData,
      role: userData.role?.toUpperCase(), // Ensure role is uppercase
      preferences: {
        ...userData.preferences,
        favoriteGenres: Array.isArray(userData.preferences?.favoriteGenres)
          ? userData.preferences.favoriteGenres
          : [],
        preferredLanguages: Array.isArray(
          userData.preferences?.preferredLanguages
        )
          ? userData.preferences.preferredLanguages
          : [],
        preferredTheaters: Array.isArray(
          userData.preferences?.preferredTheaters
        )
          ? userData.preferences.preferredTheaters
          : [],
      },
    };
  },

  // Register new user (with role)
  register: async (userData) => {
    try {
      const formattedData = userService.formatUserData(userData);
      const response = await axiosInstance.post(BASE_URL, formattedData);
      return response.data;
    } catch (error) {
      throw error.response?.data || "Failed to register user";
    }
  },

  // Update user profile
  updateProfile: async (id, profileData) => {
    try {
      // Don't send password if it's empty
      const updatedData = { ...profileData };
      if (!updatedData.password) {
        delete updatedData.password;
      }

      const response = await axiosInstance.put(
        `${BASE_URL}/${id}`,
        updatedData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || "Failed to update profile";
    }
  },

  // Update user preferences
  updatePreferences: async (id, preferences) => {
    try {
      const response = await axiosInstance.put(`${BASE_URL}/${id}`, {
        preferences: {
          favoriteGenres: preferences.favoriteGenres || [],
          preferredLanguages: preferences.preferredLanguages || [],
          preferredTheaters: preferences.preferredTheaters || [],
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || "Failed to update preferences";
    }
  },
};

export default userService;
