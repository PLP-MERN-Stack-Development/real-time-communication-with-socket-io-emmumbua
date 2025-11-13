/* eslint-disable import/no-extraneous-dependencies */
import { type Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Poppins"', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        bean: {
          50: '#f8f4f1',
          100: '#f0e4db',
          200: '#e0c8b6',
          300: '#d0ac92',
          400: '#c19071',
          500: '#b07456',
          600: '#8d5b3f',
          700: '#6a432d',
          800: '#472a1c',
          900: '#25130d',
        },
      },
      boxShadow: {
        barista: '0 20px 45px -15px rgba(110, 74, 53, 0.35)',
      },
    },
  },
  plugins: [],
} satisfies Config;

