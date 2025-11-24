/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { graphite: '#1f2937', accent: '#facc15' }
    }
  },
  plugins: []
}
