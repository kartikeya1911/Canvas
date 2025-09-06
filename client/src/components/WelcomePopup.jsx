import React from "react";

const WelcomePopup = ({ onStart, onSignup, onLogin }) => (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
    <div className="bg-white rounded-2xl p-8 shadow-xl flex flex-col items-center animate-fade-in max-w-md mx-4">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </div>
      
      <h1 className="text-3xl font-bold mb-2 text-blue-700 text-center">Welcome to ColabCanvas</h1>
      <p className="text-gray-600 text-center mb-6">
        The collaborative whiteboard that brings your team together
      </p>
      
      <div className="flex flex-col gap-3 w-full">
        <button
          onClick={onStart}
          className="px-6 py-3 w-full bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Try Free Board
        </button>
        
        <button
          onClick={onSignup}
          className="px-6 py-3 w-full border border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
        >
          Create Free Account
        </button>
        
        {onLogin && (
          <button
            onClick={onLogin}
            className="px-6 py-3 w-full text-gray-600 hover:text-gray-800 font-medium transition"
          >
            Already have an account? Sign in
          </button>
        )}
      </div>
      
      <p className="text-xs text-gray-500 mt-6 text-center">
        By using ColabCanvas you agree to our{" "}
        <a href="#" className="underline text-blue-600">Terms & Conditions</a> and{" "}
        <a href="#" className="underline text-blue-600">Privacy Policy</a>.
      </p>
    </div>
  </div>
);

export default WelcomePopup;
