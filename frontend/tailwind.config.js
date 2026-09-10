/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        notte: "rgb(var(--notte) / <alpha-value>)",
        "notte-2": "rgb(var(--notte-2) / <alpha-value>)",
        limone: "rgb(var(--limone) / <alpha-value>)",
        terracotta: "rgb(var(--terracotta) / <alpha-value>)",
        azzurro: "rgb(var(--azzurro) / <alpha-value>)",
        panna: "rgb(var(--panna) / <alpha-value>)",
        oliva: "rgb(var(--oliva) / <alpha-value>)",
        inchiostro: "rgb(var(--inchiostro) / <alpha-value>)",
      },
      fontFamily: {
        jost: ["Jost", "Work Sans", "Segoe UI", "sans-serif"],
        work: ["Work Sans", "Segoe UI", "sans-serif"],
        sans: ["Jost", "Work Sans", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        faro: "0 10px 30px -10px rgba(22, 50, 79, 0.35)",
      },
    },
  },
  plugins: [],
}