export const theme = {
  colors: {
    // Civil Air Patrol core palette
    background: "#F0F4F8",
    surface: "#FFFFFF",
    surfaceAlt: "#F7FAFC",
    surfaceElevated: "#FFFFFF",
    // CAP Deep Command Navy
    primary: "#0B2545",
    primaryDark: "#06162B",
    primaryLight: "#1D4E89",
    primarySoft: "#DCEBFA",
    primaryMuted: "#2B4C7E",
    // CAP Valor Crimson / Red
    accent: "#B8293D",
    accentDark: "#8E1C2C",
    accentSoft: "#FCE8EB",
    // CAP Insignia Gold / Brass
    gold: "#C89211",
    goldBright: "#EAB308",
    goldSoft: "#FEF6DF",
    goldBorder: "#F3D58D",
    // Text & Ink hierarchy
    ink: "#0B2545",
    inkSecondary: "#243B53",
    muted: "#486581",
    subtle: "#829AB1",
    // Borders & Dividers
    border: "#CFDCE6",
    borderStrong: "#9FB3C8",
    borderSoft: "#E2ECF3",
    // Semantic feedback
    success: "#1E7E52",
    successSoft: "#E3F6EC",
    successBorder: "#8CE0B5",
    warning: "#B45309",
    warningSoft: "#FEF3C7",
    warningBorder: "#FCD34D",
    danger: "#B8293D",
    dangerSoft: "#FCE8EB",
    dangerBorder: "#F5B2BC",
    info: "#1D4E89",
    infoSoft: "#E1EFFA",
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  radius: {
    xs: 6,
    sm: 8,
    md: 12,
    lg: 18,
    xl: 24,
    pill: 999,
  },
} as const;
