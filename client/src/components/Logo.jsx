import React from 'react';

const Logo = ({ size = "w-12 h-12", width, height, className = "" }) => {
  // If individual width and height are provided, use them; otherwise use size
  const logoSize = width && height ? `${width} ${height}` : size;
  
  return (
    <div className={`${logoSize} bg-white rounded-lg flex items-center justify-center ${className}`}>
      <img 
        src="/logo.png"
        alt="ColabCanvas Logo" 
        className="w-full h-full object-contain rounded-lg"
        onError={(e) => {
          // Fallback to text if image doesn't load
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'block';
        }}
      />
      <span className="hidden bg-blue-700 text-white font-bold text-lg rounded-lg w-full h-full flex items-center justify-center">
        CC
      </span>
    </div>
  );
};

export default Logo;
