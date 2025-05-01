// src/services/movieService.js
import axiosInstance from './axiosConfig';

const BASE_URL = '/movies';

const movieService = {
    // Basic CRUD Operations
    getAllMovies: async (filters = {}, page = 0, size = 10) => {
        try {
            const { title, genres, languages, experience, status, minRating } = filters;
            const params = new URLSearchParams({
                page,
                size,
                ...(title && { title }),
                ...(minRating && { minRating }),
                ...(status && { status })
            });

            if (genres?.length) {
                genres.forEach(genre => params.append('genres', genre));
            }
            if (languages?.length) {
                languages.forEach(lang => params.append('languages', lang));
            }
            if (experience?.length) {
                experience.forEach(exp => params.append('experience', exp));
            }

            const response = await axiosInstance.get(`${BASE_URL}?${params}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || 'Failed to fetch movies';
        }
    },

    getMovieById: async (id) => {
        try {
            const response = await axiosInstance.get(`${BASE_URL}/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || 'Failed to fetch movie details';
        }
    },

    createMovie: async (movieData) => {
        try {
            const response = await axiosInstance.post(BASE_URL, movieData);
            return response.data;
        } catch (error) {
            throw error.response?.data || 'Failed to create movie';
        }
    },

    updateMovie: async (id, movieData) => {
        try {
            const response = await axiosInstance.put(`${BASE_URL}/${id}`, movieData);
            return response.data;
        } catch (error) {
            throw error.response?.data || 'Failed to update movie';
        }
    },

    deleteMovie: async (id) => {
        try {
            await axiosInstance.delete(`${BASE_URL}/${id}`);
            return id;
        } catch (error) {
            throw error.response?.data || 'Failed to delete movie';
        }
    },

    // Special Movie Lists
    getTrendingMovies: async (limit = 10) => {
        try {
            const response = await axiosInstance.get(`${BASE_URL}/latest-released`);
            return response.data;
        } catch (error) {
            throw error.response?.data || 'Failed to fetch trending movies';
        }
    },

    getUpcomingMovies: async (limit = 10) => {
        try {
            const response = await axiosInstance.get(`${BASE_URL}/upcoming`);
            return response.data;
        } catch (error) {
            throw error.response?.data || 'Failed to fetch upcoming movies';
        }
    },

    // Search and Filtering
    searchMovies: async (query, limit) => {
        try {
            const params = new URLSearchParams({ query });
            if (limit) params.append('limit', limit);
            
            const response = await axiosInstance.get(`${BASE_URL}/search?${params}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || 'Failed to search movies';
        }
    },

    // Cast Management
    updateMovieCast: async (movieId, castData) => {
        try {
            const response = await axiosInstance.put(`${BASE_URL}/${movieId}/cast`, castData);
            return response.data;
        } catch (error) {
            throw error.response?.data || 'Failed to update movie cast';
        }
    },

    // Statistics and Ratings
    updateMovieStatistics: async (movieId, statistics) => {
        try {
            const response = await axiosInstance.patch(
                `${BASE_URL}/${movieId}/statistics`,
                statistics
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || 'Failed to update movie statistics';
        }
    },

    updateMovieRating: async (movieId, rating) => {
        try {
            const response = await axiosInstance.patch(
                `${BASE_URL}/${movieId}/rating`,
                rating
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || 'Failed to update movie rating';
        }
    },

    getMovieStatistics: async (movieId) => {
        try {
            const response = await axiosInstance.get(`${BASE_URL}/${movieId}/statistics`);
            return response.data;
        } catch (error) {
            throw error.response?.data || 'Failed to fetch movie statistics';
        }
    },

    // Actor Related
    getMoviesByActor: async (actorId) => {
        try {
            const response = await axiosInstance.get(`${BASE_URL}/by-actor/${actorId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || 'Failed to fetch movies by actor';
        }
    }
};

export default movieService;