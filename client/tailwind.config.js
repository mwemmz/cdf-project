/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecf8f2',
          100: '#d3f0e2',
          200: '#a9e2c7',
          300: '#7bd3a8',
          400: '#3fb585',
          500: '#17a06a',
          600: '#0e8f5e',
          700: '#0b7a50',
          800: '#0a5f40',
          900: '#1c2a26',
          950: '#14181c',
        },
        copper: {
          50: '#fff8ec',
          100: '#fdeccd',
          200: '#fbd89b',
          300: '#f7c068',
          400: '#f4ae45',
          500: '#f2a33a',
          600: '#a85f0a',
          700: '#864a06',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Arial',
          'sans-serif',
        ],
        display: ['Sora', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(20 24 28 / 0.05), 0 6px 24px -8px rgb(20 24 28 / 0.10)',
        pop: '0 16px 48px -16px rgb(20 24 28 / 0.28)',
      },
    },
  },
  plugins: [],
};