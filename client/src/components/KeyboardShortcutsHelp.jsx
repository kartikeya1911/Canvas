import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const KeyboardShortcutsHelp = ({ isOpen, onClose, theme = 'light' }) => {
  if (!isOpen) return null;
  const isDark = theme === 'dark';

  const shortcuts = [
    { key: 'V', desc: 'Select & Pan tool' },
    { key: 'P', desc: 'Pencil / Freehand drawing' },
    { key: 'E', desc: 'Eraser' },
    { key: 'R', desc: 'Rectangle shape' },
    { key: 'C', desc: 'Circle shape' },
    { key: 'A', desc: 'Arrow shape' },
    { key: 'T', desc: 'Text tool' },
    { key: 'Space + Drag', desc: 'Pan canvas' },
    { key: 'Ctrl / ⌘ + Z', desc: 'Undo last action' },
    { key: 'Ctrl / ⌘ + Y', desc: 'Redo last action' },
    { key: 'Scroll Wheel', desc: 'Zoom in / out' },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border ${
            isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <span>⌨️</span> Keyboard Shortcuts
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl font-bold"
            >
              &times;
            </button>
          </div>

          <div className="py-4 space-y-2 max-h-80 overflow-y-auto">
            {shortcuts.map((sc, i) => (
              <div
                key={i}
                className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                  isDark ? 'bg-gray-900/40 hover:bg-gray-900/70' : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <span className="text-sm text-gray-700 dark:text-gray-300">{sc.desc}</span>
                <kbd className="px-2.5 py-1 text-xs font-mono font-semibold rounded-md border shadow-sm bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                  {sc.key}
                </kbd>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-gray-200 dark:border-gray-700 text-right">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition"
            >
              Got it
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default KeyboardShortcutsHelp;
