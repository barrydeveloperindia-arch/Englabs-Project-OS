/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          50: '#e6fcf4',
          100: '#ccfaea',
          200: '#99f5d5',
          300: '#66f0c0',
          400: '#33ebaa',
          500: '#52cca3', // EngLabs Logo Primary Teal
          600: '#00b77a',
          700: '#00895c',
          800: '#005c3d',
          900: '#002e1f',
          950: '#00170f',
        },
        slate: {
          50: '#f0f6fa',
          100: '#e1edf4',
          200: '#c3dae9',
          300: '#a5c8de',
          400: '#87b5d3',
          500: '#68a3c8',
          600: '#4a91bd',
          700: '#2b7ea2',
          800: '#1b6183',
          850: '#155273',
          900: '#0e4368', // EngLabs Logo Navy
          950: '#092a42',
        }
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
