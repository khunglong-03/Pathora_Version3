/* ── Design Tokens ─────────────────────────────────────────────── */
export const CSS = {
  accent:        "var(--accent)",
  border:         "var(--border)",
  borderSub:     "var(--border-subtle)",
  surface:       "var(--surface)",
  surfaceRaise:  "var(--surface-raised)",
  textPrimary:   "var(--text-primary)",
  textSecondary: "var(--text-secondary)",
  textMuted:     "var(--text-muted)",
  success:       "var(--success)",
  successMuted:  "var(--success-muted)",
  successBorder: "var(--success-border)",
  danger:        "var(--danger)",
  dangerMuted:   "var(--danger-muted)",
  dangerBorder:  "var(--danger-border)",
  warning:       "var(--warning)",
  warningMuted:  "var(--warning-muted)",
  warningBorder: "var(--warning-border)",
  shadowCard:    "var(--shadow-card)",
} as const;

/* ── Animation Config ─────────────────────────────────────────── */
export const SPRING = { type: "spring" as const, stiffness: 100, damping: 20 };
export const EASE_BENTO = [0.32, 0.72, 0, 1] as [number, number, number, number];

export const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: SPRING },
};

export const rowVariants = {
  hidden: { opacity: 0, x: -8 },
  show: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.04, ...SPRING },
  }),
};

/* ── Status Config ────────────────────────────────────────────── */
export type BookingStatus = "confirmed" | "pending" | "cancelled";

export const STATUS_BADGE: Record<BookingStatus, { bg: string; text: string; dot: string; border: string }> = {
  confirmed: { bg: CSS.successMuted, text: CSS.success, dot: CSS.success, border: "var(--success-border)" },
  pending:   { bg: CSS.warningMuted, text: CSS.warning, dot: CSS.warning, border: "var(--warning-border)" },
  cancelled: { bg: CSS.dangerMuted,  text: CSS.danger,  dot: CSS.danger,  border: "var(--danger-border)" },
};

/* ── Data State ────────────────────────────────────────────────── */
export type BookingsDataState = "loading" | "ready" | "empty" | "error";
