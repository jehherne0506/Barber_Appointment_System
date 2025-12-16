/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        yellow: {
          150: "#F8F3E9"
        }
      },
      fontFamily: {
        sans: ['Almendra', 'sans-serif'],
        roboto: ['"Roboto Mono"', 'sans-serif'],
        bartle: ['"BBH Bartle"', "sans-serif"],
        robotoCondensed: ['"Roboto Condensed"', "sans-serif"],
        dela: ['"Dela Gothic One"', "sans-serif"],
        geom: ['Geom']
      },
      keyframes: {
        caroussel: {
          '0%, 15%': {transform: "translateX(0)"},
          '20%, 35%': {transform: "translateX(-16.66%)"},
          '40%, 55%': {transform: "translateX(-33.33%)"},
          '60%, 75%': {transform: "translateX(-50%)"},
          '80%, 95%': {transform: "translateX(-66.66%)"},
          '100%': {transform: "translateX(-83.33%)"},
        },
        fadeInSlide: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'caroussel': 'caroussel 20s linear infinite',
        'fadeInSlide': 'fadeInSlide 1s ease-out forwards',
      }
    },
  },
  plugins: [],
}

