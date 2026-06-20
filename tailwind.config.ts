/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Background Layers
        background: "#081325",
        "background-secondary": "#101D35",
        // Surfaces
        surface: "#172440",
        "surface-secondary": "#20304E",
        // Sidebar
        sidebar: "#0D1B3D",
        "sidebar-hover": "#16284F",
        "sidebar-active": "#2A3D73",
        // Brand Colors
        primary: "#E31E24", // Red
        brand: "#4B1587", // Purple
        success: "#1FA463", // Green
        warning: "#F5B041", // Warning
        info: "#5DADE2", // Blue
        // Text System
        heading: "#FFFFFF",
        "text-primary": "#E8ECF6",
        "text-secondary": "#B7C0D8",
        "text-muted": "#7A86A7",
        // Borders
        border: "#2A3A5C",
        divider: "#24334F",
      },
      borderRadius: {
        button: "12px",
        input: "12px",
        card: "16px",
        modal: "20px",
      },
      boxShadow: {
        sm: "0 2px 8px rgba(0, 0, 0, 0.2)",
        md: "0 8px 20px rgba(0, 0, 0, 0.3)",
        lg: "0 16px 40px rgba(0, 0, 0, 0.4)",
      },
      transitionDuration: {
        DEFAULT: "200ms",
        dropdown: "180ms",
        modal: "250ms",
        sidebar: "220ms",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
