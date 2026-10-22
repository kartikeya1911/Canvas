import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationSystem = ({ notifications = [], onDismiss }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {notifications.map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm max-w-sm ${
              notif.type === 'error'
                ? 'bg-red-500 text-white border-red-600'
                : notif.type === 'success'
                ? 'bg-green-600 text-white border-green-700'
                : notif.type === 'warning'
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-gray-900 text-white border-gray-800'
            }`}
          >
            <span className="text-base">
              {notif.type === 'error' ? '⚠️' : notif.type === 'success' ? '✅' : 'ℹ️'}
            </span>
            <span className="flex-1">{notif.message}</span>
            {onDismiss && (
              <button
                onClick={() => onDismiss(notif.id)}
                className="opacity-70 hover:opacity-100 text-lg leading-none"
              >
                &times;
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationSystem;
