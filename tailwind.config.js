/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        olive: {
          50:  '#f4f6ed',
          100: '#e6ebd6',
          200: '#cdd8b0',
          300: '#aebe83',
          400: '#8fa45c',
          500: '#6b7a3f',
          600: '#556230',
          700: '#424c26',
          800: '#313820',
          900: '#222618',
        },
        mulberry: {
          50:  '#faf0f7',
          100: '#f4dded',
          200: '#e9bbdb',
          300: '#d98cbf',
          400: '#c45d9f',
          500: '#a03878',
          600: '#7b2d5c',
          700: '#612447',
          800: '#481a34',
          900: '#301123',
        },
        raspberry: {
          50:  '#fdf0f3',
          100: '#f9dde3',
          200: '#f3bac7',
          300: '#e98aa0',
          400: '#d95572',
          500: '#b5294e',
          600: '#93203e',
          700: '#721831',
          800: '#541226',
          900: '#380c1a',
        },
        cream: '#F7F3EC',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans:  ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'garden-gradient': 'linear-gradient(135deg, #f4f6ed 0%, #faf0f7 50%, #fdf0f3 100%)',
      },
    },
  },
  plugins: [],
};
