import { useState, useEffect, useCallback, useRef } from 'react';
import socketService from '../services/socketService';

export const useCursorBroadcast = (isAuthenticated) => {
  const [cursors, setCursors] = useState(new Map());
  const lastEmitTime = useRef(0);

  const broadcastCursor = useCallback((pos) => {
    if (!isAuthenticated || !socketService.connected) return;
    const now = Date.now();
    // Throttle cursor updates to ~30fps (33ms)
    if (now - lastEmitTime.current > 33) {
      socketService.emitCursorMove(pos);
      lastEmitTime.current = now;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleCursorMove = (data) => {
      setCursors(prev => {
        const next = new Map(prev);
        next.set(data.userId, {
          x: data.x,
          y: data.y,
          userName: data.userName
        });
        return next;
      });
    };

    const handleUserLeft = (data) => {
      setCursors(prev => {
        const next = new Map(prev);
        if (data?.user?._id) next.delete(data.user._id);
        if (data?.user?.id) next.delete(data.user.id);
        return next;
      });
    };

    socketService.on('cursor-move', handleCursorMove);
    socketService.on('user-left', handleUserLeft);

    return () => {
      socketService.off('cursor-move', handleCursorMove);
      socketService.off('user-left', handleUserLeft);
    };
  }, [isAuthenticated]);

  return {
    cursors,
    broadcastCursor
  };
};

export default useCursorBroadcast;
