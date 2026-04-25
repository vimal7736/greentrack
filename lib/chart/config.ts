export const CHART_AXIS_TICK = {
  fontSize: 9, fontWeight: 900, fill: "var(--text-muted)",
} as const;

export const CHART_TOOLTIP_STYLE = {
  borderRadius: "16px",
  border:       "none",
  boxShadow:    "var(--shadow-premium)",
  background:   "var(--bg-elevated)",
  color:        "var(--text-primary)",
  fontSize:     "10px",
  fontWeight:   "900",
} as const;

export const CHART_CURSOR = {
  fill: "var(--bg-inset)", opacity: 0.4,
} as const;
