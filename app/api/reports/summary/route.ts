import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/reports/summary?year=2025
 * Returns a full-year SECR summary for the org:
 * total CO2, by scope, by type, by quarter, intensity ratio.
 */
export async function GET(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, organisations(name, tier)")
    .eq("id", user.id)
    .single();

  if (!profile?.org_id) {
    return NextResponse.json({ error: "No organisation found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year") ?? new Date().getFullYear().toString();
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;

  const { data: bills = [] } = await supabase
    .from("bills")
    .select("bill_type, bill_date, usage_amount, usage_unit, co2_kg, cost_gbp")
    .eq("org_id", profile.org_id)
    .gte("bill_date", from)
    .lte("bill_date", to)
    .order("bill_date", { ascending: true });

  const org = profile.organisations as unknown as { name: string; tier: string } | null;

  // ── Totals ─────────────────────────────────────────────────────────────────
  const totalCo2 = bills.reduce((s, b) => s + (b.co2_kg ?? 0), 0);
  const totalKwh = bills
    .filter((b) => b.usage_unit === "kWh")
    .reduce((s, b) => s + (b.usage_amount ?? 0), 0);
  const totalCost = bills.reduce((s, b) => s + (b.cost_gbp ?? 0), 0);

  // ── By type ─────────────────────────────────────────────────────────────────
  const byType: Record<string, number> = {};
  for (const b of bills) {
    byType[b.bill_type] = (byType[b.bill_type] ?? 0) + (b.co2_kg ?? 0);
  }

  // ── Scope split ─────────────────────────────────────────────────────────────
  const scope1Types = ["gas", "fuel_diesel", "fuel_petrol"];
  const scope2Types = ["electricity"];
  const scope3Types = ["water"];
  const scope1 = bills.filter((b) => scope1Types.includes(b.bill_type)).reduce((s, b) => s + (b.co2_kg ?? 0), 0);
  const scope2 = bills.filter((b) => scope2Types.includes(b.bill_type)).reduce((s, b) => s + (b.co2_kg ?? 0), 0);
  const scope3 = bills.filter((b) => scope3Types.includes(b.bill_type)).reduce((s, b) => s + (b.co2_kg ?? 0), 0);

  // ── By quarter ─────────────────────────────────────────────────────────────
  const quarters: Record<string, number> = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
  for (const b of bills) {
    const month = new Date(b.bill_date).getMonth() + 1;
    const q = month <= 3 ? "Q1" : month <= 6 ? "Q2" : month <= 9 ? "Q3" : "Q4";
    quarters[q] += b.co2_kg ?? 0;
  }
  const byQuarter = Object.entries(quarters).map(([q, co2]) => ({
    period: `${q} ${year}`,
    co2: Math.round(co2),
  }));

  return NextResponse.json({
    org: { name: org?.name ?? "", tier: org?.tier ?? "free" },
    year,
    total_co2_kg: Math.round(totalCo2 * 100) / 100,
    total_kwh: Math.round(totalKwh),
    total_cost_gbp: Math.round(totalCost * 100) / 100,
    by_type: Object.entries(byType).map(([type, co2_kg]) => ({
      type,
      co2_kg: Math.round(co2_kg * 100) / 100,
    })),
    by_scope: {
      scope1: Math.round(scope1 * 100) / 100,
      scope2: Math.round(scope2 * 100) / 100,
      scope3: Math.round(scope3 * 100) / 100,
    },
    by_quarter: byQuarter,
    bill_count: bills.length,
  });
}
