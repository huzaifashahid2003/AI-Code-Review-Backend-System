/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        gray: {
          950: '#0a0a0f',
          900: '#111117',
          850: '#16161e',
          800: '#1c1c26',
          750: '#22222e',
          700: '#2a2a38',
          600: '#3a3a4e',
          500: '#5a5a72',
          400: '#8888a8',
          300: '#aaaacc',
          200: '#ccccdd',
          100: '#eeeeee',
        }
      }
    },
  },
  plugins: [],
}
