import { useState, useCallback } from 'react';

export const useLayers = (initialLayers = [
  { id: 'drawing', name: 'Drawing Layer', visible: true, locked: false },
  { id: 'shapes', name: 'Shapes Layer', visible: true, locked: false },
  { id: 'text', name: 'Text Layer', visible: true, locked: false }
]) => {
  const [layers, setLayers] = useState(initialLayers);
  const [activeLayer, setActiveLayer] = useState(initialLayers[0]?.id || 'drawing');

  const toggleLayerVisibility = useCallback((layerId) => {
    setLayers(prev => prev.map(l => l.id === layerId ? { ...l, visible: !l.visible } : l));
  }, []);

  const toggleLayerLock = useCallback((layerId) => {
    setLayers(prev => prev.map(l => l.id === layerId ? { ...l, locked: !l.locked } : l));
  }, []);

  return {
    layers,
    activeLayer,
    setActiveLayer,
    toggleLayerVisibility,
    toggleLayerLock
  };
};

export default useLayers;
