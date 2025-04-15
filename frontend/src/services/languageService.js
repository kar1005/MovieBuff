// src/services/languageService.js
import axiosInstance from './axiosConfig';

// Initial set of languages from ISO 639-1
const ISO_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'kn', name: 'Kannada' },
  { code: 'bn', name: 'Bengali' },
  { code: 'mr', name: 'Marathi' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'ur', name: 'Urdu' },
  { code: 'or', name: 'Odia' },
  { code: 'as', name: 'Assamese' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'ko', name: 'Korean' }
];

const languageService = {
  // Get all languages (combines ISO languages with custom languages from DB)
  getAllLanguages: async () => {
    try {
      // First get custom languages from the database
      const response = await axiosInstance.get('/languages');
      const customLanguages = response.data;
      
      // Combine with ISO languages, ensuring no duplicates
      const existingCodes = customLanguages.map(lang => lang.code);
      const filteredIsoLanguages = ISO_LANGUAGES.filter(lang => !existingCodes.includes(lang.code));
      
      return [...filteredIsoLanguages, ...customLanguages];
    } catch (error) {
      console.error('Error fetching languages:', error);
      // If API call fails, fall back to ISO languages
      return ISO_LANGUAGES;
    }
  },

  // Add a custom language
  addCustomLanguage: async (language) => {
    try {
      const response = await axiosInstance.post('/languages', language);
      return response.data;
    } catch (error) {
      console.error('Error adding custom language:', error);
      throw error;
    }
  },

  // Get languages with search/filter
  searchLanguages: async (query) => {
    try {
      const response = await axiosInstance.get(`/languages/search?query=${query}`);
      return response.data;
    } catch (error) {
      console.error('Error searching languages:', error);
      // Fall back to filtering ISO languages locally
      return ISO_LANGUAGES.filter(lang => 
        lang.name.toLowerCase().includes(query.toLowerCase())
      );
    }
  }
};

export default languageService;