// src/services/actorService.js
import axiosInstance from './axiosConfig';

const BASE_URL = '/actors';

const actorService = {
    // Basic CRUD Operations
    getAllActors: async (filters = {}, page = 0, size = 10) => {
        try {
            const { name, languages } = filters;
            const params = new URLSearchParams({
                page,
                size,
                ...(name && { name })
            });

            if (languages?.length) {
                languages.forEach(lang => params.append('languages', lang));
            }

            const response = await axiosInstance.get(`${BASE_URL}?${params}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || 'Failed to fetch actors';
        }
    },

    getActorById: async (id) => {
        try {
            const response = await axiosInstance.get(`${BASE_URL}/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || 'Failed to fetch actor details';
        }
    },

    createActor: async (actorData) => {
        try {
            const response = await axiosInstance.post(BASE_URL, actorData);
            return response.data;
        } catch (error) {
            throw error.response?.data || 'Failed to create actor';
        }
    },

    updateActor: async (id, actorData) => {
        try {
            const response = await axiosInstance.put(`${BASE_URL}/${id}`, actorData);
            return response.data;
        } catch (error) {
            throw error.response?.data || 'Failed to update actor';
        }
    },

    deleteActor: async (id) => {
        try {
            await axiosInstance.delete(`${BASE_URL}/${id}`);
            return id;
        } catch (error) {
            throw error.response?.data || 'Failed to delete actor';
        }
    },

    // Search Operations
    searchActors: async (query, limit) => {
        try {
            const params = new URLSearchParams({ query });
            if (limit) params.append('limit', limit);
            
            const response = await axiosInstance.get(`${BASE_URL}/search?${params}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || 'Failed to search actors';
        }
    },

    // Movie Related Operations
    getActorsByMovie: async (movieId) => {
        try {
            const response = await axiosInstance.get(`${BASE_URL}/movie/${movieId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || 'Failed to fetch actors by movie';
        }
    },

    getActorFilmography: async (actorId) => {
        try {
            const response = await axiosInstance.get(`${BASE_URL}/${actorId}/filmography`);
            return response.data;
        } catch (error) {
            throw error.response?.data || 'Failed to fetch actor filmography';
        }
    },

    updateFilmography: async (actorId, filmographyData) => {
        try {
            const response = await axiosInstance.put(
                `${BASE_URL}/${actorId}/filmography`,
                filmographyData
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || 'Failed to update actor filmography';
        }
    },

    // Statistics and Profile Management
    getActorStatistics: async (actorId) => {
        try {
            const response = await axiosInstance.get(`${BASE_URL}/${actorId}/statistics`);
            return response.data;
        } catch (error) {
            throw error.response?.data || 'Failed to fetch actor statistics';
        }
    },

    toggleProfileStatus: async (actorId) => {
        try {
            const response = await axiosInstance.patch(`${BASE_URL}/${actorId}/profile-status`);
            return response.data;
        } catch (error) {
            throw error.response?.data || 'Failed to toggle actor profile status';
        }
    },

    // Trending Actors
    getTrendingActors: async (limit = 10) => {
        try {
            const response = await axiosInstance.get(`${BASE_URL}/trending?limit=${limit}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || 'Failed to fetch trending actors';
        }
    },
    //getting random 5 actors
    getRandomActors: async (limit = 5, excludeId = null) => {
    try {
        const params = new URLSearchParams({ limit });
        if (excludeId) {
            params.append('excludeId', excludeId);
        }
        
        const response = await axiosInstance.get(`${BASE_URL}/random?${params}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching random actors:", error);
        // Fallback to trending actors if the random endpoint fails
        try {
            const trending = await actorService.getTrendingActors(limit);
            return trending.filter(actor => actor.id !== excludeId);
        } catch (fallbackError) {
            throw error.response?.data || 'Failed to fetch random actors';
        }
    }
}
};

export default actorService;