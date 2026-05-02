import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
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