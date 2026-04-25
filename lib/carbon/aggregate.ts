import type { BillRow, AggregatedPeriod } from "@/types";

export function billsInRange(bills: BillRow[], from: string, to: string): BillRow[] {
  return bills.filter((b) => b.bill_date >= from && b.bill_date <= to + "-31");
}

export function aggregateBills(bills: BillRow[]): AggregatedPeriod {
  const byType: Record<string, number> = {};
  let co2 = 0, kwh = 0, cost = 0;
  for (const b of bills) {
    co2  += b.co2_kg   ?? 0;
    cost += b.cost_gbp ?? 0;
    if (b.usage_unit === "kWh") kwh += b.usage_amount ?? 0;
    byType[b.bill_type] = (byType[b.bill_type] ?? 0) + (b.co2_kg ?? 0);
  }
  return { co2, kwh, cost, byType };
}

export function calcDelta(a: number, b: number): number {
  return a > 0 ? ((b - a) / a) * 100 : 0;
}

export function monthOffset(date: Date, offset: number): string {
  const d = new Date(date.getFullYear(), date.getMonth() + offset, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function buildMonthlyMap(bills: BillRow[], monthsBack: number): Record<string, number> {
  const now = new Date();
  const map: Record<string, number> = {};
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    map[key]  = 0;
  }
  for (const b of bills) {
    const p = b.bill_date?.slice(0, 7);
    if (p && map[p] !== undefined) map[p] += b.co2_kg ?? 0;
  }
  return map;
}
