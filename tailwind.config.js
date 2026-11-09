/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: '#FAF6EE',
        paper: '#FFFFFF',
        ink: {
          DEFAULT: '#23272A',
          soft: '#4A5054',
          faint: '#7A8287',
        },
        line: '#E5DECF',
        forest: {
          DEFAULT: '#1E4636',
          deep: '#143327',
          mist: '#E4ECE6',
        },
        gold: {
          DEFAULT: '#C2A878',
          soft: '#EDE3D0',
          deep: '#8A6F3E',
        },
        rust: {
          DEFAULT: '#A4472F',
          mist: '#F3E2DC',
        },
        stone2: '#E8E4D8',
      },
      fontFamily: {
        serif: ['"Source Serif 4"', 'Georgia', '"Times New Roman"', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
