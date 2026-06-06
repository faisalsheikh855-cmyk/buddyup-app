/** @type {import("tailwindcss").Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        canvas: "rgb(var(--color-canvas) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        brand: "rgb(var(--color-brand) / <alpha-value>)",
        "brand-dark": "rgb(var(--color-brand-dark) / <alpha-value>)",
        "brand-soft": "rgb(var(--color-brand-soft) / <alpha-value>)",
        coral: "rgb(var(--color-coral) / <alpha-value>)",
        "coral-soft": "rgb(var(--color-coral-soft) / <alpha-value>)",
        line: "rgb(var(--color-line) / <alpha-value>)"
      },
      borderRadius: {
        app: "8px"
      }
    }
  },
  plugins: []
};
