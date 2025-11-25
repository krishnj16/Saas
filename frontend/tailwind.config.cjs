module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        accent: "var(--color-accent)",
        muted: "var(--color-muted)"
      },
      borderRadius: {
        lg: "12px"
      }
    }
  },
  plugins: []
};
