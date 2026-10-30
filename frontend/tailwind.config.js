/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0D1A4A',
          800: '#13235B',
          600: '#2B3C7A',
        },
        amber: {
          500: '#F5A623',
          600: '#DE9217',
        },
        slate: {
          400: '#8D9AC0',
        },
        surface: '#FFFFFF',
        bg: '#F3F5FA',
        border: '#D5DAE6',
        text: '#13235B',
        'text-muted': '#5B6480',
        success: '#1E9E5A',
        danger: '#C62828',
      },
      fontFamily: {
        display: ['Archivo', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'Menlo', 'Consolas', 'monospace'],
        sans: ['Archivo', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        none: '0px',
        sm: '0px',
        DEFAULT: '0px',
        md: '0px',
        lg: '0px',
        xl: '0px',
        '2xl': '0px',
        '3xl': '0px',
        full: '0px',
      },
    },
  },
  plugins: [],
};
