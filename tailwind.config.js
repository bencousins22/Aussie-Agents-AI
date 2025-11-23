/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./App.tsx",
    "./index.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./types.{ts,tsx}",
    "./constants.{ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        'xs': '480px',
        '2xl': '1440px',
        '3xl': '1680px'
      },
      colors: {
        os: {
          bg: {
            primary: '#14161b',     // Deep Space Grey - main background
            secondary: '#1c1f24',   // Panel Grey - elevated surfaces
            tertiary: '#0f1216',    // Darker variant - overlays
            elevated: '#22272e',    // Hover states
            input: '#1c2128',       // Input fields
          },
          border: {
            subtle: '#2a2e36',      // Default borders
            DEFAULT: 'rgba(255,255,255,0.05)',  // Very subtle
            strong: 'rgba(255,255,255,0.1)',    // Emphasized
          },
          text: {
            primary: '#e6edf3',     // Main text
            secondary: '#8b949e',   // Dimmed text
            tertiary: '#6e7681',    // Muted text
            inverse: '#0f1216',     // Dark text on light backgrounds
          },
          // Legacy support (will map to nested values)
          bg: '#14161b',
          panel: '#1c1f24',
          border: '#2a2e36',
          active: '#252930',
          text: '#e6edf3',
          textDim: '#8b949e'
        },
        aussie: {
          300: '#66ffcc',
          400: '#33ffb3',
          500: '#00e599',  // Primary Vave Mint
          600: '#00c280',  // Hover Mint
          700: '#00a06b',
          800: '#007d56',
          900: '#003322',
        }
      },
      spacing: {
        'header': '3rem',      // 48px - standard header height
        'nav': '3.5rem',       // 56px - optimized nav width
        'nav-mobile': '4.375rem', // 70px - mobile nav height
        'panel': '22rem',      // 352px - chat panel width
        'panel-wide': '28rem', // 448px - wide panel
        'safe': 'env(safe-area-inset-bottom, 1.25rem)', // Safe area for mobile
      },
      zIndex: {
        'base': '0',
        'nav': '10',
        'header': '20',
        'dropdown': '30',
        'sidebar': '40',
        'modal': '50',
        'notification': '60',
        'tooltip': '70',
      },
      borderRadius: {
        'sm': '0.375rem',   // 6px
        'DEFAULT': '0.5rem', // 8px
        'md': '0.5rem',     // 8px
        'lg': '0.75rem',    // 12px
        'xl': '1rem',       // 16px
        '2xl': '1.25rem',   // 20px
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],      // 12px
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
        'base': ['1rem', { lineHeight: '1.5rem' }],     // 16px
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],      // 24px
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.25)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px -1px rgba(0, 0, 0, 0.3)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.3)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.3)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
        'glow': '0 0 20px rgba(0, 229, 153, 0.3)',
        'glow-lg': '0 0 30px rgba(0, 229, 153, 0.4)',
      },
      animation: {
        'subtle-pulse': 'subtle-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slide-in 0.2s ease-out',
        'fade-in': 'fade-in 0.15s ease-out',
        'scale-in': 'scale-in 0.15s ease-out',
      },
      keyframes: {
        'subtle-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'slide-in': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      transitionDuration: {
        '50': '50ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '250': '250ms',
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    }
  },
  plugins: [],
}
