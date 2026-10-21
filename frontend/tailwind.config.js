/** RepoPilot design system — "Material Expressive engineering studio".
 *  Tokens are CSS variables (see app/globals.css) so light and dark share
 *  one class vocabulary. See ~/workspace/repopilot-app/DESIGN.md. */
const v = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: v("paper"),
        paper: v("paper"),
        surface: v("surface"),
        elevated: v("elevated"),
        hover: v("hover"),
        primary: v("ink"),
        ink: v("ink"),
        secondary: v("ink-2"),
        muted: v("ink-3"),
        border: v("border"),
        accent: v("accent"),
        accentHover: v("accent-hover"),
        accentContainer: v("accent-container"),
        onAccent: v("on-accent"),
        success: v("success"),
        warning: v("warning"),
        danger: v("danger"),
        info: v("info"),
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        card: "24px",
        panel: "28px",
        hero: "36px",
      },
      boxShadow: {
        soft: "0 1px 2px rgb(25 28 30 / 0.05), 0 8px 24px -12px rgb(25 28 30 / 0.12)",
        float: "0 2px 4px rgb(25 28 30 / 0.06), 0 20px 44px -16px rgb(25 28 30 / 0.20)",
        pop: "0 12px 32px -8px rgb(25 28 30 / 0.22)",
      },
      transitionDuration: { 120: "120ms", 160: "160ms", 200: "200ms", 240: "240ms", 300: "300ms", 400: "400ms" },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.22, 1, 0.36, 1)",
        expressive: "cubic-bezier(0.2, 0, 0, 1)",
      },
    },
  },
  plugins: [],
};
