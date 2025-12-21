// Import React Router components for navigation between pages
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Import Context Providers for global state management
import { AuthProvider } from "./contexts/AuthContext";     // Manages user authentication state
import { ThemeProvider } from "./contexts/ThemeContext";   // Manages dark/light theme

// Import components and pages
import PrivateRoute from "./components/PrivateRoute";  // Protects routes requiring authentication
import Home from "./pages/Home";                       // Landing page
import Board from "./pages/Board";                     // Collaborative whiteboard page
import Login from "./pages/Login";                     // Login page
import Signup from "./pages/Signup";                   // Registration page
import Dashboard from "./pages/Dashboard";             // User dashboard showing all boards
import Profile from "./pages/Profile";                 // User profile settings
import BoardInvite from "./pages/BoardInvite";        // Page for joining boards via invite link

/**
 * Main App Component
 * This is the root component that sets up routing and global providers
 * 
 * Architecture:
 * - ThemeProvider: Wraps everything to provide theme context (dark/light mode)
 * - AuthProvider: Wraps everything to provide authentication context
 * - BrowserRouter: Enables client-side routing
 * - Routes: Defines all application routes
 */
function App() {
  return (
    // ThemeProvider: Makes theme state available to all child components
    <ThemeProvider>
      {/* AuthProvider: Makes user authentication state available to all child components */}
      <AuthProvider>
        {/* BrowserRouter: Enables navigation without page refresh (SPA behavior) */}
        <BrowserRouter>
          {/* Main container with responsive dark mode support */}
          <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
            {/* Routes: Define URL paths and their corresponding components */}
            <Routes>
              {/* PUBLIC ROUTES - Accessible without authentication */}
              
              {/* Home/Landing page - Shows app introduction and features */}
              <Route path="/" element={<Home />} />
              
              {/* Login page - User login form */}
              <Route path="/login" element={<Login />} />
              
              {/* Signup page - New user registration form */}
              <Route path="/signup" element={<Signup />} />
              
              {/* Board invite page - Join a board using invite link */}
              <Route path="/invite/:boardId" element={<BoardInvite />} />
              
              {/* PROTECTED ROUTES - Require authentication (user must be logged in) */}
              
              {/* Dashboard - Shows all boards user has access to */}
              <Route 
                path="/dashboard" 
                element={
                  <PrivateRoute> {/* Wrapper that redirects to login if not authenticated */}
                    <Dashboard />
                  </PrivateRoute>
                } 
              />
              
              {/* Profile - User profile settings and account management */}
              <Route 
                path="/profile" 
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                } 
              />
              
              {/* Board - Collaborative whiteboard canvas */}
              {/* Optional parameter :boardId? allows creating new board or opening existing */}
              <Route 
                path="/board/:boardId?" 
                element={
                  <PrivateRoute>
                    <Board />
                  </PrivateRoute>
                } 
              />
            </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

// Export App component as default export
export default App;
