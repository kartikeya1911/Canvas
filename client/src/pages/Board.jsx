import React, { useRef, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Stage, Layer, Line, Rect, Text, Circle, Ellipse, Star, Arrow, Group } from "react-konva";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { boardService } from "../services/boardService";
import socketService from "../services/socketService";
import Navbar from "../components/Navbar";
import { motion, AnimatePresence } from "framer-motion";

const TOOL_PENCIL = "pencil";
const TOOL_SELECT = "select";
const TOOL_ERASER = "eraser";
const TOOL_RECT = "rect";
const TOOL_CIRCLE = "circle";
const TOOL_ARROW = "arrow";
const TOOL_TEXT = "text";
const TOOL_PEN = "pen";
const TOOL_HIGHLIGHTER = "highlighter";
const TOOL_MARKER = "marker";
const TOOL_LINE = "line";
const TOOL_TRIANGLE = "triangle";
const TOOL_DIAMOND = "diamond";
const TOOL_STAR = "star";
const TOOL_HEXAGON = "hexagon";
const TOOL_ELLIPSE = "ellipse";
const TOOL_PARTIAL_ERASER = "partialEraser";
const GRID_SIZE = 40;

// Miro-Style Tool Button Component
const ToolButton = ({ title, tool, currentTool, onClick, icon }) => {
  const { colors } = useTheme();
  const isActive = currentTool === tool;
  
  return (
    <motion.button
      title={title}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        w-14 h-14 flex items-center justify-center rounded-2xl transition-all duration-200 relative
        ${isActive 
          ? `${colors.accent.primary} text-white shadow-lg` 
          : `${colors.bg.primary} ${colors.text.primary} hover:${colors.bg.tertiary} border ${colors.border.primary}`
        }
      `}
    >
      {icon}
      {isActive && (
        <motion.div
          layoutId="toolIndicator"
          className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-full"
          initial={false}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
    </motion.button>
  );
};

// Miro-Style Action Button Component
const ActionButton = ({ title, onClick, icon, className = "" }) => {
  const { colors } = useTheme();
  
  return (
    <motion.button
      title={title}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        w-14 h-14 flex items-center justify-center rounded-2xl transition-all duration-200
        ${colors.bg.primary} ${colors.text.primary} hover:${colors.bg.tertiary} border ${colors.border.primary}
        ${className}
      `}
    >
      {icon}
    </motion.button>
  );
};

const Board = () => {
  const { boardId } = useParams();
  const { isAuthenticated, token } = useAuth();
  const { colors, shadows, isDark } = useTheme();

  // Debug logging for boardId
  useEffect(() => {
    console.log('🆔 Board ID from params:', boardId);
    if (!boardId) {
      console.warn('⚠️ No boardId found in URL parameters');
    }
  }, [boardId]);

  // Redirect to dashboard if no boardId is provided
  useEffect(() => {
    if (isAuthenticated && boardId === undefined) {
      console.log('🏠 No board ID, redirecting to dashboard...');
      // You might want to add redirect logic here if needed
      // navigate('/dashboard');
    }
  }, [boardId, isAuthenticated]);

  // Canvas state
  const [tool, setTool] = useState(TOOL_PENCIL);
  const [lines, setLines] = useState([]);
  const [rects, setRects] = useState([]);
  const [circles, setCircles] = useState([]);
  const [arrows, setArrows] = useState([]);
  const [textNodes, setTextNodes] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [color, setColor] = useState("#1d4ed8");
  const [thickness, setThickness] = useState(3);
  const [drawingShape, setDrawingShape] = useState(null);

  // Collaboration state
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [cursors, setCursors] = useState(new Map());
  const [boardData, setBoardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState("saved");

  // Chat state
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showShapesDrawer, setShowShapesDrawer] = useState(false);
  const [showPenDrawer, setShowPenDrawer] = useState(false);
  const [showEraserDrawer, setShowEraserDrawer] = useState(false);
  
  // Share state
  const [showShareModal, setShowShareModal] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [shareSettings, setShareSettings] = useState({
    allowAnonymous: true,
    defaultPermission: 'editor'
  });

  const stageRef = useRef();
  const [isPanning, setIsPanning] = useState(false);
  const socketInitialized = useRef(false);
  const boardJoined = useRef(false);

  // Text input
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInputPos, setTextInputPos] = useState({ x: 0, y: 0 });
  const [inputValue, setInputValue] = useState("");

  // Load board data
  useEffect(() => {
    const loadBoard = async () => {
      if (boardId && isAuthenticated) {
        try {
          const response = await boardService.getBoard(boardId);
          setBoardData(response.board);
          
          // Load board content
          if (response.board.data) {
            setLines(response.board.data.lines || []);
            setRects(response.board.data.rectangles || []);
            setCircles(response.board.data.circles || []);
            setArrows(response.board.data.arrows || []);
            setTextNodes(response.board.data.textNodes || []);
          }
        } catch (err) {
          setError("Failed to load board");
          console.error("Load board error:", err);
        }
      }
      setLoading(false);
    };

    loadBoard();
  }, [boardId, isAuthenticated]);

  // Socket connection and event handlers
  useEffect(() => {
    if (isAuthenticated && token && !socketInitialized.current) {
      console.log('🔌 Initializing socket connection...');
      socketInitialized.current = true;
      
      socketService.connect(token);

      // Socket event listeners
      socketService.on('board-state', (data) => {
        if (data.board) {
          setLines(data.board.lines || []);
          setRects(data.board.rectangles || []);
          setCircles(data.board.circles || []);
          setArrows(data.board.arrows || []);
          setTextNodes(data.board.textNodes || []);
        }
        if (data.users) {
          setConnectedUsers(data.users);
        }
      });

      socketService.on('users-update', (users) => {
        setConnectedUsers(users);
      });

      socketService.on('user-joined', (data) => {
        console.log(`${data.user.name} joined the board`);
      });

      socketService.on('user-left', (data) => {
        console.log(`${data.user.name} left the board`);
      });

      socketService.on('line-draw', (data) => {
        setLines(prev => [...prev, { ...data, id: data.id || `line_${Date.now()}_${Math.random()}` }]);
        setSaveStatus("syncing");
        setTimeout(() => setSaveStatus("saved"), 1000);
      });

      socketService.on('rect-draw', (data) => {
        setRects(prev => [...prev, { ...data, id: data.id || `rect_${Date.now()}_${Math.random()}` }]);
        setSaveStatus("syncing");
        setTimeout(() => setSaveStatus("saved"), 1000);
      });

      socketService.on('circle-draw', (data) => {
        setCircles(prev => [...prev, { ...data, id: data.id || `circle_${Date.now()}_${Math.random()}` }]);
        setSaveStatus("syncing");
        setTimeout(() => setSaveStatus("saved"), 1000);
      });

      socketService.on('arrow-draw', (data) => {
        setArrows(prev => [...prev, { ...data, id: data.id || `arrow_${Date.now()}_${Math.random()}` }]);
        setSaveStatus("syncing");
        setTimeout(() => setSaveStatus("saved"), 1000);
      });

      socketService.on('text-add', (data) => {
        setTextNodes(prev => [...prev, { ...data, id: data.id || `text_${Date.now()}_${Math.random()}` }]);
        setSaveStatus("syncing");
        setTimeout(() => setSaveStatus("saved"), 1000);
      });

      socketService.on('cursor-move', (data) => {
        setCursors(prev => {
          const newCursors = new Map(prev);
          newCursors.set(data.userId, {
            x: data.x,
            y: data.y,
            userName: data.userName
          });
          return newCursors;
        });
      });

      socketService.on('board-clear', () => {
        setLines([]);
        setRects([]);
        setCircles([]);
        setArrows([]);
        setTextNodes([]);
        setSaveStatus("syncing");
        setTimeout(() => setSaveStatus("saved"), 1000);
      });

      socketService.on('chat-message', (data) => {
        setChatMessages(prev => [...prev, data]);
      });

      return () => {
        console.log('🧹 Cleaning up socket connection...');
        socketInitialized.current = false;
        boardJoined.current = false;
        socketService.cleanup();
        socketService.disconnect();
      };
    }
  }, [isAuthenticated, token]);

  // Board joining effect - run when boardId changes
  useEffect(() => {
    let joinAttemptTimeout;
    
    const attemptJoinBoard = () => {
      if (isAuthenticated && token && boardId && socketService.connected && !boardJoined.current) {
        console.log('🏠 Attempting to join board:', boardId);
        boardJoined.current = true;
        socketService.joinBoard(boardId);
        return true;
      }
      return false;
    };

    if (isAuthenticated && token && boardId && socketInitialized.current) {
      // Reset board joined flag when board changes
      if (boardJoined.current && socketService.currentBoard !== boardId) {
        boardJoined.current = false;
      }
      
      // Try to join immediately if connected
      if (!attemptJoinBoard()) {
        // If not connected, wait a bit and try again
        joinAttemptTimeout = setTimeout(() => {
          attemptJoinBoard();
        }, 1000);
      }
    }
    
    return () => {
      if (joinAttemptTimeout) {
        clearTimeout(joinAttemptTimeout);
      }
      if (socketService.connected && boardId) {
        socketService.leaveBoard();
        boardJoined.current = false;
      }
    };
  }, [boardId, isAuthenticated, token]);

  // Auto-save functionality
  useEffect(() => {
    if (boardId && boardData && isAuthenticated) {
      const saveTimeout = setTimeout(async () => {
        try {
          await boardService.updateBoard(boardId, {
            data: {
              lines,
              rectangles: rects,
              circles,
              arrows,
              textNodes
            }
          });
          setSaveStatus("saved");
        } catch (err) {
          setSaveStatus("error");
          console.error("Auto-save error:", err);
        }
      }, 2000);

      return () => clearTimeout(saveTimeout);
    }
  }, [lines, rects, circles, arrows, textNodes, boardId, boardData, isAuthenticated]);

  // Infinite grid rendering (same as before)
  const renderGrid = (width, height, scale, offsetX, offsetY) => {
    const gridLines = [];
    
    let dynamicGridSize = GRID_SIZE;
    let opacity = 0.8;
    let strokeColor = "#d1d5db";
    
    if (scale < 0.25) {
      dynamicGridSize = GRID_SIZE * 8;
      opacity = 0.9;
      strokeColor = "#9ca3af";
    } else if (scale < 0.5) {
      dynamicGridSize = GRID_SIZE * 4;
      opacity = 0.85;
      strokeColor = "#d1d5db";
    } else if (scale < 1) {
      dynamicGridSize = GRID_SIZE * 2;
      opacity = 0.8;
      strokeColor = "#d1d5db";
    } else if (scale > 3) {
      dynamicGridSize = GRID_SIZE / 2;
      opacity = 0.7;
      strokeColor = "#e5e7eb";
    } else if (scale > 6) {
      dynamicGridSize = GRID_SIZE / 4;
      opacity = 0.6;
      strokeColor = "#e5e7eb";
    }

    const padding = dynamicGridSize * 10;
    const worldLeft = (-offsetX / scale) - padding;
    const worldTop = (-offsetY / scale) - padding;
    const worldRight = worldLeft + (width / scale) + (padding * 2);
    const worldBottom = worldTop + (height / scale) + (padding * 2);

    const startX = Math.floor(worldLeft / dynamicGridSize) * dynamicGridSize;
    const endX = Math.ceil(worldRight / dynamicGridSize) * dynamicGridSize;
    const startY = Math.floor(worldTop / dynamicGridSize) * dynamicGridSize;
    const endY = Math.ceil(worldBottom / dynamicGridSize) * dynamicGridSize;

    const strokeWidth = Math.max(0.5, Math.min(2, 1 / scale));

    for (let x = startX; x <= endX; x += dynamicGridSize) {
      gridLines.push(
        <Line
          key={`v-${x}-${dynamicGridSize}`}
          points={[x, startY, x, endY]}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          opacity={opacity}
          listening={false}
          perfectDrawEnabled={false}
        />
      );
    }

    for (let y = startY; y <= endY; y += dynamicGridSize) {
      gridLines.push(
        <Line
          key={`h-${y}-${dynamicGridSize}`}
          points={[startX, y, endX, y]}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          opacity={opacity}
          listening={false}
          perfectDrawEnabled={false}
        />
      );
    }

    return gridLines;
  };

  // Helper functions for eraser collision detection
  const isLineIntersectingPoint = (points, point, radius) => {
    for (let i = 0; i < points.length - 2; i += 2) {
      const distance = distanceFromPointToLine(
        point,
        { x: points[i], y: points[i + 1] },
        { x: points[i + 2], y: points[i + 3] }
      );
      if (distance <= radius) return true;
    }
    return false;
  };

  const distanceFromPointToLine = (point, lineStart, lineEnd) => {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;
    
    let xx, yy;
    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }
    
    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const isPointInRect = (point, rect, radius) => {
    return point.x >= rect.x - radius && 
           point.x <= rect.x + rect.width + radius &&
           point.y >= rect.y - radius && 
           point.y <= rect.y + rect.height + radius;
  };

  // Mouse events with socket integration
  // Helper function to generate hexagon points
  const generateHexagonPoints = (x, y, radius) => {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6;
      points.push(
        x + radius * Math.cos(angle),
        y + radius * Math.sin(angle)
      );
    }
    return points;
  };

  const handleMouseDown = (e) => {
    // Skip if we're in select mode - that's handled by stage handlers
    if (tool === TOOL_SELECT) return;
    
    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    
    const worldPos = {
      x: (pointer.x - stagePos.x) / stageScale,
      y: (pointer.y - stagePos.y) / stageScale,
    };

    if (tool === TOOL_PENCIL || tool === TOOL_PEN || tool === TOOL_HIGHLIGHTER || tool === TOOL_MARKER || tool === TOOL_ERASER || tool === TOOL_PARTIAL_ERASER) {
      setIsDrawing(true);
      
      // Handle different pen tools with unique properties
      let lineColor = color;
      let lineThickness = thickness / stageScale;
      let lineOpacity = 1;
      
      if (tool === TOOL_ERASER || tool === TOOL_PARTIAL_ERASER) {
        lineColor = isDark ? "#111827" : "#ffffff";
        lineThickness = (thickness * 1.5) / stageScale;
      } else if (tool === TOOL_HIGHLIGHTER) {
        lineOpacity = 0.4;
        lineThickness = (thickness * 2) / stageScale;
      } else if (tool === TOOL_MARKER) {
        lineThickness = (thickness * 1.2) / stageScale;
      }
      
      const newLine = { 
        tool, 
        points: [worldPos.x, worldPos.y], 
        color: lineColor, 
        thickness: lineThickness,
        opacity: lineOpacity,
        id: `line_${Date.now()}_${Math.random()}`
      };
      setLines([...lines, newLine]);
      setRedoStack([]);
      
      // If eraser, check for intersections with existing shapes
      if (tool === TOOL_ERASER) {
        const eraserRadius = (thickness * 1.5) / stageScale;
        
        // Check and remove intersecting objects
        const remainingLines = lines.filter(line => {
          if (line.tool === TOOL_ERASER) return true; // Keep eraser strokes
          return !isLineIntersectingPoint(line.points, worldPos, eraserRadius);
        });
        
        const remainingRects = rects.filter(rect => {
          return !isPointInRect(worldPos, rect, eraserRadius);
        });
        
        const remainingCircles = circles.filter(circle => {
          const distance = Math.sqrt(
            Math.pow(worldPos.x - circle.x, 2) + 
            Math.pow(worldPos.y - circle.y, 2)
          );
          return distance > circle.radius + eraserRadius;
        });
        
        const remainingArrows = arrows.filter(arrow => {
          return !isLineIntersectingPoint(arrow.points, worldPos, eraserRadius);
        });
        
        const remainingTextNodes = textNodes.filter(textNode => {
          const textWidth = (textNode.text?.length || 0) * (textNode.fontSize || 16) * 0.6;
          const textHeight = textNode.fontSize || 16;
          const textRect = {
            x: textNode.x,
            y: textNode.y,
            width: textWidth,
            height: textHeight
          };
          return !isPointInRect(worldPos, textRect, eraserRadius);
        });
        
        // Update arrays if anything was erased
        if (remainingLines.length !== lines.length) setLines(remainingLines);
        if (remainingRects.length !== rects.length) setRects(remainingRects);
        if (remainingCircles.length !== circles.length) setCircles(remainingCircles);
        if (remainingArrows.length !== arrows.length) setArrows(remainingArrows);
        if (remainingTextNodes.length !== textNodes.length) setTextNodes(remainingTextNodes);
      }
    } else if (tool === TOOL_RECT) {
      setDrawingShape({ 
        type: 'rect',
        x: worldPos.x, 
        y: worldPos.y, 
        width: 0, 
        height: 0, 
        color, 
        thickness: thickness / stageScale 
      });
    } else if (tool === TOOL_CIRCLE) {
      setDrawingShape({ 
        type: 'circle',
        x: worldPos.x, 
        y: worldPos.y, 
        radius: 0, 
        color, 
        thickness: thickness / stageScale 
      });
    } else if (tool === TOOL_ELLIPSE) {
      setDrawingShape({ 
        type: 'ellipse',
        x: worldPos.x, 
        y: worldPos.y, 
        radiusX: 0, 
        radiusY: 0, 
        color, 
        thickness: thickness / stageScale 
      });
    } else if (tool === TOOL_TRIANGLE) {
      setDrawingShape({ 
        type: 'triangle',
        x: worldPos.x, 
        y: worldPos.y, 
        points: [], 
        color, 
        thickness: thickness / stageScale 
      });
    } else if (tool === TOOL_DIAMOND) {
      setDrawingShape({ 
        type: 'diamond',
        x: worldPos.x, 
        y: worldPos.y, 
        width: 0, 
        height: 0, 
        color, 
        thickness: thickness / stageScale 
      });
    } else if (tool === TOOL_STAR) {
      setDrawingShape({ 
        type: 'star',
        x: worldPos.x, 
        y: worldPos.y, 
        innerRadius: 0, 
        outerRadius: 0, 
        numPoints: 5,
        color, 
        thickness: thickness / stageScale 
      });
    } else if (tool === TOOL_HEXAGON) {
      setDrawingShape({ 
        type: 'hexagon',
        x: worldPos.x, 
        y: worldPos.y, 
        radius: 0, 
        color, 
        thickness: thickness / stageScale 
      });
    } else if (tool === TOOL_LINE) {
      setDrawingShape({ 
        type: 'line',
        points: [worldPos.x, worldPos.y, worldPos.x, worldPos.y], 
        color, 
        thickness: thickness / stageScale 
      });
    } else if (tool === TOOL_ARROW) {
      setDrawingShape({ 
        type: 'arrow',
        points: [worldPos.x, worldPos.y, worldPos.x, worldPos.y], 
        color, 
        thickness: thickness / stageScale 
      });
    } else if (tool === TOOL_TEXT) {
      setTextInputPos(worldPos);
      setShowTextInput(true);
    }
  };

  const handleMouseMove = (e) => {
    // Skip if we're in select mode - that's handled by stage handlers
    if (tool === TOOL_SELECT) return;
    
    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    
    const worldPos = {
      x: (pointer.x - stagePos.x) / stageScale,
      y: (pointer.y - stagePos.y) / stageScale,
    };

    // Emit cursor position for collaboration
    if (isAuthenticated && socketService.connected) {
      socketService.emitCursorMove(worldPos);
    }

    if (isDrawing && (tool === TOOL_PENCIL || tool === TOOL_PEN || tool === TOOL_HIGHLIGHTER || tool === TOOL_MARKER || tool === TOOL_ERASER || tool === TOOL_PARTIAL_ERASER)) {
      let lastLine = lines[lines.length - 1];
      lastLine.points = lastLine.points.concat([worldPos.x, worldPos.y]);
      lines.splice(lines.length - 1, 1, lastLine);
      setLines(lines.concat());
      
      // Additional eraser detection during drag
      if (tool === TOOL_ERASER) {
        const eraserRadius = (thickness * 1.5) / stageScale;
        
        // Check and remove intersecting objects during drag
        const remainingLines = lines.filter(line => {
          if (line.tool === TOOL_ERASER || line.id === lastLine.id) return true;
          return !isLineIntersectingPoint(line.points, worldPos, eraserRadius);
        });
        
        const remainingRects = rects.filter(rect => {
          return !isPointInRect(worldPos, rect, eraserRadius);
        });
        
        const remainingCircles = circles.filter(circle => {
          const distance = Math.sqrt(
            Math.pow(worldPos.x - circle.x, 2) + 
            Math.pow(worldPos.y - circle.y, 2)
          );
          return distance > circle.radius + eraserRadius;
        });
        
        const remainingArrows = arrows.filter(arrow => {
          return !isLineIntersectingPoint(arrow.points, worldPos, eraserRadius);
        });
        
        const remainingTextNodes = textNodes.filter(textNode => {
          const textWidth = (textNode.text?.length || 0) * (textNode.fontSize || 16) * 0.6;
          const textHeight = textNode.fontSize || 16;
          const textRect = {
            x: textNode.x,
            y: textNode.y,
            width: textWidth,
            height: textHeight
          };
          return !isPointInRect(worldPos, textRect, eraserRadius);
        });
        
        // Update arrays if anything was erased
        if (remainingLines.length !== lines.length) setLines(remainingLines);
        if (remainingRects.length !== rects.length) setRects(remainingRects);
        if (remainingCircles.length !== circles.length) setCircles(remainingCircles);
        if (remainingArrows.length !== arrows.length) setArrows(remainingArrows);
        if (remainingTextNodes.length !== textNodes.length) setTextNodes(remainingTextNodes);
      }
    } else if (drawingShape) {
      if (drawingShape.type === 'rect') {
        setDrawingShape({
          ...drawingShape,
          width: worldPos.x - drawingShape.x,
          height: worldPos.y - drawingShape.y,
        });
      } else if (drawingShape.type === 'circle') {
        const radius = Math.sqrt(
          Math.pow(worldPos.x - drawingShape.x, 2) + 
          Math.pow(worldPos.y - drawingShape.y, 2)
        );
        setDrawingShape({
          ...drawingShape,
          radius,
        });
      } else if (drawingShape.type === 'ellipse') {
        const radiusX = Math.abs(worldPos.x - drawingShape.x);
        const radiusY = Math.abs(worldPos.y - drawingShape.y);
        setDrawingShape({
          ...drawingShape,
          radiusX,
          radiusY,
        });
      } else if (drawingShape.type === 'triangle') {
        const baseWidth = (worldPos.x - drawingShape.x) * 2;
        const height = worldPos.y - drawingShape.y;
        const points = [
          drawingShape.x, drawingShape.y, // Top point
          drawingShape.x - baseWidth/2, drawingShape.y + height, // Bottom left
          drawingShape.x + baseWidth/2, drawingShape.y + height, // Bottom right
        ];
        setDrawingShape({
          ...drawingShape,
          points,
        });
      } else if (drawingShape.type === 'diamond') {
        setDrawingShape({
          ...drawingShape,
          width: worldPos.x - drawingShape.x,
          height: worldPos.y - drawingShape.y,
        });
      } else if (drawingShape.type === 'star') {
        const outerRadius = Math.sqrt(
          Math.pow(worldPos.x - drawingShape.x, 2) + 
          Math.pow(worldPos.y - drawingShape.y, 2)
        );
        setDrawingShape({
          ...drawingShape,
          outerRadius,
          innerRadius: outerRadius * 0.4,
        });
      } else if (drawingShape.type === 'hexagon') {
        const radius = Math.sqrt(
          Math.pow(worldPos.x - drawingShape.x, 2) + 
          Math.pow(worldPos.y - drawingShape.y, 2)
        );
        setDrawingShape({
          ...drawingShape,
          radius,
        });
      } else if (drawingShape.type === 'line') {
        setDrawingShape({
          ...drawingShape,
          points: [drawingShape.points[0], drawingShape.points[1], worldPos.x, worldPos.y],
        });
      } else if (drawingShape.type === 'arrow') {
        setDrawingShape({
          ...drawingShape,
          points: [drawingShape.points[0], drawingShape.points[1], worldPos.x, worldPos.y],
        });
      }
    }
  };

  const handleMouseUp = () => {
    // Skip if we're in select mode - that's handled by stage handlers
    if (tool === TOOL_SELECT) return;
    
    if (isDrawing) {
      setIsDrawing(false);
      const lastLine = lines[lines.length - 1];
      if (lastLine && socketService.connected) {
        socketService.emitLineDraw(lastLine);
      }
    }
    
    if (drawingShape) {
      const shapeId = `${drawingShape.type}_${Date.now()}_${Math.random()}`;
      const shapeWithId = { ...drawingShape, id: shapeId };
      
      if (drawingShape.type === 'rect' || drawingShape.type === 'diamond') {
        setRects([...rects, shapeWithId]);
        if (socketService.connected) {
          socketService.emitRectDraw(shapeWithId);
        }
      } else if (drawingShape.type === 'circle' || drawingShape.type === 'ellipse' || drawingShape.type === 'hexagon' || drawingShape.type === 'star') {
        setCircles([...circles, shapeWithId]);
        if (socketService.connected) {
          socketService.emitCircleDraw(shapeWithId);
        }
      } else if (drawingShape.type === 'arrow' || drawingShape.type === 'line' || drawingShape.type === 'triangle') {
        setArrows([...arrows, shapeWithId]);
        if (socketService.connected) {
          socketService.emitArrowDraw(shapeWithId);
        }
      }
      
      setDrawingShape(null);
    }
  };

  // Pan/zoom events for select tool
  const handleStageMouseDown = (e) => {
    if (tool === TOOL_SELECT) {
      setIsPanning(true);
      stageRef.current.container().style.cursor = "grabbing";
    }
  };

  const handleStageMouseUp = (e) => {
    if (tool === TOOL_SELECT) {
      setIsPanning(false);
      stageRef.current.container().style.cursor = "grab";
    }
  };

  const handleStageMouseMove = (e) => {
    if (tool === TOOL_SELECT && isPanning && e.evt && e.evt.buttons === 1) {
      const { movementX, movementY } = e.evt;
      setStagePos((pos) => ({
        x: pos.x + movementX,
        y: pos.y + movementY,
      }));
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space" && !showTextInput) {
        e.preventDefault();
        setIsPanning(true);
      }
      
      // Undo/Redo shortcuts
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          handleUndo();
        } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault();
          handleRedo();
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === "Space") {
        setIsPanning(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [showTextInput]);

  // Enhanced zoom
  const handleWheel = (e) => {
    e.evt.preventDefault();
    const scaleBy = 1.05;
    const oldScale = stageScale;
    
    const minScale = 0.05;
    const maxScale = 20;
    
    const pointer = stageRef.current.getPointerPosition();
    const mousePointTo = {
      x: (pointer.x - stagePos.x) / oldScale,
      y: (pointer.y - stagePos.y) / oldScale,
    };
    
    let newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    newScale = Math.max(minScale, Math.min(maxScale, newScale));
    
    if (Math.abs(newScale - oldScale) > 0.001) {
      setStageScale(newScale);
      setStagePos({
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      });
    }
  };

  // Undo/Redo with socket integration
  const handleUndo = () => {
    if (lines.length > 0) {
      setRedoStack([lines[lines.length - 1], ...redoStack]);
      setLines(lines.slice(0, -1));
      if (socketService.connected) {
        socketService.emitUndo();
      }
    } else if (rects.length > 0) {
      setRedoStack([rects[rects.length - 1], ...redoStack]);
      setRects(rects.slice(0, -1));
    } else if (textNodes.length > 0) {
      setRedoStack([textNodes[textNodes.length - 1], ...redoStack]);
      setTextNodes(textNodes.slice(0, -1));
    }
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    setLines([...lines, redoStack[0]]);
    setRedoStack(redoStack.slice(1));
    if (socketService.connected) {
      socketService.emitRedo();
    }
  };

  // Clear board
  const handleClearBoard = () => {
    if (window.confirm("Are you sure you want to clear the entire board? This action cannot be undone.")) {
      setLines([]);
      setRects([]);
      setCircles([]);
      setArrows([]);
      setTextNodes([]);
      setRedoStack([]);
      if (socketService.connected) {
        socketService.emitBoardClear();
      }
    }
  };

  // Color/Thickness
  const handleColorChange = (e) => setColor(e.target.value);
  const handleThicknessChange = (e) => setThickness(Number(e.target.value));

  // Text input handling
  const handleTextInput = (e) => setInputValue(e.target.value);
  const handleTextInputBlur = () => {
    if (inputValue.trim() !== "") {
      const newTextNode = { 
        ...textInputPos, 
        text: inputValue, 
        fontSize: 22 / stageScale,
        color: color,
        id: `text_${Date.now()}_${Math.random()}`
      };
      setTextNodes([...textNodes, newTextNode]);
      
      if (socketService.connected) {
        socketService.emitTextAdd(newTextNode);
      }
    }
    setShowTextInput(false);
    setInputValue("");
  };

  // Chat functionality
  const handleSendMessage = () => {
    if (newMessage.trim() && socketService.connected) {
      socketService.emitChatMessage(newMessage);
      setNewMessage("");
    }
  };

  // Share functionality
  const handleGenerateInviteLink = async () => {
    if (!boardId) {
      console.error('No boardId available for generating invite link');
      setError('Board not loaded. Please wait and try again.');
      return;
    }

    try {
      setIsGeneratingLink(true);
      const response = await boardService.generateInviteLink(boardId, shareSettings);
      setInviteUrl(response.inviteUrl);
      setError("");
    } catch (error) {
      console.error('Error generating invite link:', error);
      setError('Failed to generate invite link. Please try again.');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleCopyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      // You could add a toast notification here
      console.log('Invite link copied to clipboard');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  // Generate invite link when modal opens
  useEffect(() => {
    if (showShareModal && !inviteUrl && boardId) {
      handleGenerateInviteLink();
    }
  }, [showShareModal, boardId]);

  // Loading state
  if (loading) {
    return (
      <div className={`min-h-screen ${colors.bg.secondary}`}>
        <Navbar />
        <div className="pt-20 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className={`mt-4 ${colors.text.secondary}`}>Loading board...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`min-h-screen ${colors.bg.secondary}`}>
        <Navbar />
        <div className="pt-20 flex items-center justify-center">
          <div className="text-center">
            <div className={`${colors.text.danger} text-6xl mb-4`}>⚠️</div>
            <h2 className={`text-2xl font-bold ${colors.text.primary} mb-2`}>Board Error</h2>
            <p className={`${colors.text.secondary} mb-4`}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className={`px-6 py-2 ${colors.accent.primary} text-white rounded-lg hover:opacity-90 transition-opacity`}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while boardId is being parsed from URL
  if (!boardId && isAuthenticated) {
    return (
      <div className={`h-screen flex items-center justify-center ${colors.bg.secondary}`}>
        <div className={`${colors.bg.card} rounded-lg p-8 ${shadows.card} text-center`}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className={`text-lg font-semibold ${colors.text.primary} mb-2`}>Loading Board...</h2>
          <p className={`${colors.text.secondary}`}>Please wait while we load your board</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen flex flex-row ${colors.bg.secondary} overflow-hidden`}>
      {/* Full Screen Navbar - Reduced Height */}
      <div className={`fixed top-0 left-0 right-0 z-40 h-12 ${colors.bg.card} backdrop-blur-xl bg-opacity-95 border-b ${colors.border.primary} ${shadows.card}`}>
        <Navbar />
      </div>

      {/* Static Modern Miro-Inspired Toolbar */}
      <div className={`fixed left-0 top-12 z-30 w-20 h-full ${colors.bg.card} backdrop-blur-xl bg-opacity-95 border-r ${colors.border.primary} flex flex-col items-center py-6 gap-2 ${shadows.card} overflow-y-auto`}>
        {/* Drawing Tools */}
        <div className="flex flex-col gap-2 mb-4">
          <ToolButton
            title="Select & Pan (V)"
            tool={TOOL_SELECT}
            currentTool={tool}
            onClick={() => setTool(TOOL_SELECT)}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2-5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            }
          />

          {/* Pen Tools Category */}
          <motion.button
            onClick={() => setShowPenDrawer(!showPenDrawer)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
              w-14 h-14 flex items-center justify-center rounded-2xl transition-all duration-200 relative
              ${(showPenDrawer || [TOOL_PENCIL, TOOL_PEN, TOOL_HIGHLIGHTER, TOOL_MARKER].includes(tool))
                ? `${colors.accent.primary} text-white shadow-lg` 
                : `${colors.bg.primary} ${colors.text.primary} hover:${colors.bg.tertiary} border ${colors.border.primary}`
              }
            `}
            title="Pen Tools"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            {(showPenDrawer || [TOOL_PENCIL, TOOL_PEN, TOOL_HIGHLIGHTER, TOOL_MARKER].includes(tool)) && (
              <motion.div
                className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-full"
                layoutId="penIndicator"
              />
            )}
          </motion.button>

          {/* Eraser Tools */}
          <motion.button
            onClick={() => setShowEraserDrawer(!showEraserDrawer)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
              w-14 h-14 flex items-center justify-center rounded-2xl transition-all duration-200 relative
              ${(showEraserDrawer || [TOOL_ERASER, TOOL_PARTIAL_ERASER].includes(tool))
                ? `${colors.accent.primary} text-white shadow-lg` 
                : `${colors.bg.primary} ${colors.text.primary} hover:${colors.bg.tertiary} border ${colors.border.primary}`
              }
            `}
            title="Eraser Tools"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </motion.button>
        </div>

        {/* Shapes Drawer Toggle */}
        <div className={`w-14 h-px ${colors.bg.tertiary} mb-2`}></div>
        <div className="flex flex-col gap-2 mb-4">
          <motion.button
            onClick={() => setShowShapesDrawer(!showShapesDrawer)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
              w-14 h-14 flex items-center justify-center rounded-2xl transition-all duration-200 relative
              ${(showShapesDrawer || [TOOL_RECT, TOOL_CIRCLE, TOOL_ARROW, TOOL_TEXT, TOOL_LINE, TOOL_TRIANGLE, TOOL_DIAMOND, TOOL_STAR, TOOL_HEXAGON, TOOL_ELLIPSE].includes(tool))
                ? `${colors.accent.primary} text-white shadow-lg` 
                : `${colors.bg.primary} ${colors.text.primary} hover:${colors.bg.tertiary} border ${colors.border.primary}`
              }
            `}
            title="Shapes"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            {(showShapesDrawer || [TOOL_RECT, TOOL_CIRCLE, TOOL_ARROW, TOOL_TEXT, TOOL_LINE, TOOL_TRIANGLE, TOOL_DIAMOND, TOOL_STAR, TOOL_HEXAGON, TOOL_ELLIPSE].includes(tool)) && (
              <motion.div
                className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-full"
                layoutId="shapeIndicator"
              />
            )}
          </motion.button>
        </div>

        {/* Actions */}
        <div className={`w-14 h-px ${colors.bg.tertiary} mb-2`}></div>
        <div className="flex flex-col gap-2 mb-4">
          <ActionButton
            title="Undo (Ctrl+Z)"
            onClick={handleUndo}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            }
          />
          
          <ActionButton
            title="Redo (Ctrl+Y)"
            onClick={handleRedo}
            className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
              </svg>
            }
          />
          
          <ActionButton
            title="Clear Board"
            onClick={handleClearBoard}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            }
          />
        </div>

        {/* Style Controls */}
        <div className={`w-14 h-px ${colors.bg.tertiary} mb-2`}></div>
        <div className="flex flex-col gap-3 items-center">
          {/* Color Picker */}
          <div className="relative">
            <input
              title="Color"
              type="color"
              value={color}
              onChange={handleColorChange}
              className="w-12 h-12 rounded-xl border-2 border-gray-200 dark:border-gray-600 cursor-pointer hover:scale-110 transition-transform shadow-lg"
              style={{ backgroundColor: color }}
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-md">
              <svg className="w-2 h-2 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Thickness Control */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <input
                title="Brush Size"
                type="range"
                min={1}
                max={20}
                value={thickness}
                onChange={handleThicknessChange}
                className="w-12 h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, ${color} 0%, ${color} ${(thickness/20)*100}%, #e5e7eb ${(thickness/20)*100}%, #e5e7eb 100%)`
                }}
              />
            </div>
            <div className={`text-xs font-medium ${colors.text.secondary} bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full`}>
              {thickness}px
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Shapes Grid Drawer */}
      <AnimatePresence>
        {showShapesDrawer && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 20 }}
            className={`fixed bottom-6 left-24 z-40 ${colors.bg.card} backdrop-blur-xl bg-opacity-95 rounded-2xl p-4 border ${colors.border.primary} ${shadows.card}`}
          >
            <div className="grid grid-cols-5 gap-3">
              {/* Basic Shapes Row 1 */}
              <ToolButton
                title="Rectangle (R)"
                tool={TOOL_RECT}
                currentTool={tool}
                onClick={() => { setTool(TOOL_RECT); setShowShapesDrawer(false); }}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  </svg>
                }
              />
              
              <ToolButton
                title="Circle (C)"
                tool={TOOL_CIRCLE}
                currentTool={tool}
                onClick={() => { setTool(TOOL_CIRCLE); setShowShapesDrawer(false); }}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/>
                  </svg>
                }
              />

              <ToolButton
                title="Ellipse"
                tool={TOOL_ELLIPSE}
                currentTool={tool}
                onClick={() => { setTool(TOOL_ELLIPSE); setShowShapesDrawer(false); }}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <ellipse cx="12" cy="12" rx="9" ry="6"/>
                  </svg>
                }
              />

              <ToolButton
                title="Triangle"
                tool={TOOL_TRIANGLE}
                currentTool={tool}
                onClick={() => { setTool(TOOL_TRIANGLE); setShowShapesDrawer(false); }}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l10 18H2z" stroke="currentColor" strokeWidth="2" fill="none"/>
                  </svg>
                }
              />

              <ToolButton
                title="Diamond"
                tool={TOOL_DIAMOND}
                currentTool={tool}
                onClick={() => { setTool(TOOL_DIAMOND); setShowShapesDrawer(false); }}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l6 10-6 10-6-10z" stroke="currentColor" strokeWidth="2" fill="none"/>
                  </svg>
                }
              />

              {/* Basic Shapes Row 2 */}
              <ToolButton
                title="Star"
                tool={TOOL_STAR}
                currentTool={tool}
                onClick={() => { setTool(TOOL_STAR); setShowShapesDrawer(false); }}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" fill="none"/>
                  </svg>
                }
              />

              <ToolButton
                title="Hexagon"
                tool={TOOL_HEXAGON}
                currentTool={tool}
                onClick={() => { setTool(TOOL_HEXAGON); setShowShapesDrawer(false); }}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M17 3l4 6.5-4 6.5H7l-4-6.5L7 3z" stroke="currentColor" strokeWidth="2" fill="none"/>
                  </svg>
                }
              />

              <ToolButton
                title="Line"
                tool={TOOL_LINE}
                currentTool={tool}
                onClick={() => { setTool(TOOL_LINE); setShowShapesDrawer(false); }}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <line x1="4" y1="20" x2="20" y2="4" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                }
              />

              <ToolButton
                title="Arrow (A)"
                tool={TOOL_ARROW}
                currentTool={tool}
                onClick={() => { setTool(TOOL_ARROW); setShowShapesDrawer(false); }}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                }
              />

              <ToolButton
                title="Text (T)"
                tool={TOOL_TEXT}
                currentTool={tool}
                onClick={() => { setTool(TOOL_TEXT); setShowShapesDrawer(false); }}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4M8 15l4 4 4-4" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14" />
                  </svg>
                }
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Horizontal Pen Tools Drawer */}
      <AnimatePresence>
        {showPenDrawer && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 20 }}
            className={`fixed bottom-6 left-24 z-40 ${colors.bg.card} backdrop-blur-xl bg-opacity-95 rounded-2xl p-4 border ${colors.border.primary} ${shadows.card}`}
          >
            <div className="grid grid-cols-4 gap-3">
              <ToolButton
                title="Pencil (P)"
                tool={TOOL_PENCIL}
                currentTool={tool}
                onClick={() => { setTool(TOOL_PENCIL); setShowPenDrawer(false); }}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                }
              />

              <ToolButton
                title="Pen"
                tool={TOOL_PEN}
                currentTool={tool}
                onClick={() => { setTool(TOOL_PEN); setShowPenDrawer(false); }}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                }
              />

              <ToolButton
                title="Highlighter"
                tool={TOOL_HIGHLIGHTER}
                currentTool={tool}
                onClick={() => { setTool(TOOL_HIGHLIGHTER); setShowPenDrawer(false); }}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M9 12l2 2 4-4" opacity="0.7" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M15 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                }
              />

              <ToolButton
                title="Marker"
                tool={TOOL_MARKER}
                currentTool={tool}
                onClick={() => { setTool(TOOL_MARKER); setShowPenDrawer(false); }}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                }
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Horizontal Eraser Tools Drawer */}
      <AnimatePresence>
        {showEraserDrawer && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 20 }}
            className={`fixed bottom-6 left-24 z-40 ${colors.bg.card} backdrop-blur-xl bg-opacity-95 rounded-2xl p-4 border ${colors.border.primary} ${shadows.card}`}
          >
            <div className="grid grid-cols-2 gap-3">
              <ToolButton
                title="Eraser (E)"
                tool={TOOL_ERASER}
                currentTool={tool}
                onClick={() => { setTool(TOOL_ERASER); setShowEraserDrawer(false); }}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                }
              />

              <ToolButton
                title="Partial Eraser"
                tool={TOOL_PARTIAL_ERASER}
                currentTool={tool}
                onClick={() => { setTool(TOOL_PARTIAL_ERASER); setShowEraserDrawer(false); }}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" opacity="0.5" />
                  </svg>
                }
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Canvas Area - Adjusted for static toolbar */}
      <div className="flex-1 overflow-hidden relative ml-20 mt-12"
           style={{ 
             cursor: tool === TOOL_SELECT ? (isPanning ? 'grabbing' : 'grab') : 
                     tool === TOOL_ERASER ? 'crosshair' : 
                     tool === TOOL_PARTIAL_ERASER ? 'crosshair' : 'crosshair' 
           }}
      >
        {/* Top toolbar */}
        <motion.div 
          className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className={`${colors.bg.card} backdrop-blur-xl bg-opacity-95 rounded-2xl ${shadows.card} px-6 py-3 flex items-center gap-4 border ${colors.border.primary}`}>
            <h2 className={`font-semibold ${colors.text.primary}`}>
              {boardData?.title || "Untitled Board"}
            </h2>
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${
                saveStatus === 'saved' ? 'bg-green-500' : 
                saveStatus === 'syncing' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <span className={colors.text.secondary}>
                {saveStatus === 'saved' ? 'Saved' : 
                 saveStatus === 'syncing' ? 'Syncing...' : 'Error saving'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Connected users */}
            {connectedUsers.length > 0 && (
              <div className={`${colors.bg.card} backdrop-blur-xl bg-opacity-95 rounded-2xl ${shadows.card} px-6 py-3 flex items-center gap-4 border ${colors.border.primary}`}>
                <div className="flex -space-x-3">
                  {connectedUsers.slice(0, 5).map((user, index) => (
                    <div
                      key={user.id}
                      className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center text-sm font-semibold border-3 border-white dark:border-gray-800 shadow-lg"
                      title={user.name}
                    >
                      {user.name?.charAt(0)?.toUpperCase()}
                    </div>
                  ))}
                  {connectedUsers.length > 5 && (
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 text-white rounded-full flex items-center justify-center text-sm font-semibold border-3 border-white dark:border-gray-800 shadow-lg">
                      +{connectedUsers.length - 5}
                    </div>
                  )}
                </div>
                <span className={`text-sm ${colors.text.secondary}`}>
                  {connectedUsers.length} online
                </span>
              </div>
            )}

            {/* Chat toggle */}
            <motion.button
              onClick={() => setShowChat(!showChat)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`${colors.bg.card} backdrop-blur-xl bg-opacity-95 rounded-2xl ${shadows.card} p-3 hover:${colors.bg.tertiary} transition-all duration-200 border ${colors.border.primary}`}
              title="Toggle Chat"
            >
              <svg className={`w-6 h-6 ${colors.text.primary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </motion.button>

            {/* Share button */}
            <motion.button
              onClick={() => boardId && setShowShareModal(true)}
              whileHover={boardId ? { scale: 1.05 } : {}}
              whileTap={boardId ? { scale: 0.95 } : {}}
              disabled={!boardId}
              className={`${colors.bg.card} backdrop-blur-xl bg-opacity-95 rounded-2xl ${shadows.card} p-3 ${
                boardId ? `hover:${colors.bg.tertiary} cursor-pointer` : 'opacity-50 cursor-not-allowed'
              } transition-all duration-200 border ${colors.border.primary}`}
              title={boardId ? "Share Board" : "Board not loaded"}
            >
              <svg className={`w-6 h-6 ${colors.text.primary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </motion.button>
          </div>
        </motion.div>

        <Stage
          width={window.innerWidth - 80}
          height={window.innerHeight - 80}
          ref={stageRef}
          scaleX={stageScale}
          scaleY={stageScale}
          x={stagePos.x}
          y={stagePos.y}
          onMouseDown={tool === TOOL_SELECT ? handleStageMouseDown : handleMouseDown}
          onMouseMove={tool === TOOL_SELECT ? handleStageMouseMove : handleMouseMove}
          onMouseUp={tool === TOOL_SELECT ? handleStageMouseUp : handleMouseUp}
          onWheel={handleWheel}
          className={`${colors.bg.secondary}`}
          style={{
            cursor: tool === TOOL_SELECT
              ? (isPanning ? "grabbing" : "grab")
              : tool === TOOL_PENCIL
              ? "crosshair"
              : tool === TOOL_ERASER
              ? "cell"
              : "default",
          }}
        >
          {/* Grid Layer */}
          <Layer listening={false}>
            {renderGrid(
              window.innerWidth - 80,
              window.innerHeight - 80,
              stageScale,
              stagePos.x,
              stagePos.y
            )}
          </Layer>
          
          {/* Drawing Layer */}
          <Layer>
            {/* Lines with different tool styles */}
            {lines.map((line, i) => (
              <Line
                key={line.id || i}
                points={line.points}
                stroke={line.tool === TOOL_ERASER || line.tool === TOOL_PARTIAL_ERASER ? (isDark ? "#111827" : "#ffffff") : line.color || "#1d4ed8"}
                strokeWidth={line.thickness}
                opacity={line.opacity || 1}
                tension={0.5}
                lineCap="round"
                globalCompositeOperation={
                  line.tool === TOOL_ERASER || line.tool === TOOL_PARTIAL_ERASER ? "destination-out" : "source-over"
                }
              />
            ))}

            {/* Rectangles and Diamonds */}
            {rects.map((rect, idx) => {
              if (rect.type === 'diamond') {
                // Diamond shape using Line
                const centerX = rect.x + rect.width / 2;
                const centerY = rect.y + rect.height / 2;
                const points = [
                  centerX, rect.y, // Top
                  rect.x + rect.width, centerY, // Right
                  centerX, rect.y + rect.height, // Bottom
                  rect.x, centerY, // Left
                  centerX, rect.y // Back to top
                ];
                return (
                  <Line
                    key={rect.id || idx}
                    points={points}
                    stroke={rect.color}
                    strokeWidth={rect.thickness}
                    fill={rect.fill || 'transparent'}
                    closed={true}
                  />
                );
              }
              return (
                <Rect
                  key={rect.id || idx}
                  x={rect.x}
                  y={rect.y}
                  width={rect.width}
                  height={rect.height}
                  stroke={rect.color}
                  strokeWidth={rect.thickness}
                  fill={rect.fill || 'transparent'}
                />
              );
            })}

            {/* Circles and Complex Shapes */}
            {circles.map((shape, idx) => {
              if (shape.type === 'ellipse') {
                return (
                  <Ellipse
                    key={shape.id || idx}
                    x={shape.x}
                    y={shape.y}
                    radiusX={shape.radiusX}
                    radiusY={shape.radiusY}
                    stroke={shape.color}
                    strokeWidth={shape.thickness}
                    fill={shape.fill || 'transparent'}
                  />
                );
              } else if (shape.type === 'star') {
                return (
                  <Star
                    key={shape.id || idx}
                    x={shape.x}
                    y={shape.y}
                    numPoints={shape.numPoints || 5}
                    innerRadius={shape.innerRadius}
                    outerRadius={shape.outerRadius}
                    stroke={shape.color}
                    strokeWidth={shape.thickness}
                    fill={shape.fill || 'transparent'}
                  />
                );
              } else if (shape.type === 'hexagon') {
                // Create hexagon using helper function
                return (
                  <Line
                    key={shape.id || idx}
                    points={generateHexagonPoints(shape.x, shape.y, shape.radius)}
                    stroke={shape.color}
                    strokeWidth={shape.thickness}
                    fill={shape.fill || 'transparent'}
                    closed={true}
                  />
                );
              }
              // Default circle
              return (
                <Circle
                  key={shape.id || idx}
                  x={shape.x}
                  y={shape.y}
                  radius={shape.radius}
                  stroke={shape.color}
                  strokeWidth={shape.thickness}
                  fill={shape.fill || 'transparent'}
                />
              );
            })}

            {/* Arrows, Lines, and Triangles */}
            {arrows.map((shape, idx) => {
              if (shape.type === 'line') {
                return (
                  <Line
                    key={shape.id || idx}
                    points={shape.points}
                    stroke={shape.color}
                    strokeWidth={shape.thickness}
                  />
                );
              } else if (shape.type === 'triangle') {
                return (
                  <Line
                    key={shape.id || idx}
                    points={shape.points}
                    stroke={shape.color}
                    strokeWidth={shape.thickness}
                    fill={shape.fill || 'transparent'}
                    closed={true}
                  />
                );
              }
              // Default arrow
              return (
                <Arrow
                  key={shape.id || idx}
                  points={shape.points}
                  stroke={shape.color}
                  strokeWidth={shape.thickness}
                  fill={shape.color}
                  pointerLength={20}
                  pointerWidth={20}
                />
              );
            })}

            {/* Text nodes */}
            {textNodes.map((node, idx) => (
              <Text
                key={node.id || idx}
                x={node.x}
                y={node.y}
                text={node.text}
                fontSize={node.fontSize || 22 / stageScale}
                fill={node.color || "#222"}
                draggable
              />
            ))}

            {/* Drawing preview for all shapes */}
            {drawingShape && drawingShape.type === 'rect' && Math.abs(drawingShape.width) > 1 && Math.abs(drawingShape.height) > 1 && (
              <Rect
                x={drawingShape.x}
                y={drawingShape.y}
                width={drawingShape.width}
                height={drawingShape.height}
                stroke={drawingShape.color}
                strokeWidth={drawingShape.thickness}
                dash={[10, 5]}
              />
            )}

            {drawingShape && drawingShape.type === 'diamond' && Math.abs(drawingShape.width) > 1 && Math.abs(drawingShape.height) > 1 && (
              <Line
                points={[
                  drawingShape.x + drawingShape.width / 2, drawingShape.y,
                  drawingShape.x + drawingShape.width, drawingShape.y + drawingShape.height / 2,
                  drawingShape.x + drawingShape.width / 2, drawingShape.y + drawingShape.height,
                  drawingShape.x, drawingShape.y + drawingShape.height / 2,
                  drawingShape.x + drawingShape.width / 2, drawingShape.y
                ]}
                stroke={drawingShape.color}
                strokeWidth={drawingShape.thickness}
                dash={[10, 5]}
                closed={true}
              />
            )}
            
            {drawingShape && drawingShape.type === 'circle' && drawingShape.radius > 1 && (
              <Circle
                x={drawingShape.x}
                y={drawingShape.y}
                radius={drawingShape.radius}
                stroke={drawingShape.color}
                strokeWidth={drawingShape.thickness}
                dash={[10, 5]}
              />
            )}

            {drawingShape && drawingShape.type === 'ellipse' && drawingShape.radiusX > 1 && drawingShape.radiusY > 1 && (
              <Ellipse
                x={drawingShape.x}
                y={drawingShape.y}
                radiusX={drawingShape.radiusX}
                radiusY={drawingShape.radiusY}
                stroke={drawingShape.color}
                strokeWidth={drawingShape.thickness}
                dash={[10, 5]}
              />
            )}

            {drawingShape && drawingShape.type === 'star' && drawingShape.outerRadius > 0 && (
              <Star
                x={drawingShape.x}
                y={drawingShape.y}
                numPoints={drawingShape.numPoints || 5}
                innerRadius={drawingShape.innerRadius}
                outerRadius={drawingShape.outerRadius}
                stroke={drawingShape.color}
                strokeWidth={drawingShape.thickness}
                dash={[10, 5]}
              />
            )}

            {drawingShape && drawingShape.type === 'hexagon' && drawingShape.radius > 0 && (
              <Line
                points={generateHexagonPoints(drawingShape.x, drawingShape.y, drawingShape.radius)}
                stroke={drawingShape.color}
                strokeWidth={drawingShape.thickness}
                dash={[10, 5]}
                closed={true}
              />
            )}

            {drawingShape && drawingShape.type === 'triangle' && drawingShape.points && drawingShape.points.length >= 6 && (
              <Line
                points={drawingShape.points}
                stroke={drawingShape.color}
                strokeWidth={drawingShape.thickness}
                dash={[10, 5]}
                closed={true}
              />
            )}

            {drawingShape && drawingShape.type === 'line' && (
              <Line
                points={drawingShape.points}
                stroke={drawingShape.color}
                strokeWidth={drawingShape.thickness}
                dash={[10, 5]}
              />
            )}
            
            {drawingShape && drawingShape.type === 'arrow' && (
              <Arrow
                points={drawingShape.points}
                stroke={drawingShape.color}
                strokeWidth={drawingShape.thickness}
                fill={drawingShape.color}
                pointerLength={20}
                pointerWidth={20}
                dash={[10, 5]}
              />
            )}
          </Layer>

          {/* Cursors Layer */}
          <Layer listening={false}>
            {Array.from(cursors.entries()).map(([userId, cursor]) => (
              <Group key={userId}>
                <Circle
                  x={cursor.x}
                  y={cursor.y}
                  radius={8}
                  fill="#ff6b6b"
                  stroke="#fff"
                  strokeWidth={2}
                />
                <Text
                  x={cursor.x + 15}
                  y={cursor.y - 10}
                  text={cursor.userName}
                  fontSize={12}
                  fill="#333"
                />
              </Group>
            ))}
          </Layer>
        </Stage>

        {/* Text input overlay */}
        {showTextInput && (
          <input
            type="text"
            style={{
              position: "absolute",
              left: textInputPos.x * stageScale + stagePos.x,
              top: textInputPos.y * stageScale + stagePos.y,
              zIndex: 100,
              fontSize: Math.max(12, 22 * stageScale),
              border: "2px solid #1d4ed8",
              outline: "none",
              padding: "4px 8px",
              borderRadius: "4px",
              background: "#fff",
              color: color,
              minWidth: "150px",
            }}
            value={inputValue}
            onChange={handleTextInput}
            onBlur={handleTextInputBlur}
            autoFocus
            onKeyDown={e => {
              if (e.key === "Enter") handleTextInputBlur();
              if (e.key === "Escape") {
                setShowTextInput(false);
                setInputValue("");
              }
            }}
          />
        )}
      </div>

      {/* Chat Panel */}
      {showChat && (
        <div className="w-80 bg-white border-l border-gray-200 mt-20 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Chat</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.length === 0 ? (
              <p className="text-gray-500 text-center text-sm">No messages yet</p>
            ) : (
              chatMessages.map((msg) => (
                <div key={msg.id} className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-gray-900">{msg.userName}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-2">
                    {msg.message}
                  </p>
                </div>
              ))
            )}
          </div>
          
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendMessage();
                }}
                placeholder="Type a message..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error notification */}
      {error && (
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {error}
        </div>
      )}

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={`${colors.bg.card} rounded-2xl shadow-xl max-w-md w-full mx-4 max-h-96 overflow-y-auto`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-xl font-semibold ${colors.text.primary}`}>
                    Share Board
                  </h3>
                  <button
                    onClick={() => setShowShareModal(false)}
                    className={`${colors.text.secondary} hover:${colors.text.primary}`}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Invite Link Section */}
                  <div>
                    <label className={`block text-sm font-medium ${colors.text.primary} mb-2`}>
                      Invite Link
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inviteUrl}
                        readOnly
                        className={`flex-1 px-3 py-2 border ${colors.border.primary} rounded-lg ${colors.bg.primary} ${colors.text.primary} text-sm`}
                        placeholder={isGeneratingLink ? "Generating link..." : "Invite link will appear here"}
                      />
                      <button
                        onClick={handleCopyInviteLink}
                        disabled={!inviteUrl}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        title="Copy to clipboard"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Share Settings */}
                  <div className="space-y-3">
                    <h4 className={`text-sm font-medium ${colors.text.primary}`}>Share Settings</h4>
                    
                    {/* Anonymous Access */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className={`text-sm ${colors.text.primary}`}>Allow anonymous access</label>
                        <p className={`text-xs ${colors.text.secondary}`}>Let anyone with the link join without signing in</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={shareSettings.allowAnonymous}
                        onChange={(e) => setShareSettings(prev => ({...prev, allowAnonymous: e.target.checked}))}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>

                    {/* Default Permission */}
                    <div>
                      <label className={`block text-sm ${colors.text.primary} mb-1`}>Default permission</label>
                      <select
                        value={shareSettings.defaultPermission}
                        onChange={(e) => setShareSettings(prev => ({...prev, defaultPermission: e.target.value}))}
                        className={`w-full px-3 py-2 border ${colors.border.primary} rounded-lg ${colors.bg.primary} ${colors.text.primary} text-sm`}
                      >
                        <option value="viewer">Viewer (can only view)</option>
                        <option value="editor">Editor (can edit)</option>
                      </select>
                    </div>
                  </div>

                  {/* Generate New Link Button */}
                  <button
                    onClick={handleGenerateInviteLink}
                    disabled={isGeneratingLink}
                    className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isGeneratingLink ? "Generating..." : "Update Link"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Board;
