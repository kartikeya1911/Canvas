import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';

const Profile = () => {
  const { user, updateProfile, getProfile, isAuthenticated } = useAuth();
  const { colors } = useTheme();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Initialize form data with user data
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || ''
      });
    }
  }, [user, isAuthenticated, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await updateProfile(formData);
      if (result.success) {
        setMessage('Profile updated successfully!');
        setIsEditing(false);
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(result.message || 'Failed to update profile');
      }
    } catch (err) {
      setError('An error occurred while updating profile');
      console.error('Profile update error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      name: user.name || '',
      email: user.email || ''
    });
    setError('');
    setMessage('');
  };

  const handleRefreshProfile = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const result = await getProfile();
      if (result.success) {
        setMessage('Profile refreshed successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(result.message || 'Failed to refresh profile');
      }
    } catch (err) {
      setError('An error occurred while refreshing profile');
      console.error('Profile refresh error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={`min-h-screen ${colors.bg.primary}`}>
      <Navbar />
      
      <div className="pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className={`text-3xl font-bold ${colors.text.primary} mb-2`}>
              Profile Settings
            </h1>
            <p className={`${colors.text.secondary}`}>
              Manage your account information and preferences
            </p>
          </motion.div>

          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={`${colors.bg.secondary} rounded-2xl ${colors.shadows.card} p-8 border ${colors.border.primary}`}
          >
            {/* Profile Avatar */}
            <div className="flex items-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="ml-6">
                <h2 className={`text-2xl font-semibold ${colors.text.primary}`}>
                  {user?.name || 'User'}
                </h2>
                <p className={`${colors.text.secondary} mt-1`}>
                  Member since {new Date(user?.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Success/Error Messages */}
            {message && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-4 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg"
              >
                {message}
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg"
              >
                {error}
              </motion.div>
            )}

            {/* Profile Form */}
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Name Field */}
                <div>
                  <label htmlFor="name" className={`block text-sm font-medium ${colors.text.primary} mb-2`}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`
                      w-full px-4 py-3 rounded-lg border transition-all duration-200
                      ${isEditing 
                        ? `${colors.bg.primary} ${colors.border.primary} ${colors.text.primary} focus:ring-2 focus:ring-blue-500 focus:border-blue-500` 
                        : `${colors.bg.tertiary} ${colors.border.muted} ${colors.text.secondary} cursor-not-allowed`
                      }
                    `}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className={`block text-sm font-medium ${colors.text.primary} mb-2`}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`
                      w-full px-4 py-3 rounded-lg border transition-all duration-200
                      ${isEditing 
                        ? `${colors.bg.primary} ${colors.border.primary} ${colors.text.primary} focus:ring-2 focus:ring-blue-500 focus:border-blue-500` 
                        : `${colors.bg.tertiary} ${colors.border.muted} ${colors.text.secondary} cursor-not-allowed`
                      }
                    `}
                    placeholder="Enter your email address"
                    required
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-4 mt-8">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={isLoading}
                      className={`
                        px-6 py-3 rounded-lg font-medium transition-all duration-200
                        ${colors.text.secondary} hover:${colors.text.primary} ${colors.bg.hover}
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="
                        px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium
                        hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                        flex items-center gap-2
                      "
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="
                      px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium
                      hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105
                      flex items-center gap-2
                    "
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Profile
                  </button>
                )}
              </div>
            </form>
          </motion.div>

          {/* Account Statistics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div className={`${colors.bg.secondary} rounded-xl p-6 ${colors.shadows.card} border ${colors.border.primary}`}>
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className={`text-2xl font-bold ${colors.text.primary}`}>0</p>
                  <p className={`text-sm ${colors.text.secondary}`}>Boards Created</p>
                </div>
              </div>
            </div>

            <div className={`${colors.bg.secondary} rounded-xl p-6 ${colors.shadows.card} border ${colors.border.primary}`}>
              <div className="flex items-center">
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className={`text-2xl font-bold ${colors.text.primary}`}>0</p>
                  <p className={`text-sm ${colors.text.secondary}`}>Collaborations</p>
                </div>
              </div>
            </div>

            <div className={`${colors.bg.secondary} rounded-xl p-6 ${colors.shadows.card} border ${colors.border.primary}`}>
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className={`text-2xl font-bold ${colors.text.primary}`}>0h</p>
                  <p className={`text-sm ${colors.text.secondary}`}>Time Spent</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
