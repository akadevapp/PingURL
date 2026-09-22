import type { Config } from "tailwindcss";

// Design tokens for PingLink.
//
// Palette rationale: "ink" is a blue-black (not a neutral #0B0B0B) so it
// never reads as a generic dark-mode default; "seal" (deep teal) is the
// one interactive accent, standing in for a wax seal on a private letter —
// which is also why "wax" (a brick red, not a terracotta) is reserved for
// the single "message sent" moment rather than used decoratively.
// Typography deliberately uses system font stacks, not a fetched webfont:
// it keeps first paint instant, fitting a product whose whole pitch is
// "a lightweight utility, not another app to load."
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1B2430",
        paper: "#F4F5F1",
        seal: {
          DEFAULT: "#2F6F6B",
          dark: "#234F4C",
          light: "#E4EEEC",
        },
        wax: {
          DEFAULT: "#B8503A",
          light: "#F5E3DD",
        },
        slate: "#5B6472",
        line: "#DEDCD4",
      },
      fontFamily: {
        display: ["ui-serif", "Charter", "Georgia", "Cambria", "Times New Roman", "serif"],
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "ui-sans-serif",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      maxWidth: {
        prose: "40rem",
      },
    },
  },
  plugins: [],
};
export default config;
