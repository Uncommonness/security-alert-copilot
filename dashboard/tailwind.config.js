/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // Dark mode is no longer used; keep 'class' to avoid breaking variants but we will never add the class
  darkMode: 'class',
  theme: {
    extend: {
      fontSize: {
        xs: ['var(--font-size-xs)', '1.5'],
        sm: ['var(--font-size-sm)', '1.5'],
        base: ['var(--font-size-base)', '1.5'],
        lg: ['18px', '1.5'],
        xl: ['20px', '1.4'],
      },
      fontFamily: {
        sans: ['Inter var', 'sans-serif'],
      },
      colors: {
        // Updated palette inspired by the reference UI (clean, light, Microsoft-like neutrals)
        primary: {
          DEFAULT: '#2563eb', // blue-600
          hover: '#1d4ed8', // blue-700
          light: '#3b82f6', // blue-500
        },
        sidebar: {
          bg: '#f8fafc', // slate-50
          hover: '#eef2ff', // indigo-50
        },
        surface: {
          light: '#ffffff',
        }
      },
      spacing: {
        navbar: '56px',
      },
      transitionProperty: {
        'width': 'width',
        'spacing': 'margin, padding',
      },
      gridTemplateColumns: {
        '14': 'repeat(14, minmax(0, 1fr))',
      },
      animation: {
        'float-up': 'float-up 2s ease-out infinite',
        'gradient-spin': 'gradient-spin 2s linear infinite',
      }
    },
  },
  plugins: [],
}; 