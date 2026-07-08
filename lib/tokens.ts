export const tk = {
  // Background Layers
  bg: "var(--bg)",
  bgSecondary: "var(--bg-secondary)",

  // Surfaces
  surface: "var(--surface)",
  surfaceHover: "var(--surface-hover)",

  // Sidebar
  sidebar: "var(--sidebar)",
  sidebarHover: "var(--sidebar-hover)",
  sidebarActive: "var(--sidebar-active)",

  // Brand Colors
  primary: "var(--primary)",
  brand: "var(--brand)",
  brandHover: "var(--brand-hover)",
  brandLight: "var(--brand-light)",
  success: "var(--success)",
  warning: "var(--warning)",
  info: "var(--info)",

  // Text System
  heading: "var(--heading)",
  textPrimary: "var(--text-primary)",
  textSecondary: "var(--text-secondary)",
  textMuted: "var(--text-muted)",

  // Borders
  border: "var(--border)",
  borderHover: "var(--border-hover)",
  divider: "var(--divider)",

  // Radius
  radiusSm: "8px",
  radiusMd: "12px",
  radiusLg: "16px",
  radiusModal: "20px",

  // Status/Category accents
  danger: "var(--danger)",
  dangerHover: "var(--danger-hover)",
  pink: "var(--pink)",
  glass: "var(--glass)",
  overlay: "var(--overlay)",
  menu: "var(--menu)",
  bubbleMine: "var(--bubble-mine)",
  bubbleOther: "var(--bubble-other)",
  tintBrand: "var(--tint-brand)",
  tintDanger: "var(--tint-danger)",
  priorityUrgentFg: "var(--priority-urgent-fg)",
  priorityImportantFg: "var(--priority-important-fg)",

  // Brand-personality accents (from the logo's red + indigo wings) — used
  // for chips, avatars, and decorative surfaces, kept separate from
  // --brand which stays the functional CTA/button color.
  indigo: "var(--indigo)",
  teal: "var(--teal)",
  tintRed: "var(--tint-red)",
  tintIndigo: "var(--tint-indigo)",
  tintBlue: "var(--tint-blue)",
  tintGreen: "var(--tint-green)",
  tintAmber: "var(--tint-amber)",
  tintTeal: "var(--tint-teal)",

  // Legacy aliases (kept so older components referencing these names,
  // e.g. TaskUI.tsx, resolve to the same theme-aware colors instead of
  // silently rendering as undefined/black)
  text: "var(--text-primary)",
  textSec: "var(--text-secondary)",
  textTer: "var(--text-muted)",
  blue: "var(--info)",
  purple: "var(--brand)",
  green: "var(--success)",
  amber: "var(--warning)",
  red: "var(--danger)",
};
