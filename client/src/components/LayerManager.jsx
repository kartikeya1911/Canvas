import React from 'react';

const LayerManager = ({
  isOpen,
  onClose,
  layers = [],
  activeLayer,
  onSelectLayer,
  onToggleLayerVisibility,
  theme = 'light'
}) => {
  if (!isOpen) return null;
  const isDark = theme === 'dark';

  return (
    <div className={`fixed left-24 top-20 z-30 w-64 rounded-2xl p-4 shadow-xl border backdrop-blur-xl ${
      isDark ? 'bg-gray-800/95 border-gray-700 text-white' : 'bg-white/95 border-gray-200 text-gray-900'
    }`}>
      <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
        <h4 className="font-semibold text-sm">Layers</h4>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            &times;
          </button>
        )}
      </div>

      <div className="py-2 space-y-1">
        {layers.map((layer) => (
          <div
            key={layer.id}
            onClick={() => onSelectLayer && onSelectLayer(layer.id)}
            className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs transition ${
              activeLayer === layer.id
                ? 'bg-blue-500 text-white font-medium'
                : isDark
                ? 'hover:bg-gray-700 text-gray-300'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <span>{layer.name}</span>
            {onToggleLayerVisibility && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLayerVisibility(layer.id);
                }}
                className="opacity-70 hover:opacity-100"
              >
                {layer.visible !== false ? '👁️' : '🙈'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LayerManager;
