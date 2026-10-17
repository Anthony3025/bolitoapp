/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
            DEFAULT: '#0066cc', // Azul Primario
            dark: '#004c99',
        },
        tech: {
            dark: '#0b0e38', // Degradado dark start
            bg: '#0a0d2e',   // Cajero BG
            card: '#111827',
        },
        success: '#00D68F', // Verde Vibrante
        surface: '#f5f7fa', // Usuario BG
        panic: '#ef4444',   // Rojo advertencias
      }
    },
  },
  plugins: [],
}
