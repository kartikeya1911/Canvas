// Import axios library for making HTTP requests
import axios from "axios";

/**
 * API Instance Configuration
 * Creates a configured axios instance for making API calls to the backend server
 * This centralizes API configuration and makes it easy to make authenticated requests
 */
const api = axios.create({
  // baseURL: Set the base URL for all API requests
  // Value comes from environment variable REACT_APP_BACKEND_URL
  // Example: "http://localhost:5000/api"
  baseURL: process.env.REACT_APP_BACKEND_URL + "/api",
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
      // SET: Add Authorization header with Bearer token format
      // Format: "Bearer <token>"
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // RETURN: Modified config with added headers
    return config;
  },
  (error) => {
    // ERROR HANDLING: If request setup fails, reject the promise
    return Promise.reject(error);
  }
);

// EXPORT: Make the configured API instance available throughout the app
// Usage: import api from './services/api'; api.get('/auth/me');
export default api;
