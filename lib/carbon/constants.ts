export const BILL_TYPE_LABELS: Record<string, string> = {
  electricity: "Electricity",
  gas:         "Gas",
  water:       "Water",
  fuel_diesel: "Diesel",
  fuel_petrol: "Petrol",
};

export const BILL_TYPE_COLORS: Record<string, string> = {
  electricity: "#22c55e",
  gas:         "#3b82f6",
  water:       "#06b6d4",
  fuel_diesel: "#f59e0b",
  fuel_petrol: "#f97316",
};

export const BILL_TYPE_BADGE_CLASSES: Record<string, string> = {
  electricity: "text-gt-green-600 bg-gt-green-500/10 border-gt-green-500/20",
  gas:         "text-blue-600 bg-blue-500/10 border-blue-500/20",
  water:       "text-cyan-600 bg-cyan-500/10 border-cyan-500/20",
  fuel_diesel: "text-brand-orange-dark bg-brand-orange/10 border-brand-orange/20",
  fuel_petrol: "text-brand-orange-dark bg-brand-orange/10 border-brand-orange/20",
};

export const BILL_TYPE_FILTER_OPTIONS = [
  { key: "all",         label: "All"         },
  { key: "electricity", label: "Electricity" },
  { key: "gas",         label: "Gas"         },
  { key: "water",       label: "Water"       },
  { key: "fuel_diesel", label: "Diesel"      },
  { key: "fuel_petrol", label: "Petrol"      },
];

export const BILL_TYPE_RGBA: Record<string, { bg: string; text: string }> = {
  electricity: { bg: "rgba(34,197,94,0.12)",  text: "var(--brand-green-dark)" },
  gas:         { bg: "rgba(59,130,246,0.12)", text: "#2563eb" },
  water:       { bg: "rgba(6,182,212,0.12)",  text: "#0891b2" },
  fuel_diesel: { bg: "rgba(249,115,22,0.12)", text: "var(--brand-orange-dark)" },
  fuel_petrol: { bg: "rgba(249,115,22,0.12)", text: "var(--brand-orange-dark)" },
};

export const SCOPE_LABELS: Record<string, string> = {
  electricity: "Scope 2",
  gas:         "Scope 1",
  fuel_diesel: "Scope 1",
  fuel_petrol: "Scope 1",
  water:       "Scope 3",
};
