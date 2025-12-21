import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { boardService } from '../services/boardService';

const ShareModal = ({ 
  isOpen, 
  onClose, 
  boardId, 
  theme = 'light' 
}) => {
  const [inviteUrl, setInviteUrl] = useState('');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [shareSettings, setShareSettings] = useState({
    allowAnonymous: true,
    defaultPermission: 'editor'
  });
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  // Theme colors
  const colors = {
    bg: {
      card: theme === 'dark' ? 'bg-gray-800' : 'bg-white',
      primary: theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50',
      button: 'bg-blue-600 hover:bg-blue-700',
      success: 'bg-green-600 hover:bg-green-700',
      danger: 'bg-red-600 hover:bg-red-700',
    },
    text: {
      primary: theme === 'dark' ? 'text-white' : 'text-gray-900',
      secondary: theme === 'dark' ? 'text-gray-400' : 'text-gray-600',
    },
    border: {
      primary: theme === 'dark' ? 'border-gray-700' : 'border-gray-300',
    }
  };

  // Generate invite link
  const handleGenerateInviteLink = async () => {
    if (!boardId) {
      setError('Board ID is required');
      return;
    }

    try {
      setIsGeneratingLink(true);
      setError('');
      const response = await boardService.generateInviteLink(boardId, shareSettings);
      
      if (response.success && response.inviteUrl) {
        setInviteUrl(response.inviteUrl);
      } else {
        setError('Failed to generate invite link');
      }
    } catch (error) {
      console.error('Error generating invite link:', error);
      setError(error.message || 'Failed to generate invite link');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  // Copy to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      setError('Failed to copy to clipboard');
    }
  };

  // Auto-generate link when modal opens
  useEffect(() => {
    if (isOpen && !inviteUrl && boardId) {
      handleGenerateInviteLink();
    }
  }, [isOpen, boardId]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className={`${colors.bg.card} rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto`}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className={`text-2xl font-bold ${colors.text.primary}`}>
                🔗 Share Board
              </h2>
              <p className={`text-sm ${colors.text.secondary} mt-1`}>
                Share this link to collaborate across devices
              </p>
            </div>
            <button
              onClick={onClose}
              className={`${colors.text.secondary} hover:${colors.text.primary} transition-colors p-2`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-600 dark:text-red-400 text-sm">⚠️ {error}</p>
              </div>
            )}

            {/* Invite Link Section */}
            <div>
              <label className={`block text-sm font-semibold ${colors.text.primary} mb-3`}>
                📋 Share Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inviteUrl}
                  readOnly
                  className={`flex-1 px-4 py-3 border ${colors.border.primary} rounded-lg ${colors.bg.primary} ${colors.text.primary} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder={isGeneratingLink ? "🔄 Generating link..." : "Share link will appear here"}
                />
                <button
                  onClick={handleCopyLink}
                  disabled={!inviteUrl}
                  className={`${copied ? 'bg-green-600 hover:bg-green-700' : colors.bg.button} text-white px-6 py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg`}
                  title={copied ? "Copied!" : "Copy to clipboard"}
                >
                  {copied ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </span>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
              {inviteUrl && (
                <p className={`text-xs ${colors.text.secondary} mt-2`}>
                  💡 Anyone with this link can access the board from any device on your network
                </p>
              )}
            </div>

            {/* Share Settings */}
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className={`text-sm font-semibold ${colors.text.primary} flex items-center gap-2`}>
                ⚙️ Share Settings
              </h4>
              
              {/* Anonymous Access */}
              <div className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <div className="flex-1">
                  <label className={`text-sm font-medium ${colors.text.primary} flex items-center gap-2`}>
                    🌐 Allow Anonymous Access
                  </label>
                  <p className={`text-xs ${colors.text.secondary} mt-1`}>
                    Let anyone with the link join without signing in
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={shareSettings.allowAnonymous}
                    onChange={(e) => setShareSettings(prev => ({...prev, allowAnonymous: e.target.checked}))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Default Permission */}
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <label className={`block text-sm font-medium ${colors.text.primary} mb-2 flex items-center gap-2`}>
                  🔐 Default Permission
                </label>
                <select
                  value={shareSettings.defaultPermission}
                  onChange={(e) => setShareSettings(prev => ({...prev, defaultPermission: e.target.value}))}
                  className={`w-full px-4 py-2.5 border ${colors.border.primary} rounded-lg ${colors.bg.primary} ${colors.text.primary} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer`}
                >
                  <option value="viewer">👁️ Viewer - Can only view the board</option>
                  <option value="editor">✏️ Editor - Can view and edit the board</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleGenerateInviteLink}
                disabled={isGeneratingLink}
                className={`flex-1 ${colors.bg.success} text-white py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg`}
              >
                {isGeneratingLink ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </span>
                ) : (
                  '🔄 Update Link'
                )}
              </button>
              <button
                onClick={onClose}
                className={`px-6 py-3 border ${colors.border.primary} ${colors.text.secondary} rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium`}
              >
                Close
              </button>
            </div>

            {/* Device Access Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="text-blue-800 dark:text-blue-300 text-sm font-semibold mb-2 flex items-center gap-2">
                📱 Multi-Device Access
              </h4>
              <ul className="text-blue-700 dark:text-blue-400 text-xs space-y-1">
                <li>✅ Share with devices on the same network (WiFi)</li>
                <li>✅ Real-time collaboration with online members</li>
                <li>✅ Works on phones, tablets, and computers</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ShareModal;
