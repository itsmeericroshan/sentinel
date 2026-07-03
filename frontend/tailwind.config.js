export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#CC0000",
        "primary-dark": "#990000",
        "primary-light": "#FF3333",
        accent: "#1A1A1A",
        surface: "#FFFFFF",
        "surface-2": "#F8F8F8",
        "surface-3": "#F0F0F0",
        border: "#E0E0E0",
        "border-dark": "#CCCCCC",
        muted: "#666666",
        safe: "#16A34A",
        warn: "#D97706",
        danger: "#CC0000",
      },
      fontFamily: {
        display: ["'Bebas Neue'", "sans-serif"],
        heading: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
    },
  },
  plugins: [],
}
