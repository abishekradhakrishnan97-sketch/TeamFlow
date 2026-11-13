/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F7F3E9',
        surface: '#FFFDF7',
        'surface-muted': '#EEE9DD',
        sidebar: '#171717',
        primary: '#222222',
        secondary: '#77746D',
        border: '#000000',
        // Pastel Semantic Tokens
        pastel: {
          pink: '#EFAED0',
          yellow: '#F2D76B',
          green: '#A9BB78',
          blue: '#AFC7E9',
        },
        // Functional semantics aligned with palette
        accent: '#6258E8',
        success: '#5F8745',
        warning: '#C68B1A',
        danger: '#C84C4C',
      },
      borderColor: {
        DEFAULT: '#000000',
      },
      borderWidth: {
        DEFAULT: '0.5px',
        '0.5': '0.5px',
        '1': '1px',
        '2': '2px',
        '4': '4px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(34, 34, 34, 0.04)',
        'soft-md': '0 4px 20px rgba(34, 34, 34, 0.06)',
      },
    },
  },
  plugins: [],
}
