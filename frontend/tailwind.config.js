/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Mówi Tailwindowi, aby skanował wszystkie pliki w 'src'
  ],
  theme: {
    extend: {
      fontFamily: {
        // Ustawia 'Inter' jako domyślną czcionkę, zgodną z naszym designem
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}