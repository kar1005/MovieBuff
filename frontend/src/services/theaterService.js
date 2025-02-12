// src/services/theaterService.js
import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api/theaters';

// Axios interceptor for error handling
axios.interceptors.response.use(
  response => response,
  error => {
    const message = error.response?.data?.message || 'An error occurred';
    console.error('API Error:', message);
    return Promise.reject(error);
  }
);

export const theaterService = {
  // Basic CRUD Operations
  getAllTheaters: async () => {
    const response = await axios.get(BASE_URL);
    return response.data;
  },

  getTheaterById: async (id) => {
    const response = await axios.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  createTheater: async (theaterData) => {
    const response = await axios.post(BASE_URL, theaterData);
    return response.data;
  },

  updateTheater: async (id, data) => {
    const response = await axios.put(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  deleteTheater: async (id) => {
    await axios.delete(`${BASE_URL}/${id}`);
    return id;
  },

  // Screen Management
  getTheaterScreens: async (theaterId) => {
    const response = await axios.get(`${BASE_URL}/${theaterId}/screens`);
    return response.data;
  },

  addScreen: async (theaterId, screenData) => {
    const response = await axios.post(`${BASE_URL}/${theaterId}/screens`, screenData);
    return response.data;
  },

  updateScreen: async (theaterId, screenNumber, screenData) => {
    const response = await axios.put(`${BASE_URL}/${theaterId}/screens/${screenNumber}`, screenData);
    return response.data;
  },

  deleteScreen: async (theaterId, screenNumber) => {
    await axios.delete(`${BASE_URL}/${theaterId}/screens/${screenNumber}`);
    return screenNumber;
  },

  getScreenByNumber: async (theaterId, screenNumber) => {
    const response = await axios.get(`${BASE_URL}/${theaterId}/screens/${screenNumber}`);
    return response.data;
  },

  // Screen Layout Management
  updateScreenLayout: async (theaterId, screenNumber, layoutData) => {
    const response = await axios.post(
      `${BASE_URL}/${theaterId}/screens/${screenNumber}/layout`,
      layoutData
    );
    return response.data;
  },

  // Theater Statistics and Analytics
  getTheaterStats: async (theaterId) => {
    const response = await axios.get(`${BASE_URL}/${theaterId}/stats`);
    return response.data;
  },

  getTheaterAnalytics: async (theaterId, params) => {
    const { startDate, endDate, screenNumber } = params;
    const queryParams = new URLSearchParams({
      startDate,
      endDate,
      ...(screenNumber && { screenNumber })
    });
    const response = await axios.get(
      `${BASE_URL}/${theaterId}/analytics?${queryParams}`
    );
    return response.data;
  },

  // Theater Search and Filtering
  searchTheaters: async (params) => {
    const { query, amenities, city } = params;
    const queryParams = new URLSearchParams();
    if (query) queryParams.append('query', query);
    if (city) queryParams.append('city', city);
    if (amenities) {
      amenities.forEach(amenity => queryParams.append('amenities', amenity));
    }
    const response = await axios.get(`${BASE_URL}/search?${queryParams}`);
    return response.data;
  },

  getTheatersByCity: async (city) => {
    const response = await axios.get(`${BASE_URL}?city=${city}`);
    return response.data;
  },

  getTheatersNearby: async (latitude, longitude, radius) => {
    const queryParams = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      radius: radius.toString()
    });
    const response = await axios.get(`${BASE_URL}?${queryParams}`);
    return response.data;
  },

  // Theater Status Management
  updateTheaterStatus: async (theaterId, status) => {
    const response = await axios.patch(`${BASE_URL}/${theaterId}/status`, { status });
    return response.data;
  }
};

export default theaterService;