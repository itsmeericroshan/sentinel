/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0E1113",
        panel: "#171B1E",
        panel2: "#1D2226",
        border: "#2A3034",
        text2: "#9CA0A4",
        text3: "#5E6469",
        amber: "#F2A623",
        danger: "#E2504A",
        safe: "#3FAE82",
        accent: "#4B8FD8",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
        sans: ["'IBM Plex Sans'", "sans-serif"],
      },
    },
  },
  plugins: [],
}
