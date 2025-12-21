import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

/**
 * Request Interceptor
 * This function runs before every API request is sent
 * Purpose: Automatically attach JWT token to all requests for authentication
 * 
 * How it works:
 * 1. Before each request, check if JWT token exists in localStorage
 * 2. If token exists, add it to the Authorization header
 * 3. Server will verify this token to authenticate the user
 */
api.interceptors.request.use(
  (config) => {
    // RETRIEVE: Get JWT token from browser's localStorage
    const token = localStorage.getItem('token');
    
    // CHECK: If token exists, add it to request headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('🌐 API Request:', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.config.url, response.status);
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error
      console.error('❌ API Error Response:', {
        url: error.config?.url,
        status: error.response.status,
        message: error.response.data?.message || error.response.statusText
      });
    } else if (error.request) {
      // Request made but no response
      console.error('❌ No Response from Server:', {
        url: error.config?.url,
        message: 'Server is not responding. Please check if the backend is running.'
      });
    } else {
      // Error in request setup
      console.error('❌ Request Setup Error:', error.message);
    }
>>>>>>> dea45aa6c3a632f17db74d1104dfc9072effc0fd
    return Promise.reject(error);
  }
);

// EXPORT: Make the configured API instance available throughout the app
// Usage: import api from './services/api'; api.get('/auth/me');
export default api;
