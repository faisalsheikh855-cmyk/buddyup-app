/** @type {import("tailwindcss").Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        canvas: "#F7F8F5",
        ink: "#14251F",
        muted: "#64746D",
        brand: "#087F63",
        "brand-dark": "#05634C",
        "brand-soft": "#E2F4EC",
        coral: "#F05B4F",
        "coral-soft": "#FFEFEC",
        line: "#E4E8E4"
      },
      borderRadius: {
        app: "8px"
      }
    }
  },
  plugins: []
};
