/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Miro-inspired color palette
        miro: {
          primary: '#050038',
          blue: '#4C63D2',
          yellow: '#FFF100',
          purple: '#9B59B6',
          green: '#2ECC71',
          orange: '#FF6B35',
          pink: '#E74C3C',
        }
      },
      backgroundImage: {
        'grid-pattern': `
          linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)
        `,
      },
      backgroundSize: {
        'grid': '20px 20px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-in': 'bounceIn 0.6s ease-out',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      boxShadow: {
        'miro': '0 8px 32px rgba(0, 0, 0, 0.12)',
        'miro-dark': '0 8px 32px rgba(0, 0, 0, 0.6)',
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    function({ addUtilities }) {
      const newUtilities = {
        '.bg-grid-pattern': {
          backgroundImage: `
            linear-gradient(to right, rgba(156, 163, 175, 0.2) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(156, 163, 175, 0.2) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        },
        '.dark .bg-grid-pattern': {
          backgroundImage: `
            linear-gradient(to right, rgba(75, 85, 99, 0.3) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(75, 85, 99, 0.3) 1px, transparent 1px)
          `,
        },
        '.line-clamp-2': {
          overflow: 'hidden',
          display: '-webkit-box',
          '-webkit-box-orient': 'vertical',
          '-webkit-line-clamp': '2',
        },
        '.line-clamp-3': {
          overflow: 'hidden',
          display: '-webkit-box',
          '-webkit-box-orient': 'vertical',
          '-webkit-line-clamp': '3',
        },
      }
      addUtilities(newUtilities)
    }
  ],
}
