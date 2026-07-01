/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6366F1',
        accent: '#3f83f8',
        text: '#333333',
        link: '#2563eb',
        background: '#ffffff',
        'light-gray': '#f0f0f0',
        gray: '#808080',
        'dark-gray': '#555',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      keyframes: {
        slideFromLeft: {
          '0%': { opacity: '0', transform: 'translateX(-100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        }
      },
      animation: {
        slideFromLeft: 'slideFromLeft 1s ease forwards',
      }
    },
  },
  plugins: [],
}
