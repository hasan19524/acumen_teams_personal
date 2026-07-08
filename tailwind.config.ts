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
        background: "var(--bg)",
        "background-secondary": "var(--bg-secondary)",
        // Surfaces
        surface: "var(--surface)",
        "surface-secondary": "var(--surface-hover)",
        // Sidebar
        sidebar: "var(--sidebar)",
        "sidebar-hover": "var(--sidebar-hover)",
        "sidebar-active": "var(--sidebar-active)",
        // Brand Colors
        primary: "var(--primary)",
        brand: "var(--brand)",
        "brand-hover": "var(--brand-hover)",
        "brand-light": "var(--brand-light)",
        danger: "var(--danger)",
        "danger-hover": "var(--danger-hover)",
        success: "var(--success)",
        warning: "var(--warning)",
        info: "var(--info)",
        pink: "var(--pink)",
        indigo: "var(--indigo)",
        teal: "var(--teal)",
        glass: "var(--glass)",
        overlay: "var(--overlay)",
        menu: "var(--menu)",
        "bubble-mine": "var(--bubble-mine)",
        "bubble-other": "var(--bubble-other)",
        "tint-red": "var(--tint-red)",
        "tint-indigo": "var(--tint-indigo)",
        "tint-blue": "var(--tint-blue)",
        "tint-green": "var(--tint-green)",
        "tint-amber": "var(--tint-amber)",
        "tint-teal": "var(--tint-teal)",
        "tint-brand": "var(--tint-brand)",
        "tint-danger": "var(--tint-danger)",
        // Text System
        heading: "var(--heading)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        // Borders
        border: "var(--border)",
        "border-hover": "var(--border-hover)",
        divider: "var(--divider)",
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
