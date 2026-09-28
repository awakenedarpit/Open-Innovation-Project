import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        paper: "#f8fafc",
        brand: { 500: "#6366f1", 600: "#4f46e5" },
        root:  { 500: "#f59e0b", 600: "#d97706" },
        miss:  { 500: "#ef4444", 600: "#dc2626" },
        secure:{ 500: "#10b981", 600: "#059669" },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto"],
      },
    },
  },
  plugins: [],
};
export default config;
