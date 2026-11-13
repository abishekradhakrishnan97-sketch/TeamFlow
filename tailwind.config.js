/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F7F8FA',
        sidebar: '#FFFFFF',
        primary: '#17191F',
        secondary: '#737985',
        accent: '#6258E8',
        success: '#249B70',
        warning: '#D99B35',
        danger: '#D9534F',
        border: '#E8EAF0',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
