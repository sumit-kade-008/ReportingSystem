/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      colors: {
        accent: {
          DEFAULT: '#1d4ed8',
          hover: '#1e40af',
          light: '#eff6ff',
          muted: '#dbeafe',
        },
        surface: {
          DEFAULT: '#f5f6f8',
          white: '#ffffff',
          subtle: '#eef1f4',
        },
        ink: {
          DEFAULT: '#1f2933',
          muted: '#52606d',
          subtle: '#7b8794',
        },
        line: {
          DEFAULT: '#d9dee4',
          subtle: '#e4e7eb',
          dark: '#9aa5b1',
        },
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
      borderRadius: {
        DEFAULT: '6px',
        sm: '4px',
        md: '6px',
        lg: '6px',
        xl: '6px',
        '2xl': '6px',
        '3xl': '6px',
      },
      boxShadow: {
        subtle: '0 2px 8px rgba(0, 0, 0, 0.06)',
        dropdown: '0 4px 12px rgba(0, 0, 0, 0.08)',
        modal: '0 8px 24px rgba(0, 0, 0, 0.12)',
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        6: '24px',
        8: '32px',
      },
    },
  },
  plugins: [],
}
