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

};

export default sliderService;