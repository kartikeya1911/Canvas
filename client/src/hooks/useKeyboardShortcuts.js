import { useEffect } from 'react';

export const useKeyboardShortcuts = ({
  onUndo,
  onRedo,
  onSetTool,
  onTogglePanning,
  disabled = false
}) => {
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e) => {
      // Don't trigger shortcuts if user is typing in an input or textarea
      const targetTag = e.target.tagName.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea' || e.target.isContentEditable) {
        return;
      }

      // Spacebar for panning
      if (e.code === 'Space') {
        e.preventDefault();
        onTogglePanning && onTogglePanning(true);
        return;
      }

      // Undo / Redo
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          onUndo && onUndo();
        } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault();
          onRedo && onRedo();
        }
        return;
      }

      // Tool shortcuts (single keys)
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'v':
            onSetTool && onSetTool('select');
            break;
          case 'p':
            onSetTool && onSetTool('pencil');
            break;
          case 'e':
            onSetTool && onSetTool('eraser');
            break;
          case 'r':
            onSetTool && onSetTool('rect');
            break;
          case 'c':
            onSetTool && onSetTool('circle');
            break;
          case 'a':
            onSetTool && onSetTool('arrow');
            break;
          case 't':
            onSetTool && onSetTool('text');
            break;
          default:
            break;
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        onTogglePanning && onTogglePanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onUndo, onRedo, onSetTool, onTogglePanning, disabled]);
};

export default useKeyboardShortcuts;
