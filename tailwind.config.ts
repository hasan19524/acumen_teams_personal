import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class", // FIX: Changed from ["class"] to "class"
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}", // ADDED: Scans our new decomposed components
  ],
  theme: {
    extend: {
      colors: {
        acumen: {
          primary: "#2563eb",
          dark: "#0f172a",
          light: "#f8fafc",
          muted: "#64748b",
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
