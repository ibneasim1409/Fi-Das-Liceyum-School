/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2E6F40',
        secondary: '#556b2f',
        background: '#e9e2d7',
      }
    },
  },
  plugins: [],
}

