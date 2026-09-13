/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eefaf4',
          100: '#d5f2e3',
          200: '#ade6cb',
          300: '#7bd2ae',
          400: '#49b98d',
          500: '#2b9e74',
          600: '#178158',
          700: '#126847',
          800: '#11523a',
          900: '#0e4330',
          950: '#07291e',
        },
        copper: {
          50: '#fbf6ee',
          100: '#f6e9d5',
          200: '#ecd1a8',
          300: '#e0b176',
          400: '#d28f4d',
          500: '#b87333',
          600: '#9a5b24',
          700: '#7c461f',
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
        card: '0 1px 2px 0 rgb(7 41 30 / 0.05), 0 6px 24px -8px rgb(7 41 30 / 0.10)',
        pop: '0 16px 48px -16px rgb(7 41 30 / 0.28)',
      },
    },
  },
  plugins: [],
};