import React from 'react';
import { motion } from 'framer-motion';

const ShapesToolbar = ({
  currentTool,
  onSelectTool,
  isOpen = true,
  theme = 'light'
}) => {
  if (!isOpen) return null;
  const isDark = theme === 'dark';

  const tools = [
    { id: 'rect', label: 'Rectangle', shortcut: 'R', icon: '▭' },
    { id: 'circle', label: 'Circle', shortcut: 'C', icon: '○' },
    { id: 'ellipse', label: 'Ellipse', icon: '⬭' },
    { id: 'triangle', label: 'Triangle', icon: '△' },
    { id: 'diamond', label: 'Diamond', icon: '◇' },
    { id: 'star', label: 'Star', icon: '★' },
    { id: 'hexagon', label: 'Hexagon', icon: '⬡' },
    { id: 'line', label: 'Line', icon: '―' },
    { id: 'arrow', label: 'Arrow', shortcut: 'A', icon: '→' },
    { id: 'text', label: 'Text', shortcut: 'T', icon: 'T' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-3 shadow-xl border backdrop-blur-xl grid grid-cols-5 gap-2 ${
        isDark ? 'bg-gray-800/95 border-gray-700' : 'bg-white/95 border-gray-200'
      }`}
    >
      {tools.map(tool => (
        <button
          key={tool.id}
          type="button"
          onClick={() => onSelectTool(tool.id)}
          title={`${tool.label} ${tool.shortcut ? `(${tool.shortcut})` : ''}`}
          className={`w-11 h-11 flex flex-col items-center justify-center rounded-xl text-base transition ${
            currentTool === tool.id
              ? 'bg-blue-600 text-white shadow-md'
              : isDark
              ? 'hover:bg-gray-700 text-gray-200'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <span>{tool.icon}</span>
        </button>
      ))}
    </motion.div>
  );
};

export default ShapesToolbar;
