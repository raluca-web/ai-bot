/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#512feb',
          dark: '#3f24b8',
          light: '#6945f5',
        },
        accent: {
          DEFAULT: '#8cff2e',
          dark: '#75d625',
          light: '#a3ff5c',
        },
        dark: {
          DEFAULT: '#030303',
          lighter: '#1a1a1a',
          card: '#0f0f0f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
