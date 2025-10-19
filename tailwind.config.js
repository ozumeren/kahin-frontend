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
          900: '#1D1D1F',  // Ana arka plan
          800: '#1D1D1F',  // Card arka plan
          700: '#2a2a2c',  // Hover state (biraz açık)
          600: '#555555',  // Border ve input
        },
        text: {
          primary: '#EEFFDD',   // Ana yazı rengi
          secondary: '#EEFFDD', // İkincil yazı (biraz soluk)
        },
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',  // Ana yeşil
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        yes: {
          light: '#dcfce7',
          DEFAULT: '#22c55e',
          dark: '#16a34a',
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
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}