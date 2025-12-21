import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const OnlineMembers = ({ users = [], theme = 'light' }) => {
  const colors = {
    bg: {
      card: theme === 'dark' ? 'bg-gray-800' : 'bg-white',
      tertiary: theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100',
    },
    text: {
      primary: theme === 'dark' ? 'text-white' : 'text-gray-900',
      secondary: theme === 'dark' ? 'text-gray-400' : 'text-gray-600',
    },
    border: {
      primary: theme === 'dark' ? 'border-gray-700' : 'border-gray-200',
    }
  };

  // Color palette for user avatars
  const avatarColors = [
    'from-blue-500 to-purple-600',
    'from-green-500 to-teal-600',
    'from-pink-500 to-red-600',
    'from-yellow-500 to-orange-600',
    'from-indigo-500 to-blue-600',
    'from-purple-500 to-pink-600',
    'from-teal-500 to-cyan-600',
    'from-orange-500 to-red-600',
  ];

  // Get consistent color for user based on their ID
  const getUserColor = (userId) => {
    if (!userId) return avatarColors[0];
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return avatarColors[hash % avatarColors.length];
  };

  if (!users || users.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`${colors.bg.card} backdrop-blur-xl bg-opacity-95 rounded-2xl shadow-lg px-5 py-3 flex items-center gap-3 border ${colors.border.primary}`}
    >
      {/* User Avatars */}
      <div className="flex -space-x-2">
        <AnimatePresence mode="popLayout">
          {users.slice(0, 5).map((user, index) => (
            <motion.div
              key={user.id || user.email || index}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 500, 
                damping: 25,
                delay: index * 0.05 
              }}
              className={`relative group`}
            >
              <div
                className={`w-10 h-10 bg-gradient-to-br ${getUserColor(user.id)} text-white rounded-full flex items-center justify-center text-sm font-bold border-2 border-white dark:border-gray-800 shadow-md cursor-pointer transition-transform hover:scale-110 hover:z-10`}
                title={user.name || user.email || 'Anonymous'}
              >
                {(user.name || user.email || '?').charAt(0).toUpperCase()}
              </div>
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                <div className="font-semibold">{user.name || 'Anonymous'}</div>
                {user.email && (
                  <div className="text-gray-300 text-xs">{user.email}</div>
                )}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Extra users indicator */}
        {users.length > 5 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-700 text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-white dark:border-gray-800 shadow-md"
            title={`${users.length - 5} more ${users.length - 5 === 1 ? 'user' : 'users'} online`}
          >
            +{users.length - 5}
          </motion.div>
        )}
      </div>

      {/* Online count */}
      <div className="flex items-center gap-2">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-2 h-2 bg-green-500 rounded-full shadow-lg shadow-green-500/50"
        />
        <span className={`text-sm font-medium ${colors.text.secondary}`}>
          {users.length} {users.length === 1 ? 'person' : 'people'} online
        </span>
      </div>
    </motion.div>
  );
};

export default OnlineMembers;
