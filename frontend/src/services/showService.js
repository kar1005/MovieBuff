// src/services/showService.js - Updated with endTime handling
import axiosInstance from './axiosConfig';

const BASE_URL = '/shows';

const showService = {
  // Create a new show
  createShow: async (showData) => {
    try {
      console.log('----------------------------------------------------------------');
      console.log("showData: " + JSON.stringify(showData));
      
      console.log('----------------------------------------------------------------');

      
      const response = await axiosInstance.post(BASE_URL, showData);
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Failed to create show';
    }
  },

  // Update an existing show
  updateShow: async (id, showData) => {
    try {
      const response = await axiosInstance.put(`${BASE_URL}/${id}`, showData);
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to update show ${id}`;
    }
  },

  // Delete a show
  deleteShow: async (id) => {
    try {
      await axiosInstance.delete(`${BASE_URL}/${id}`);
      return id;
    } catch (error) {
      throw error.response?.data || `Failed to delete show ${id}`;
    }
  },

  // Get a show by ID
  getShow: async (id) => {
    try {
      const response = await axiosInstance.get(`${BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to fetch show with ID ${id}`;
    }
  },

  // Get shows by theater
  getShowsByTheater: async (theaterId) => {
    try {
      const response = await axiosInstance.get(`${BASE_URL}/theater/${theaterId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to fetch shows for theater ${theaterId}`;
    }
  },

  // Get shows by movie
  getShowsByMovie: async (movieId) => {
    try {
      const response = await axiosInstance.get(`${BASE_URL}/movie/${movieId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to fetch shows for movie ${movieId}`;
    }
  },

  // Get shows by theater and screen for a date range
  getShowsByTheaterAndScreen: async (theaterId, screenNumber, startTime, endTime) => {
    try {
      const params = { startTime, endTime };
      const response = await axiosInstance.get(
        `${BASE_URL}/theater/${theaterId}/screen/${screenNumber}`,
        { params }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to fetch shows for theater ${theaterId} screen ${screenNumber}`;
    }
  },

  // Get shows by date and optional city
  getShowsByDate: async (date, city) => {
    try {
      let params = { date };
      if (city) params.city = city;
      
      const response = await axiosInstance.get(`${BASE_URL}/date`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to fetch shows for date ${date}`;
    }
  },

  // Get shows by movie and city
  getShowsByMovieAndCity: async (movieId, city) => {
    try {
      const response = await axiosInstance.get(`${BASE_URL}/movie/${movieId}/city/${city}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to fetch shows for movie ${movieId} in city ${city}`;
    }
  },

  // Update show status
  updateShowStatus: async (showId, status) => {
    try {
      const response = await axiosInstance.put(
        `${BASE_URL}/${showId}/status`, 
        null, 
        { params: { status } }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to update status for show ${showId}`;
    }
  },

  // Update seat availability
  updateSeatAvailability: async (showId, seatIds, available) => {
    try {
      const response = await axiosInstance.put(
        `${BASE_URL}/${showId}/seats`, 
        seatIds, 
        { params: { available } }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to update seat availability for show ${showId}`;
    }
  },

  // Get seat availability for a show
  getSeatAvailability: async (showId) => {
    try {
      const response = await axiosInstance.get(`${BASE_URL}/${showId}/seat-availability`);
      return response.data;
    } catch (error) {
      throw error.response?.data || `Failed to fetch seat availability for show ${showId}`;
    }
  },

  // Get show analytics
  getShowAnalytics: async (startDate, endDate, movieId, theaterId) => {
    try {
      let params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (movieId) params.movieId = movieId;
      if (theaterId) params.theaterId = theaterId;
      
      const response = await axiosInstance.get(`${BASE_URL}/analytics`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Failed to fetch show analytics';
    }
  },

  // Get trending shows
  getTrendingShows: async (city, limit = 10) => {
    try {
      let params = { limit };
      if (city) params.city = city;
      
      const response = await axiosInstance.get(`${BASE_URL}/trending`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || 'Failed to fetch trending shows';
    }
  }
};

export default showService;