// features/chat/design/tokens.ts

export const T = {
  // Background Layers
  bgApp: "#081325", // Main App Background
  bgSidebar: "#0D1B3D", // Sidebar Background
  bgSecondary: "#101D35", // Secondary Background (Topbar/Sections)

  // Surfaces
  surface: "#172440", // Cards, Modals, Inputs
  surfaceHover: "#20304E", // Hover states, Dropdowns

  // Brand Colors
  primary: "#E31E24", // Red (Actions, Badges, Active borders)
  accent: "#4B1587", // Purple (Primary buttons, Own bubbles)
  accentHover: "#3a1070", // Darker Purple
  accentMuted: "rgba(75, 21, 135, 0.15)", // Muted Purple background
  accentSubtle: "rgba(75, 21, 135, 0.1)",

  info: "#5DADE2", // Blue (Links, Focus rings)
  success: "#1FA463", // Green (Online, Success badges)
  warning: "#F5B041", // Warning, Unread
  danger: "#E31E24", // Danger (Delete)
  dangerHover: "#C7151A",

  // Text System
  textPrimary: "#E8ECF6",
  textSecondary: "#B7C0D8",
  textMuted: "#7A86A7",
  textFaint: "#475569",

  // Borders
  border: "#2A3A5C",
  borderHover: "#3A4d72",
  borderFocus: "#4B1587",

  // Chat Specific
  bgBubbleMine: "#4B1587", // Purple for own messages
  bgBubbleOther: "#172440", // Surface for other messages
  bgHover: "#20304E",
  bgHoverStrong: "#20304E",
  bgInputField: "#101D35",
  bgModal: "#172440",
  bgOverlay: "rgba(8, 19, 37, 0.8)",
  bgMenu: "#172440",

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
