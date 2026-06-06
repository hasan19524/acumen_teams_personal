// features/chat/design/tokens.ts

export const T = {
  // Surfaces
  bgApp: "#0a0b10",
  bgSidebar: "#10111a",
  bgHeader: "#0f1019",
  bgInput: "#0f1019",
  bgBubbleMine: "#2e3a52",
  bgBubbleOther: "#161825",
  bgHover: "rgba(255,255,255,0.03)",
  bgHoverStrong: "rgba(255,255,255,0.06)",
  bgMenu: "#1a1c2a",
  bgModal: "#161825",
  bgInputField: "#1a1c2a",
  bgOverlay: "rgba(0,0,0,0.55)",

  // Accent
  accent: "#6366f1",
  accentHover: "#818cf8",
  accentMuted: "rgba(99,102,241,0.12)",
  accentSubtle: "rgba(99,102,241,0.06)",
  danger: "#ef4444",
  dangerHover: "rgba(239,68,68,0.1)",
  success: "#22c55e",

  // Text
  textPrimary: "#e4e5eb",
  textSecondary: "#8b8d9a",
  textMuted: "#5c5e6e",
  textFaint: "#7c8296",
  textMeta: "rgba(255,255,255,0.32)",

  // Borders
  border: "rgba(255,255,255,0.06)",
  borderSubtle: "rgba(255,255,255,0.04)",
  borderHover: "rgba(255,255,255,0.1)",
  borderFocus: "rgba(99,102,241,0.5)",

  // Spacing
  gapXs: 4,
  gapSm: 8,
  gapMd: 12,
  gapLg: 16,
  gapXl: 20,

  // Radii
  radiusXs: 4,
  radiusSm: 6,
  radiusMd: 10,
  radiusLg: 14,
  radiusXl: 18,

  // Typography
  fontSizeXs: 10,
  fontSizeSm: 12,
  fontSizeBase: 14,
  fontSizeMd: 15,

  // Layout
  chatMaxWidth: 860,
  bubbleMaxWidth: 440,
  mediaGridMax: 280,
  imageHeight: 110,
  sidebarWidth: 280,
} as const;
