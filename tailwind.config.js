/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        os: {
          bg: '#14161b',     // Deep Space Grey
          panel: '#1c1f24',  // Panel Grey
          border: '#2a2e36', // Subtle Border
          active: '#252930',
          text: '#e6edf3',
          textDim: '#8b949e'
        },
        aussie: {
          400: '#33ffb3',
          500: '#00e599', // Vave Mint
          600: '#00c280', // Hover Mint
          900: '#003322',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'subtle-pulse': 'subtle-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'subtle-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        }
      }
    }
  },
  plugins: [],
}
