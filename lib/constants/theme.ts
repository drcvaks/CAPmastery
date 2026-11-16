export const theme = {
  colors: {
    // Civil Air Patrol (CAP) Navy, Valor Red & Silver Palette (matched to CAP Mastery logo)
    background: "#F1F5F9",
    surface: "#FFFFFF",
    surfaceAlt: "#F8FAFC",
    surfaceMuted: "#F1F5F9",
    primary: "#042454", // CAP Deep Midnight Navy
    primaryDark: "#021636", // Deepest Navy
    primaryLight: "#123C7A", // CAP Command Blue
    primarySoft: "#E8EFF8", // Soft Ice Navy tint
    accent: "#BA121A", // CAP Valor Red (from "Mastery" & wing stripes)
    accentSoft: "#FEF2F2", // Soft Valor Red tint
    gold: "#BA121A", // Mapped to CAP Valor Red / Silver accent for authentic CAP palette
    goldBright: "#E2E8F0", // Metallic Silver highlight
    goldSoft: "#F1F5F9", // Soft Silver/Slate surface
    goldBorder: "#CBD5E1", // Crisp Silver border
    ink: "#042454", // Deep CAP Navy ink
    inkSecondary: "#1E3A5F", // Slate Navy for secondary text
    muted: "#475569", // Slate gray for captions
    subtle: "#94A3B8",
    border: "#DCE4EF",
    borderStrong: "#CBD5E1",
    borderSoft: "#E2E8F0",
    success: "#0D7A52",
    successSoft: "#ECFDF5",
    successBorder: "#A7F3D0",
    warning: "#B45309",
    warningSoft: "#FFFBEB",
    warningBorder: "#FDE68A",
    danger: "#BA121A",
    dangerSoft: "#FEF2F2",
    dangerBorder: "#FECACA",
    info: "#042454",
    infoSoft: "#E8EFF8",
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 44,
  },
  radius: {
    xs: 6,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 22,
    pill: 999,
  },
} as const;
