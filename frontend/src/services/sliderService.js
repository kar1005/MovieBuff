import axiosInstance from './axiosConfig';

const BASE_URL = '/slider';

const sliderService = {
    // Basic CRUD Operations
    getAllSlider: async () => {
        try {
            
            const response = await axiosInstance.get(`${BASE_URL}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || 'Failed to fetch slider';
        }
    },
    addSlider: async (sliderData) => {
        try {
            const response = await axiosInstance.post(`${BASE_URL}`, sliderData);
            return response.data;
        } catch (error) {
            throw error.response?.data || 'Failed to add slider';
        }
    },
    updateSlider: async (sliderId, sliderData) => {
        try {
            const response = await axiosInstance.put(`${BASE_URL}/${sliderId}`, sliderData);
            return response.data;
        } catch (error) {
            throw error.response?.data || 'Failed to update slider';
        }
    },
};

export default sliderService;