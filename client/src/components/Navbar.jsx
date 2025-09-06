import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Logo from './Logo';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { isDark, toggleTheme, colors } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowUserMenu(false);
  };

  const handleDashboard = () => {
    navigate('/dashboard');
    setShowUserMenu(false);
  };

  return (
    <nav className={`absolute top-0 left-0 right-0 z-50 ${colors.bg.primary} border-b ${colors.border.primary} backdrop-blur-lg bg-opacity-95`}>
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo on the left */}
        <div 
          className={`flex items-center cursor-pointer ${colors.text.primary} hover:opacity-80 transition`}
          onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}
        >
          <Logo width="w-10" height="h-10" className="shadow-sm" />
          <span className="ml-3 font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            ColabCanvas
          </span>
        </div>
        
        {/* Right side content */}
        <div className="flex items-center gap-4">
          {/* Theme toggle button */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg ${colors.bg.secondary} ${colors.text.secondary} hover:${colors.text.primary} transition-all duration-200 hover:scale-105`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {isAuthenticated ? (
            <>
              {/* Dashboard link */}
              <button
                onClick={handleDashboard}
                className={`${colors.text.secondary} hover:${colors.text.primary} font-medium transition px-3 py-2 rounded-lg ${colors.bg.hover}`}
              >
                Dashboard
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`flex items-center gap-2 ${colors.text.primary} hover:opacity-80 transition px-3 py-2 rounded-lg ${colors.bg.hover}`}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center text-sm font-semibold shadow-lg">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="font-medium">{user?.name || 'User'}</span>
                  <svg 
                    className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown menu */}
                {showUserMenu && (
                  <div className={`absolute right-0 mt-2 w-56 ${colors.bg.modal} rounded-xl ${colors.shadows.modal} ${colors.border.primary} border backdrop-blur-xl`}>
                    <div className={`px-4 py-3 border-b ${colors.border.muted}`}>
                      <p className={`text-sm font-semibold ${colors.text.primary}`}>{user?.name}</p>
                      <p className={`text-xs ${colors.text.secondary}`}>{user?.email}</p>
                    </div>
                    
                    <div className="py-2">
                      <button
                        onClick={handleDashboard}
                        className={`w-full text-left px-4 py-2 text-sm ${colors.text.primary} ${colors.bg.hover} transition flex items-center gap-3`}
                      >
                        <div className="p-1 rounded-md bg-gradient-to-br from-blue-500 to-blue-600">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                          </svg>
                        </div>
                        <span>Dashboard</span>
                      </button>

                      <button
                        onClick={() => {
                          navigate('/profile');
                          setShowUserMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm ${colors.text.primary} ${colors.bg.hover} transition flex items-center gap-3`}
                      >
                        <div className="p-1 rounded-md bg-gradient-to-br from-purple-500 to-purple-600">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <span>Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          navigate('/board');
                          setShowUserMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm ${colors.text.primary} ${colors.bg.hover} transition flex items-center gap-3`}
                      >
                        <div className="p-1 rounded-md bg-gradient-to-br from-green-500 to-green-600">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <span>New Board</span>
                      </button>
                    </div>

                    <div className={`border-t ${colors.border.muted} my-1`}></div>
                    
                    <div className="py-2">
                      <button
                        onClick={handleLogout}
                        className={`w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition flex items-center gap-3`}
                      >
                        <div className="p-1 rounded-md bg-gradient-to-br from-red-500 to-red-600">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        </div>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Login/Signup buttons for non-authenticated users */}
              <button
                onClick={() => navigate('/login')}
                className={`${colors.text.secondary} hover:${colors.text.primary} font-medium transition px-4 py-2 rounded-lg ${colors.bg.hover}`}
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition transform hover:scale-105 shadow-lg"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>

      {/* Click outside to close menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </nav>
  );
};

export default Navbar;
