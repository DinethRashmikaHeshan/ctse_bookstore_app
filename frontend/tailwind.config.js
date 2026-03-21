/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#1a1a2e', 50: '#f0f0f8', 100: '#d0d0e8', 500: '#1a1a2e', 600: '#16162a', 700: '#0d0d1a' },
        accent:  { DEFAULT: '#e94560', 50: '#fef0f3', 100: '#fdd6de', 500: '#e94560', 600: '#d63a54' },
        surface: { DEFAULT: '#16213e', card: '#0f3460' },
      },
      fontFamily: {
        display: ['Georgia', 'Cambria', 'serif'],
        body:    ['system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
