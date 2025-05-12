// src/services/cloudinaryService.js
import axios from 'axios';

const BASE_URL = '/cloudinary';


    const cloudinaryService = {
        // Upload image through backend proxy
        uploadImage: async (file, folder = '') => {
            try {
                const formData = new FormData();
                formData.append('file', file);
                if (folder) {
                    formData.append('folder', folder);
                }
    
                const response = await axios.post(
                    `${BASE_URL}/upload`, 
                    formData
                );
    
                return response.data;
            } catch (error) {
                console.error('Error uploading image:', error);
                throw new Error('Failed to upload image');
            }
        },
    
        // Delete image using public ID through backend proxy
        deleteImage: async (publicId) => {
            try {
                const response = await axios.post(`${BASE_URL}/delete`, { publicId });
                return response.data;
            } catch (error) {
                console.error('Error deleting image:', error);
                throw new Error('Failed to delete image');
            }
        },
    
    // Get optimized URL with transformations
    getOptimizedUrl: (url, { width, height, quality = 'auto' } = {}) => {
        if (!url) return '';

        try {
            const parts = url.split('/upload/');
            if (parts.length !== 2) return url;

            let transformations = 'upload/';

            if (width || height) {
                transformations += 'c_fit,';
                if (width) transformations += `w_${width},`;
                if (height) transformations += `h_${height},`;
            }

            transformations += `q_${quality}/`;

            return parts[0] + '/' + transformations + parts[1];
        } catch (error) {
            console.error('Error generating optimized URL:', error);
            return url;
        }
    },

    // Extract public ID from Cloudinary URL
    getPublicIdFromUrl: (url) => {
        if (!url) return null;
        
        try {
            // Handle both types of Cloudinary URLs
            // 1. With folder: .../upload/folder_name/file_name.extension
            // 2. Without folder: .../upload/file_name.extension
            const urlParts = url.split('/upload/');
            if (urlParts.length !== 2) return null;

            const pathParts = urlParts[1].split('/');
            const filename = pathParts[pathParts.length - 1];
            const publicId = filename.split('.')[0];

            // If there's a folder, include it in the public ID
            if (pathParts.length > 1) {
                const folder = pathParts.slice(0, -1).join('/');
                return `${folder}/${publicId}`;
            }

            return publicId;
        } catch (error) {
            console.error('Error extracting public ID:', error);
            return null;
        }
    },

    // Validate image before upload
    validateImage: (file) => {
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const maxSize = 5 * 1024 * 1024; // 5MB

        const errors = [];

        if (!validTypes.includes(file.type)) {
            errors.push('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
        }

        if (file.size > maxSize) {
            errors.push('File size too large. Maximum size is 5MB.');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
};

export default cloudinaryService;