import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportToImage, exportToJSON } from '../utils/ExportManager';

const ExportModal = ({
  isOpen,
  onClose,
  stageRef,
  boardData,
  theme = 'light'
}) => {
  const [format, setFormat] = useState('png');
  const [resolution, setResolution] = useState(2);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const filename = (boardData?.title || 'whiteboard').toLowerCase().replace(/\s+/g, '-');
      if (format === 'json') {
        exportToJSON(boardData, filename);
      } else {
        exportToImage(stageRef.current, format, {
          pixelRatio: resolution,
          quality: 0.95,
          filename
        });
      }
      onClose();
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!stageRef?.current) return;
    try {
      const dataURL = stageRef.current.toDataURL({ pixelRatio: 2, mimeType: 'image/png' });
      const res = await fetch(dataURL);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy to clipboard failed:', err);
    }
  };

  const isDark = theme === 'dark';

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
          <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <span>📤</span> Export Whiteboard
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl font-bold"
            >
              &times;
            </button>
          </div>

          <div className="py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                Format
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'png', label: 'PNG Image', desc: 'Transparent / crisp' },
                  { id: 'jpeg', label: 'JPEG Image', desc: 'Compact file' },
                  { id: 'json', label: 'JSON Data', desc: 'Editable backup' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFormat(opt.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      format === opt.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold ring-2 ring-blue-500/20'
                        : isDark
                        ? 'border-gray-700 bg-gray-900/40 text-gray-300 hover:border-gray-600'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm">{opt.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {format !== 'json' && (
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">
                  Resolution / Quality
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 1, label: '1x Standard' },
                    { val: 2, label: '2x High (HD)' },
                    { val: 3, label: '3x Ultra (4K)' },
                  ].map(res => (
                    <button
                      key={res.val}
                      type="button"
                      onClick={() => setResolution(res.val)}
                      className={`p-2 rounded-lg border text-xs text-center font-medium transition ${
                        resolution === res.val
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : isDark
                          ? 'border-gray-700 bg-gray-700/50 text-gray-300'
                          : 'border-gray-200 bg-gray-100 text-gray-700'
                      }`}
                    >
                      {res.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-2">
            {format !== 'json' && (
              <button
                type="button"
                onClick={handleCopyToClipboard}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium border transition ${
                  copied
                    ? 'border-green-500 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                    : isDark
                    ? 'border-gray-700 hover:bg-gray-700 text-gray-200'
                    : 'border-gray-300 hover:bg-gray-100 text-gray-700'
                }`}
              >
                {copied ? '✓ Copied to Clipboard!' : '📋 Copy Image'}
              </button>
            )}
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50"
            >
              {isExporting ? 'Exporting...' : '💾 Download'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ExportModal;
