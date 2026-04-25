export function formatCarbon(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(2)} tCO₂e`;
  return `${kg.toFixed(1)} kg`;
}

export function formatCarbonKg(kg: number): string {
  return `${kg.toFixed(1)} kg`;
}

export function formatCarbonTonnes(kg: number, decimals = 3): string {
  return `${(kg / 1000).toFixed(decimals)} tCO₂e`;
}

export function formatCost(gbp: number | null | undefined): string {
  if (gbp == null) return "—";
  return `£${gbp.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatUsage(amount: number, unit: string): string {
  return `${amount.toLocaleString()} ${unit}`;
}

export function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day:   "2-digit",
      month: "short",
      year:  "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function formatMonthShort(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString("en-GB", { month: "short" });
  } catch {
    return dateStr;
  }
}

export function formatPriceWithVat(
  price: number,
  vatRate: number = 0
): { vatAmount: string; totalPrice: string } {
  const vat = price * vatRate;
  const total = price + vat;
  return {
    vatAmount: vat.toFixed(2),
    totalPrice: total.toFixed(2),
  };
}

