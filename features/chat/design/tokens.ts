// features/chat/design/tokens.ts

export const T = {
  // Background Layers
  bgApp: "var(--bg)",
  bgSidebar: "var(--sidebar)",
  bgSecondary: "var(--bg-secondary)",

  // Surfaces
  surface: "var(--surface)",
  surfaceHover: "var(--surface-hover)",

  // Brand Colors
  primary: "var(--primary)",
  accent: "var(--brand)",
  accentHover: "var(--brand-hover)",
  accentMuted: "color-mix(in srgb, var(--brand) 15%, transparent)",
  accentSubtle: "color-mix(in srgb, var(--brand) 8%, transparent)",

  info: "var(--info)",
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--danger)",
  dangerHover: "var(--danger-hover)",
  indigo: "var(--indigo)",
  teal: "var(--teal)",
  disabled: "var(--border-hover)",

  // Text System
  textPrimary: "var(--text-primary)",
  textSecondary: "var(--text-secondary)",
  textMuted: "var(--text-muted)",
  textFaint: "var(--text-muted)",

  // Borders
  border: "var(--border)",
  borderHover: "var(--border-hover)",
  borderFocus: "var(--brand)",

  // Chat Specific
  bgBubbleMine: "var(--bubble-mine)",
  bgBubbleOther: "var(--bubble-other)",
  bgHover: "var(--surface-hover)",
  bgHoverStrong: "var(--surface-hover)",
  bgInputField: "var(--bg-secondary)",
  bgModal: "var(--surface)",
  bgOverlay: "var(--overlay)",
  bgMenu: "var(--menu)",

  // Radius (12px for buttons/inputs, 16px for cards)
  radiusXs: "6px",
  radiusSm: "12px",
  radiusMd: "12px",
  radiusLg: "16px",

  // Spacing (8px grid)
  gapXs: "4px",
  gapSm: "8px",
  gapMd: "16px",
  gapLg: "24px",

  // Typography
  fontSizeXs: "11px",
  fontSizeSm: "13px",
  fontSizeBase: "14px",
  fontSizeLg: "16px",

  // Layout constraints
  chatMaxWidth: "800px",
  sidebarWidth: "320px",
  bubbleMaxWidth: "70%",
  mediaGridMax: "400px",
  imageHeight: "200px",
};
