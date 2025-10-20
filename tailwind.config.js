/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Özel tema renkleri
        dark: {
          900: '#111111',  // Ana arka plan
          800: '#111111',  // Card arka plan
          700: '#2a2a2c',  // Hover state (biraz açık)
          600: '#555555',  // Border ve input
        },
        text: {
          primary: '#EEFFDD',   // Ana yazı rengi
          secondary: '#EEFFDD', // İkincil yazı (biraz soluk)
        },
        brand: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#ccff33',  // Ana sarı-yeşil
          600: '#b8e62e',
          700: '#a3cc29',
          800: '#8fb324',
          900: '#7a991f',
        },
        yes: {
          light: '#fef9c3',
          DEFAULT: '#ccff33',
          dark: '#b8e62e',
        },
        no: {
          light: '#fee2e2',
          DEFAULT: '#ef4444',
          dark: '#dc2626',
        },
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      fontFamily: {
        sans: ['Geist', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}