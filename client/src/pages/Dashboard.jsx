import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { boardService } from "../services/boardService";
import Navbar from "../components/Navbar";
import { motion, AnimatePresence } from "framer-motion";

const Dashboard = () => {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBoardData, setNewBoardData] = useState({
    title: "",
    description: "",
    isPublic: false
  });
  const [creatingBoard, setCreatingBoard] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // grid or list

  const { user, logout } = useAuth();
  const { colors, shadows, isDark } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    loadBoards();
  }, []);

  const loadBoards = async () => {
    try {
      setError(""); // Clear any previous errors
      console.log("Loading boards..."); // Debug log
      const response = await boardService.getBoards();
      console.log("Boards response:", response); // Debug log
      setBoards(response.boards || []);
      
      // If no boards found, don't show error
      if (!response.boards || response.boards.length === 0) {
        console.log("No boards found for user");
      }
    } catch (err) {
      console.error("Load boards error details:", {
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data
      });
      
      // Check if it's an authentication error
      if (err.response?.status === 401 || err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        setError("Please log in to view your boards");
      } else if (err.response?.status === 403) {
        setError("You don't have permission to view boards");
      } else if (err.message?.includes('Network Error') || err.message?.includes('ECONNREFUSED') || !err.response) {
        setError("Unable to connect to server. Please check your connection and try again.");
      } else if (err.response?.status >= 500) {
        setError("Server error. Please try again later.");
      } else {
        // For other errors, provide a more user-friendly message
        setError(`Unable to load boards: ${err.response?.data?.message || err.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    setCreatingBoard(true);

    try {
      const response = await boardService.createBoard(newBoardData);
      setBoards([response.board, ...boards]);
      setShowCreateModal(false);
      setNewBoardData({ title: "", description: "", isPublic: false });
      
      // Navigate to the new board
      navigate(`/board/${response.board._id}`);
    } catch (err) {
      setError("Failed to create board");
      console.error("Create board error:", err);
    } finally {
      setCreatingBoard(false);
    }
  };

  const handleDeleteBoard = async (boardId) => {
    if (!window.confirm("Are you sure you want to delete this board? This action cannot be undone.")) {
      return;
    }

    try {
      await boardService.deleteBoard(boardId);
      setBoards(boards.filter(board => board._id !== boardId));
    } catch (err) {
      setError("Failed to delete board");
      console.error("Delete board error:", err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const filteredBoards = boards.filter(board =>
    board.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    board.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const quickActions = [
    {
      title: "Create Board",
      description: "Start a new collaborative whiteboard",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      action: () => setShowCreateModal(true),
      gradient: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      textColor: "text-blue-600 dark:text-blue-400"
    },
    {
      title: "Quick Board",
      description: "Jump into a temporary whiteboard",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      action: () => navigate("/board"),
      gradient: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      textColor: "text-green-600 dark:text-green-400"
    },
    {
      title: "Import Board",
      description: "Upload existing whiteboard files",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      ),
      action: () => {/* TODO: implement import */},
      gradient: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      textColor: "text-purple-600 dark:text-purple-400"
    },
    {
      title: "Templates",
      description: "Start from professional templates",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      action: () => {/* TODO: implement templates */},
      gradient: "from-orange-500 to-red-500",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      textColor: "text-orange-600 dark:text-orange-400"
    }
  ];

  if (loading) {
    return (
      <div className={`min-h-screen ${colors.bg.secondary}`}>
        <Navbar />
        <div className="pt-20 flex items-center justify-center">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="relative">
              <div className="animate-spin rounded-full h-32 w-32 border-4 border-transparent bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-border mx-auto"></div>
              <div className={`absolute inset-2 rounded-full ${colors.bg.secondary}`}></div>
            </div>
            <p className={`mt-6 text-lg ${colors.text.secondary}`}>Loading your workspace...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${colors.bg.secondary}`}>
      <Navbar />
      
      <div className="pt-24 px-6 max-w-7xl mx-auto pb-12">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className={`text-4xl font-bold ${colors.text.primary} bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent`}>
                Welcome back, {user?.name}! 👋
              </h1>
              <p className={`${colors.text.secondary} mt-2 text-lg`}>
                {boards.length === 0 
                  ? "Create your first collaborative whiteboard to get started" 
                  : `You have ${boards.length} board${boards.length !== 1 ? 's' : ''} in your workspace`
                }
              </p>
            </div>
            
            {/* Search and View Controls */}
            <div className="flex flex-col sm:flex-row gap-4 min-w-0 flex-shrink-0">
              <div className="relative">
                <svg className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${colors.text.tertiary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search boards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-10 pr-4 py-3 w-64 ${colors.bg.input} ${colors.text.primary} ${colors.border.primary} border rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all`}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                  className={`p-3 ${colors.bg.secondary} ${colors.text.secondary} border ${colors.border.primary} rounded-xl hover:${colors.text.primary} transition-all hover:scale-105`}
                  title={`Switch to ${viewMode === "grid" ? "list" : "grid"} view`}
                >
                  {viewMode === "grid" ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    </svg>
                  )}
                </button>
                
                <button
                  onClick={() => setShowCreateModal(true)}
                  className={`bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 ${shadows.button} flex items-center gap-2`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Board
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {error && (
          <motion.div 
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-400 mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                {error}
              </div>
              <button
                onClick={() => {
                  setError("");
                  setLoading(true);
                  loadBoards();
                }}
                className="px-3 py-1 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className={`text-2xl font-bold ${colors.text.primary} mb-6`}>Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={action.action}
                className={`${colors.bg.card} ${action.bgColor} rounded-2xl p-6 border ${colors.border.primary} ${shadows.card} cursor-pointer transition-all duration-300 ${colors.bg.hover} group`}
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${action.gradient} rounded-2xl flex items-center justify-center mb-4 text-white group-hover:scale-110 transition-transform duration-300`}>
                  {action.icon}
                </div>
                <h3 className={`font-bold text-lg ${colors.text.primary} mb-2 group-hover:${action.textColor} transition-colors`}>
                  {action.title}
                </h3>
                <p className={`${colors.text.secondary} text-sm group-hover:${colors.text.primary} transition-colors`}>
                  {action.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Boards or Empty State */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-2xl font-bold ${colors.text.primary}`}>
              {searchTerm ? `Search Results (${filteredBoards.length})` : 'Your Boards'}
            </h2>
            {boards.length > 0 && (
              <div className={`${colors.text.secondary} text-sm`}>
                {filteredBoards.length} of {boards.length} boards
              </div>
            )}
          </div>
          {filteredBoards.length === 0 && searchTerm ? (
            <div className="text-center py-16">
              <div className={`w-24 h-24 ${colors.bg.tertiary} rounded-full flex items-center justify-center mx-auto mb-6`}>
                <svg className={`w-12 h-12 ${colors.text.tertiary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className={`text-xl font-semibold ${colors.text.primary} mb-2`}>No boards found</h3>
              <p className={`${colors.text.secondary} mb-6`}>Try adjusting your search terms</p>
              <button
                onClick={() => setSearchTerm("")}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
              >
                Clear Search
              </button>
            </div>
          ) : filteredBoards.length === 0 ? (
            <div className="text-center py-16">
              <motion.div 
                className={`w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-6`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6, type: "spring" }}
              >
                <svg className={`w-16 h-16 ${colors.text.tertiary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </motion.div>
              <h3 className={`text-2xl font-bold ${colors.text.primary} mb-4`}>Ready to create your first board?</h3>
              <p className={`${colors.text.secondary} mb-8 text-lg max-w-md mx-auto`}>
                Collaborative whiteboards help you brainstorm, plan, and create together with your team.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  Create Your First Board
                </button>
                <button
                  onClick={() => navigate("/board")}
                  className={`${colors.bg.secondary} ${colors.text.primary} border ${colors.border.primary} px-8 py-4 rounded-xl font-bold hover:${colors.bg.tertiary} transition-all`}
                >
                  Try Quick Board
                </button>
              </div>
            </div>
          ) : (
            <div className={`grid gap-6 ${viewMode === "grid" 
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
              : "grid-cols-1"
            }`}>
              <AnimatePresence>
                {filteredBoards.map((board, index) => (
                  <motion.div
                    key={board._id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    whileHover={{ y: -8 }}
                    className={`${colors.bg.card} rounded-2xl border ${colors.border.primary} ${shadows.card} cursor-pointer transition-all duration-300 group overflow-hidden ${viewMode === "list" ? "flex" : ""}`}
                    onClick={() => navigate(`/board/${board._id}`)}
                  >
                    {/* Board Preview/Thumbnail */}
                    <div className={`${viewMode === "list" ? "w-48 h-32" : "h-48"} bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 flex items-center justify-center relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
                      <div className="relative z-10 text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        {viewMode === "grid" && (
                          <div className={`text-sm ${colors.text.secondary} font-medium`}>
                            {board.objects?.length || 0} objects
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Board Info */}
                    <div className={`p-6 ${viewMode === "list" ? "flex-1" : ""}`}>
                      <div className="flex items-start justify-between mb-3">
                        <h3 className={`font-bold text-lg ${colors.text.primary} truncate flex-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors`}>
                          {board.title}
                        </h3>
                        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                          {board.isPublic && (
                            <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs px-2 py-1 rounded-full font-medium">
                              Public
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteBoard(board._id);
                            }}
                            className={`opacity-0 group-hover:opacity-100 p-2 rounded-lg ${colors.text.tertiary} hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {board.description && (
                        <p className={`${colors.text.secondary} text-sm mb-4 line-clamp-2`}>
                          {board.description}
                        </p>
                      )}

                      <div className={`flex items-center justify-between text-sm ${colors.text.tertiary} ${viewMode === "list" ? "flex-wrap gap-2" : ""}`}>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{formatDate(board.lastModified)}</span>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          {board.collaborators?.length > 0 && (
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              <span>{board.collaborators.length}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${board.isActive ? 'bg-green-500' : colors.bg.tertiary}`}></div>
                            <span className="text-xs">{board.isActive ? 'Active' : 'Saved'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>

      {/* Create Board Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className={`${colors.bg.modal} rounded-2xl ${shadows.modal} max-w-md w-full border ${colors.border.primary}`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <form onSubmit={handleCreateBoard} className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-2xl font-bold ${colors.text.primary} bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent`}>
                    Create New Board
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className={`p-2 ${colors.text.tertiary} hover:${colors.text.primary} hover:${colors.bg.tertiary} rounded-xl transition-all`}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className={`block text-sm font-semibold ${colors.text.primary} mb-2`}>
                      Board Title
                    </label>
                    <input
                      type="text"
                      value={newBoardData.title}
                      onChange={(e) => setNewBoardData({ ...newBoardData, title: e.target.value })}
                      className={`w-full ${colors.bg.input} ${colors.text.primary} border ${colors.border.primary} rounded-xl p-4 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all`}
                      placeholder="Enter a creative title..."
                      required
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold ${colors.text.primary} mb-2`}>
                      Description (Optional)
                    </label>
                    <textarea
                      value={newBoardData.description}
                      onChange={(e) => setNewBoardData({ ...newBoardData, description: e.target.value })}
                      className={`w-full ${colors.bg.input} ${colors.text.primary} border ${colors.border.primary} rounded-xl p-4 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none`}
                      placeholder="Describe your board's purpose..."
                      rows={3}
                    />
                  </div>

                  <div className={`p-4 ${colors.bg.secondary} rounded-xl border ${colors.border.primary}`}>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newBoardData.isPublic}
                        onChange={(e) => setNewBoardData({ ...newBoardData, isPublic: e.target.checked })}
                        className="w-5 h-5 text-blue-600 bg-transparent border-2 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2 transition-all"
                      />
                      <div className="ml-3">
                        <span className={`text-sm font-semibold ${colors.text.primary}`}>
                          Public Board
                        </span>
                        <p className={`text-xs ${colors.text.secondary} mt-1`}>
                          Anyone with the link can view and collaborate
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className={`flex-1 px-6 py-3 ${colors.bg.secondary} ${colors.text.primary} border ${colors.border.primary} rounded-xl font-semibold hover:${colors.bg.tertiary} transition-all`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingBoard || !newBoardData.title.trim()}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg"
                  >
                    {creatingBoard ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creating...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Board
                      </div>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
