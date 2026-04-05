/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Pipitos
        black:   '#292421',
        copper:  '#A75F37',
        pink:    '#CA8E82',
        tan:     '#D9B99F',
        blush:   '#F2D6CE',
        vanilla: '#F2E7DD',
        sage:    '#7A958F',
        mint:    '#BAE0DA',
      },
      fontFamily: {
        sans: ['Georgia', 'serif'],
      }
    },
  },
  plugins: [],
}
