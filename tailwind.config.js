/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'alfalah-dark': '#054736',
        'alfalah': '#075B45',
        'alfalah-light': '#087F5B',
        'alfalah-soft': '#EAF4F0',
        'alfalah-accent': '#D9B45B',
        'alfalah-gold': '#E5C158',
        'alfalah-goldLight': '#FBF5E6',
        emerald: {
          50: '#EAF4F0',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#087F5B',
          700: '#075B45',
          800: '#054736',
          900: '#033427',
          950: '#02231a',
        },
        gold: {
          300: '#F3E5AB',
          400: '#E5C158',
          500: '#D9B45B',
          600: '#C29D38',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
