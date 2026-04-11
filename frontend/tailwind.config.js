/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f0ff',
          100: '#e4e4fe',
          200: '#ccccfd',
          300: '#a9a7fb',
          400: '#8780f8',
          500: '#6b5ef4',
          600: '#5640e9',
          700: '#4a30d4',
          800: '#3d28ab',
          900: '#342587',
        },
        violet: {
          50:  '#f8f5ff',
          100: '#f0ebfe',
          200: '#e2d9fd',
          300: '#cab8fb',
          400: '#ad8ef8',
          500: '#9164f4',
          600: '#7c45ea',
          700: '#6a32d5',
          800: '#582aaf',
          900: '#48238e',
        },
        ink: {
          900: '#0f0e1a',
          800: '#1a1830',
          700: '#2d2b4e',
          600: '#403d6c',
          500: '#5c5888',
          400: '#7e7aa8',
          300: '#a5a2c4',
          200: '#cccae0',
          100: '#eceaf8',
          50:  '#f7f6fd',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-mesh': 'radial-gradient(at 40% 20%, hsla(252,100%,74%,0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(230,100%,76%,0.12) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(270,100%,70%,0.1) 0px, transparent 50%)',
        'gradient-brand': 'linear-gradient(135deg, #6b5ef4 0%, #9164f4 50%, #7c45ea 100%)',
        'gradient-card': 'linear-gradient(145deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))',
      },
      boxShadow: {
        'glass':      '0 8px 32px rgba(107,94,244,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        'glass-lg':   '0 20px 60px rgba(107,94,244,0.12), 0 4px 16px rgba(0,0,0,0.06)',
        'brand':      '0 8px 24px rgba(107,94,244,0.35)',
        'brand-lg':   '0 16px 48px rgba(107,94,244,0.4)',
        'card':       '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
        'card-hover': '0 8px 24px rgba(107,94,244,0.1), 0 2px 8px rgba(0,0,0,0.06)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.5rem',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'gradient-shift': 'gradientShift 8s ease infinite',
        'float':          'float 6s ease-in-out infinite',
        'pulse-soft':     'pulseSoft 3s ease-in-out infinite',
        'slide-up':       'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)',
        'fade-in':        'fadeIn 0.3s ease-out',
      },
      keyframes: {
        gradientShift: {
          '0%,100%': { backgroundPosition: '0% 50%' },
          '50%':     { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%':     { transform: 'translateY(-8px)' },
        },
        pulseSoft: {
          '0%,100%': { opacity: '1' },
          '50%':     { opacity: '0.7' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
