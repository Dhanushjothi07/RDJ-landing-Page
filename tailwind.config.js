/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#222222",
        secondary: "#7B7B7B",
        tertiary: "#F8F8F8",
        white: "#FFFFFF",
        dark: "#1A1A1A", // slightly darker than primary for background
        surface: "#2A2A2A", // slightly lighter than primary for cards
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(to right, #ffffff02 1px, transparent 1px), linear-gradient(to bottom, #ffffff02 1px, transparent 1px)",
      },
      animation: {
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    },
  },
  plugins: [],
}
