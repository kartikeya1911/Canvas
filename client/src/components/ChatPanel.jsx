import React, { useState } from 'react';
import { motion } from 'framer-motion';

const ChatPanel = ({
  isOpen,
  onClose,
  messages = [],
  onSendMessage,
  theme = 'light'
}) => {
  const [input, setInput] = useState('');
  if (!isOpen) return null;

  const isDark = theme === 'dark';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput('');
  };

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className={`fixed right-0 top-12 bottom-0 w-80 z-30 flex flex-col border-l shadow-2xl backdrop-blur-xl ${
        isDark ? 'bg-gray-800/95 border-gray-700 text-white' : 'bg-white/95 border-gray-200 text-gray-900'
      }`}
    >
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <span>💬</span> Collaborator Chat
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            &times;
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-gray-400 text-center text-xs mt-10">
            No messages yet. Say hello to your collaborators!
          </p>
        ) : (
          messages.map((msg, i) => (
            <div key={msg.id || i} className="flex flex-col">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-semibold text-xs text-blue-600 dark:text-blue-400">
                  {msg.userName || 'Anonymous'}
                </span>
                <span className="text-[10px] text-gray-400">
                  {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
              <p className={`text-xs rounded-xl p-2.5 break-words ${
                isDark ? 'bg-gray-700/60 text-gray-100' : 'bg-gray-100 text-gray-800'
              }`}>
                {msg.message}
              </p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className={`flex-1 rounded-xl px-3 py-2 text-xs border outline-none focus:ring-2 focus:ring-blue-500 ${
              isDark ? 'bg-gray-900/60 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
            }`}
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="bg-blue-600 text-white px-3 py-2 rounded-xl text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
          >
            Send
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default ChatPanel;
