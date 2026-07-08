// lib/accentPalette.ts
//
// A small curated rotation of the app's brand + status accents, used
// wherever we need to color something (team avatars, generic badges)
// without a designer having picked a color for it. Deriving the color
// from a stable hash of the name means the same team/person always gets
// the same color, but different teams don't all collapse into the same
// dark block the way a single hardcoded fallback color does.
//
// Each entry pairs a soft tint (for backgrounds) with its matching solid
// foreground (for text/icons) — the same "10%-opacity fill + solid text"
// idiom already used by components/ui/badge.tsx, so avatars read as part
// of the same design language instead of a one-off.

export const ACCENT_PALETTE = [
  { bg: "var(--tint-red)", fg: "var(--primary)" },
  { bg: "var(--tint-indigo)", fg: "var(--indigo)" },
  { bg: "var(--tint-blue)", fg: "var(--brand)" },
  { bg: "var(--tint-teal)", fg: "var(--teal)" },
  { bg: "var(--tint-green)", fg: "var(--success)" },
  { bg: "var(--tint-amber)", fg: "var(--warning)" },
] as const;

export function getAccent(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % ACCENT_PALETTE.length;
  return ACCENT_PALETTE[index];
}
