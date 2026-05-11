import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#C4614A',
          dark: '#9E3D2A',
          light: '#E8927A',
        },
        cream: '#FDF7F2',
        rose: {
          50: '#FFF5F0',
          100: '#FFE8DC',
          200: '#F5D0C0',
          300: '#E8A88E',
        },
        brown: {
          dark: '#2D1B12',
          mid: '#8B5E52',
          light: '#B89080',
        },
        amber: {
          400: '#D4A853',
          500: '#C49030',
          600: '#A87020',
        },
      },
      boxShadow: {
        card: '0 2px 12px rgba(45, 27, 18, 0.08)',
        up: '0 -2px 12px rgba(45, 27, 18, 0.06)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};

export default config;
