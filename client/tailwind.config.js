/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef8f0',
          100: '#d7efdc',
          500: '#22a04a',
          600: '#1b8740',
          700: '#166e34',
          900: '#0f4a24',
        },
      },
    },
  },
  plugins: [],
};