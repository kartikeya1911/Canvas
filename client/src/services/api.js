import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add a request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
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
    return Promise.reject(error);
  }
);

export default api;
