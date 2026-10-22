/**
 * ExportManager - Utility to export and import canvas data in multiple formats
 */

export const exportToImage = (stage, format = 'png', options = {}) => {
  if (!stage) return null;
  const { pixelRatio = 2, quality = 1, filename = 'whiteboard' } = options;
  const mimeType = format === 'jpeg' || format === 'jpg' ? 'image/jpeg' : 'image/png';
  
  const dataURL = stage.toDataURL({
    mimeType,
    quality,
    pixelRatio,
  });

  const link = document.createElement('a');
  link.download = `${filename}.${format === 'jpeg' ? 'jpg' : 'png'}`;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return dataURL;
};

export const exportToJSON = (boardData, filename = 'whiteboard') => {
  const exportPayload = {
    version: '1.0',
    title: boardData?.title || 'ColabCanvas Board',
    exportedAt: new Date().toISOString(),
    data: {
      lines: boardData?.lines || [],
      rectangles: boardData?.rects || boardData?.rectangles || [],
      circles: boardData?.circles || [],
      arrows: boardData?.arrows || [],
      textNodes: boardData?.textNodes || []
    }
  };

  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `${filename}.json`;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const parseImportedJSON = (jsonString) => {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.data) {
      return {
        lines: parsed.data.lines || [],
        rectangles: parsed.data.rectangles || [],
        circles: parsed.data.circles || [],
        arrows: parsed.data.arrows || [],
        textNodes: parsed.data.textNodes || []
      };
    }
    return {
      lines: parsed.lines || [],
      rectangles: parsed.rectangles || [],
      circles: parsed.circles || [],
      arrows: parsed.arrows || [],
      textNodes: parsed.textNodes || []
    };
  } catch (err) {
    console.error('Failed to parse imported JSON:', err);
    throw new Error('Invalid JSON whiteboard format');
  }
};

const ExportManager = {
  exportToImage,
  exportToJSON,
  parseImportedJSON
};

export default ExportManager;
