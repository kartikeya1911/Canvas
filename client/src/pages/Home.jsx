import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import WelcomePopup from "../components/WelcomePopup";
import Navbar from "../components/Navbar";
import { motion } from "framer-motion";

const Home = () => {
  const [showPopup, setShowPopup] = useState(true);
  const { isAuthenticated } = useAuth();
  const { colors, shadows } = useTheme();
  const navigate = useNavigate();

  const handleStart = () => {
    setShowPopup(false);
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/board");
    }
  };

  const handleSignup = () => {
    setShowPopup(false);
    navigate("/signup");
  };

  const handleLogin = () => {
    setShowPopup(false);
    navigate("/login");
  };

  const features = [
    {
      title: "Real-time Collaboration",
      description: "Work together with your team in real-time. See changes as they happen, share ideas instantly.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      gradient: "from-blue-500 to-cyan-500",
      bgColor: "from-blue-50/80 to-cyan-50/80 dark:from-blue-900/20 dark:to-cyan-900/20"
    },
    {
      title: "Infinite Canvas",
      description: "Never run out of space. Our infinite canvas grows with your ideas and creativity.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      gradient: "from-green-500 to-emerald-500",
      bgColor: "from-green-50/80 to-emerald-50/80 dark:from-green-900/20 dark:to-emerald-900/20"
    },
    {
      title: "Powerful Tools",
      description: "Draw, write, create shapes, and add text with our comprehensive and intuitive toolkit.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
        </svg>
      ),
      gradient: "from-purple-500 to-pink-500",
      bgColor: "from-purple-50/80 to-pink-50/80 dark:from-purple-900/20 dark:to-pink-900/20"
    }
  ];

  return (
    <div className={`relative min-h-screen bg-gradient-to-br ${colors.bg.primary} ${colors.bg.secondary}`}>
      <Navbar />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-xl"
        />
        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-xl"
        />
      </div>
      
      {/* Hero Section */}
      <div className="pt-24 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center py-20"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.h1 
              className={`text-5xl md:text-7xl font-black ${colors.text.primary} mb-6`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Collaborate in{" "}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Real-Time
              </span>
            </motion.h1>
            <motion.p 
              className={`text-xl md:text-2xl ${colors.text.secondary} mb-12 max-w-4xl mx-auto leading-relaxed`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Create, share, and collaborate on infinite whiteboards with your team. 
              Draw, write, and brainstorm together from anywhere in the world.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-6 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              {isAuthenticated ? (
                <>
                  <motion.button
                    onClick={() => navigate("/dashboard")}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Go to Dashboard
                  </motion.button>
                  <motion.button
                    onClick={() => navigate("/board")}
                    className={`border-2 border-blue-600 ${colors.text.primary} px-10 py-5 rounded-2xl font-bold text-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all transform hover:scale-105`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Create New Board
                  </motion.button>
                </>
              ) : (
                <>
                  <motion.button
                    onClick={() => navigate("/signup")}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-xl"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    🚀 Get Started Free
                  </motion.button>
                  <motion.button
                    onClick={() => navigate("/board")}
                    className={`border-2 border-blue-600 bg-blue-600/10 backdrop-blur-sm ${colors.text.primary} px-10 py-5 rounded-2xl font-bold text-lg hover:bg-blue-600/20 transition-all transform hover:scale-105`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    ⚡ Try Without Account
                  </motion.button>
                </>
              )}
            </motion.div>
          </motion.div>

          {/* Features Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8 py-20"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className={`${colors.bg.card} backdrop-blur-xl bg-gradient-to-br ${feature.bgColor} rounded-3xl p-8 border ${colors.border.primary} ${shadows.card} text-center group hover:scale-105 transition-all duration-300`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.9 + index * 0.1 }}
                whileHover={{ y: -8 }}
              >
                <motion.div 
                  className={`w-20 h-20 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 text-white group-hover:scale-110 transition-transform duration-300`}
                  whileHover={{ rotate: 5 }}
                >
                  {feature.icon}
                </motion.div>
                <h3 className={`text-2xl font-bold ${colors.text.primary} mb-4`}>
                  {feature.title}
                </h3>
                <p className={`${colors.text.secondary} text-lg leading-relaxed`}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Section */}
          <motion.div 
            className={`text-center py-20 border-t ${colors.border.primary} backdrop-blur-sm`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            <h2 className={`text-4xl md:text-5xl font-bold ${colors.text.primary} mb-6`}>
              Ready to start{" "}
              <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                collaborating?
              </span>
            </h2>
            <p className={`text-xl ${colors.text.secondary} mb-12 max-w-2xl mx-auto`}>
              Join thousands of teams already using ColabCanvas to bring their ideas to life
            </p>
            {!isAuthenticated && (
              <motion.button
                onClick={() => navigate("/signup")}
                className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-12 py-6 rounded-2xl font-bold text-xl hover:from-green-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-xl"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                🎨 Create Free Account
              </motion.button>
            )}
          </motion.div>
        </div>
      </div>

      {/* Welcome Popup for first-time visitors */}
      {showPopup && !isAuthenticated && (
        <WelcomePopup
          onStart={handleStart}
          onSignup={handleSignup}
          onLogin={handleLogin}
        />
      )}
    </div>
  );
};

export default Home;
