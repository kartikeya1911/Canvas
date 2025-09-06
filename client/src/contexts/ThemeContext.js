import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage first
    const saved = localStorage.getItem('theme');
    if (saved) {
      return saved === 'dark';
    }
    // Then check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // Update localStorage when theme changes
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    // Update document class for Tailwind CSS dark mode
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const theme = {
    isDark,
    toggleTheme,
    // Color schemes for both themes
    colors: {
      // Background colors
      bg: {
        primary: isDark ? 'bg-gray-900' : 'bg-white',
        secondary: isDark ? 'bg-gray-800' : 'bg-gray-50',
        tertiary: isDark ? 'bg-gray-700' : 'bg-gray-100',
        card: isDark ? 'bg-gray-800' : 'bg-white',
        modal: isDark ? 'bg-gray-800' : 'bg-white',
        input: isDark ? 'bg-gray-700' : 'bg-white',
        hover: isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50',
        muted: isDark ? 'bg-gray-900/50' : 'bg-gray-50/50'
      },
      // Text colors
      text: {
        primary: isDark ? 'text-gray-100' : 'text-gray-900',
        secondary: isDark ? 'text-gray-300' : 'text-gray-600',
        tertiary: isDark ? 'text-gray-400' : 'text-gray-500',
        muted: isDark ? 'text-gray-500' : 'text-gray-400',
        inverse: isDark ? 'text-gray-900' : 'text-gray-100'
      },
      // Border colors
      border: {
        primary: isDark ? 'border-gray-700' : 'border-gray-200',
        secondary: isDark ? 'border-gray-600' : 'border-gray-300',
        focus: isDark ? 'border-blue-500' : 'border-blue-500',
        muted: isDark ? 'border-gray-800' : 'border-gray-100'
      },
      // Accent colors
      accent: {
        primary: 'bg-blue-600 text-white',
        primaryHover: 'hover:bg-blue-700',
        secondary: isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700',
        secondaryHover: isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200',
        success: 'bg-green-600 text-white',
        warning: 'bg-yellow-500 text-white',
        danger: 'bg-red-600 text-white'
      },
      // Miro-inspired colors
      miro: {
        primary: '#050038', // Miro's dark blue
        primaryLight: '#4C63D2', // Miro's light blue
        yellow: '#FFF100', // Miro's yellow
        purple: '#9B59B6', // Miro's purple
        green: '#2ECC71', // Miro's green
        orange: '#FF6B35', // Miro's orange
        pink: '#E74C3C', // Miro's red/pink
        gray: isDark ? '#2C3E50' : '#BDC3C7'
      },
      // Shadow styles - moved inside colors
      shadows: {
        card: isDark ? 'shadow-lg shadow-gray-900/50' : 'shadow-lg shadow-gray-200/50',
        modal: isDark ? 'shadow-2xl shadow-gray-900/80' : 'shadow-2xl shadow-gray-500/20',
        button: isDark ? 'shadow-md shadow-gray-800/50' : 'shadow-md shadow-gray-300/50',
        hover: isDark ? 'hover:shadow-xl hover:shadow-gray-900/60' : 'hover:shadow-xl hover:shadow-gray-400/30'
      }
    },
    // Keep shadows at root level for backward compatibility
    shadows: {
      card: isDark ? 'shadow-lg shadow-gray-900/50' : 'shadow-lg shadow-gray-200/50',
      modal: isDark ? 'shadow-2xl shadow-gray-900/80' : 'shadow-2xl shadow-gray-500/20',
      button: isDark ? 'shadow-md shadow-gray-800/50' : 'shadow-md shadow-gray-300/50',
      hover: isDark ? 'hover:shadow-xl hover:shadow-gray-900/60' : 'hover:shadow-xl hover:shadow-gray-400/30'
    }
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
