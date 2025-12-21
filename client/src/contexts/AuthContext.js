// Import React hooks and functions
import React, { createContext, useContext, useState, useEffect } from 'react';
// Import API service for making backend requests
import api from '../services/api';

/**
 * Authentication Context
 * This context manages user authentication state across the entire application
 * It provides login, logout, register functions and user data to all components
 */
const AuthContext = createContext();

/**
 * Custom Hook: useAuth
 * This hook provides easy access to authentication context from any component
 * 
 * Usage in components:
 * const { user, login, logout } = useAuth();
 * 
 * @returns {Object} Authentication context value (user, login, logout, etc.)
 * @throws {Error} If used outside of AuthProvider
 */
export const useAuth = () => {
  // Get the context value
  const context = useContext(AuthContext);
  
  // ERROR CHECK: Ensure hook is used within AuthProvider
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

/**
 * AuthProvider Component
 * Wraps the entire app to provide authentication state and functions
 * 
 * @param {Object} props
 * @param {ReactNode} props.children - Child components that need access to auth
 */
export const AuthProvider = ({ children }) => {
  // STATE: Store logged-in user data (null if not logged in)
  const [user, setUser] = useState(null);
  
  // STATE: Track if authentication is being checked (prevents flash of wrong content)
  const [loading, setLoading] = useState(true);
  
  // STATE: Store JWT token from localStorage
  const [token, setToken] = useState(localStorage.getItem('token'));

  /**
   * EFFECT: Set Authorization header when token changes
   * This ensures all API requests include the authentication token
   */
  useEffect(() => {
    if (token) {
      // ADD: Set Authorization header with Bearer token
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      // REMOVE: Delete Authorization header if no token
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token]); // Run whenever token changes

  /**
   * EFFECT: Check authentication status on app load
   * This verifies the stored token is still valid and gets user data
   */
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          // VERIFY: Send token to server to verify it's still valid
          const response = await api.get('/auth/me');
          // SUCCESS: Token is valid, store user data
          setUser(response.data.user);
        } catch (error) {
          // ERROR: Token invalid or expired, log user out
          console.error('Auth check failed:', error);
          logout();
        }
      }
      // COMPLETE: Stop showing loading state
      setLoading(false);
    };
    checkAuth();
  }, [token]); // Run when token changes

  /**
   * LOGIN FUNCTION
   * Authenticate user with email and password
   * 
   * @param {String} email - User's email address
   * @param {String} password - User's password
   * @returns {Object} Result with success status and user data or error message
   */
  const login = async (email, password) => {
    try {
      console.log('🔐 Attempting login for:', email);
      const response = await api.post('/auth/login', { email, password });
      console.log('✅ Login response received:', response.data);
      
      const { user, token } = response.data;
      
      if (!token) {
        throw new Error('No token received from server');
      }
      
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      
      console.log('✅ Login successful, user:', user.name);
      return { success: true, user };
    } catch (error) {
      console.error('❌ Login error:', error);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response) {
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'Cannot connect to server. Please check if the backend is running.';
      }
      
      return { 
        success: false, 
        message: errorMessage
      };
    }
  };

  /**
   * REGISTER FUNCTION
   * Create a new user account
   * 
   * @param {String} name - User's full name
   * @param {String} email - User's email address
   * @param {String} password - User's password
   * @returns {Object} Result with success status and user data or error message
   */
  const register = async (name, email, password) => {
    try {
      // API CALL: Send registration data to server
      const response = await api.post('/auth/register', { name, email, password });
      const { user, token } = response.data;
      
      // STORE: Save token in localStorage
      localStorage.setItem('token', token);
      
      // UPDATE STATE: Set token and user data
      setToken(token);
      setUser(user);
      
      // SUCCESS: Return success status with user data
      return { success: true, user };
    } catch (error) {
      // ERROR: Registration failed, return error message
      console.error('Registration error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  /**
   * LOGOUT FUNCTION
   * Log out the current user and clear authentication data
   */
  const logout = () => {
    // CLEAR: Remove token from localStorage
    localStorage.removeItem('token');
    
    // RESET STATE: Clear token and user data
    setToken(null);
    setUser(null);
    
    // REMOVE: Delete Authorization header from future API requests
    delete api.defaults.headers.common['Authorization'];
  };

  /**
   * UPDATE PROFILE FUNCTION
   * Update user's profile information (name, email, avatar)
   * 
   * @param {Object} profileData - Object containing fields to update
   * @returns {Object} Result with success status and updated user data or error
   */
  const updateProfile = async (profileData) => {
    try {
      // API CALL: Send profile update to server
      const response = await api.put('/auth/profile', profileData);
      
      // UPDATE STATE: Store updated user data
      setUser(response.data.user);
      
      // SUCCESS: Return updated user data
      return { success: true, user: response.data.user };
    } catch (error) {
      // ERROR: Profile update failed
      console.error('Profile update error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Profile update failed' 
      };
    }
  };

  /**
   * GET PROFILE FUNCTION
   * Fetch current user's profile data from server
   * 
   * @returns {Object} Result with success status and user data or error
   */
  const getProfile = async () => {
    try {
      // API CALL: Request user profile from server
      const response = await api.get('/auth/me');
      
      // UPDATE STATE: Store fetched user data
      setUser(response.data.user);
      
      // SUCCESS: Return user data
      return { success: true, user: response.data.user };
    } catch (error) {
      // ERROR: Failed to fetch profile
      console.error('Get profile error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to fetch profile' 
      };
    }
  };

  /**
   * CHANGE PASSWORD FUNCTION
   * Change user's password after verifying current password
   * 
   * @param {String} currentPassword - User's current password
   * @param {String} newPassword - User's new desired password
   * @returns {Object} Result with success status and message
   */
  const changePassword = async (currentPassword, newPassword) => {
    try {
      // API CALL: Send password change request to server
      await api.put('/auth/password', { currentPassword, newPassword });
      
      // SUCCESS: Password changed successfully
      return { success: true, message: 'Password changed successfully' };
    } catch (error) {
      // ERROR: Password change failed
      console.error('Password change error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Password change failed' 
      };
    }
  };

  /**
   * Context Value Object
   * Contains all state and functions that will be available to child components
   */
  const value = {
    user,                           // Current user object (null if not logged in)
    token,                          // JWT authentication token
    loading,                        // Whether auth status is being checked
    login,                          // Function to log in
    register,                       // Function to register new account
    logout,                         // Function to log out
    updateProfile,                  // Function to update profile
    getProfile,                     // Function to fetch profile
    changePassword,                 // Function to change password
    isAuthenticated: !!user         // Boolean: true if user is logged in
  };

  // PROVIDE: Make context value available to all child components
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
