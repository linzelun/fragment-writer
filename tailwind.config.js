/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#FBF9F6',
          100: '#F5F1EB',
          200: '#EBE4D8',
          300: '#D9CFBD',
          400: '#B8A890',
          500: '#9A8A72',
          600: '#7A6B55',
          700: '#5E5242',
          800: '#3D352B',
          900: '#1E1C18',
          950: '#12110E',
        },
        amber: {
          50: '#FEFBF3',
          100: '#FDF5E0',
          200: '#FBE9B8',
          300: '#F7D67A',
          400: '#F0BC3E',
          500: '#D4951A',
          600: '#B07714',
          700: '#8C5C14',
          800: '#6F4816',
          900: '#593B16',
        },
        accent: {
          DEFAULT: '#B07714',
          light: '#F7D67A',
          bg: '#FEFBF3',
        },
      },
      fontFamily: {
        sans: ['"PingFang SC"', '"Noto Sans SC"', '"Hiragino Sans GB"', 'system-ui', 'sans-serif'],
        serif: ['"Noto Serif SC"', '"Source Han Serif SC"', '"Songti SC"', 'Georgia', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease both',
        'fade-up': 'fadeUp 0.5s ease both',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.22, 1.2, 0.36, 1) both',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(100%)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
