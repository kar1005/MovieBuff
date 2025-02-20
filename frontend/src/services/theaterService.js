// src/services/theaterService.js
import axiosInstance from './axiosConfig';

const BASE_URL = '/theaters';

export const theaterService = {
  // Basic CRUD Operations
  getAllTheaters: async () => {
    try {
      const response = await axiosInstance.get(BASE_URL);
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Failed to fetch theaters';
    }
  },

  getTheaterById: async (id) => {
    try {
      const response = await axiosInstance.get(`${BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Failed to fetch theater details';
    }
  },

  createTheater: async (theaterData) => {
    try {
      const response = await axiosInstance.post(BASE_URL, theaterData);
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Failed to create theater';
    }
  },

  updateTheater: async (id, data) => {
    try {
      console.log("theaterService : ",JSON.stringify(data.location));

      const response = await axiosInstance.put(`${BASE_URL}/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Failed to update theater';
    }
  },

  deleteTheater: async (id) => {
    try {
      await axiosInstance.delete(`${BASE_URL}/${id}`);
      return id;
    } catch (error) {
      throw error.response?.data || 'Failed to delete theater';
    }
  },

  // Theater Manager Operations
  getTheatersByManagerId: async (managerId) => {
    try {
      const response = await axiosInstance.get(`${BASE_URL}/manager/${managerId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Failed to fetch theaters by manager ID';
    }
  },

  // Screen Management
  getAllScreens: async (theaterId) => {
    try {
      const response = await axiosInstance.get(`${BASE_URL}/${theaterId}/screens`);
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Failed to fetch screens';
    }
  },

  getScreenByNumber: async (theaterId, screenNumber) => {
    try {
      const response = await axiosInstance.get(
        `${BASE_URL}/${theaterId}/screens/${screenNumber}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Failed to fetch screen details';
    }
  },

  addScreen: async (theaterId, screenData) => {
    try {
      const response = await axiosInstance.put(
        `${BASE_URL}/${theaterId}/screens`,
        screenData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Failed to add screen';
    }
  },

  updateScreen: async (theaterId, screenNumber, screenData) => {
    try {
      const response = await axiosInstance.put(
        `${BASE_URL}/${theaterId}/screens/${screenNumber}`,
        screenData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Failed to update screen';
    }
  },

  deleteScreen: async (theaterId, screenNumber) => {
    try {
      await axiosInstance.delete(`${BASE_URL}/${theaterId}/screens/${screenNumber}`);
      return screenNumber;
    } catch (error) {
      throw error.response?.data || 'Failed to delete screen';
    }
  },

  // Theater Statistics and Analytics
  getTheaterStats: async (theaterId) => {
    try {
      const response = await axiosInstance.get(`${BASE_URL}/${theaterId}/stats`);
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Failed to fetch theater statistics';
    }
  },

  getAnalytics: async (theaterId, startDate, endDate, screenNumber = null) => {
    try {
      const queryParams = new URLSearchParams({
        startDate,
        endDate,
        ...(screenNumber && { screenNumber })
      });
      const response = await axiosInstance.get(
        `${BASE_URL}/${theaterId}/analytics?${queryParams}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Failed to fetch theater analytics';
    }
  },

  // Theater Search and Filtering
  searchTheaters: async (query = null, amenities = null, city = null) => {
    try {
      const queryParams = new URLSearchParams();
      if (query) queryParams.append('query', query);
      if (city) queryParams.append('city', city);
      if (amenities) {
        amenities.forEach(amenity => queryParams.append('amenities', amenity));
      }
      const response = await axiosInstance.get(`${BASE_URL}/search?${queryParams}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Failed to search theaters';
    }
  },

  getTheatersByCity: async (city) => {
    try {
      const response = await axiosInstance.get(`${BASE_URL}?city=${city}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Failed to fetch theaters by city';
    }
  },

  getTheatersNearby: async (latitude, longitude, radius) => {
    try {
      const queryParams = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        radius: radius.toString()
      });
      const response = await axiosInstance.get(`${BASE_URL}?${queryParams}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Failed to fetch nearby theaters';
    }
  },

  // Theater Status Management
  updateTheaterStatus: async (id, status) => {
    try {
      const response = await axiosInstance.patch(
        `${BASE_URL}/${id}/status`,
        { status }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Failed to update theater status';
    }
  }
};

export default theaterService;