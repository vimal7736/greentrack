import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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
  const to   = `${year}-12-31`;
  const prevYear = String(Number(year) - 1);
  const prevFrom = `${prevYear}-01-01`;
  const prevTo   = `${prevYear}-12-31`;

  // Current year bills
  const { data: billsData } = await supabase
    .from("bills")
    .select("bill_type, bill_date, usage_amount, usage_unit, co2_kg, cost_gbp")
    .eq("org_id", profile.org_id)
    .gte("bill_date", from)
    .lte("bill_date", to)
    .order("bill_date", { ascending: true });

  // Previous year bills (for YoY)
  const { data: prevBillsData } = await supabase
    .from("bills")
    .select("co2_kg, cost_gbp")
    .eq("org_id", profile.org_id)
    .gte("bill_date", prevFrom)
    .lte("bill_date", prevTo);

  // Active target
  const { data: targetData } = await supabase
    .from("org_targets")
    .select("annual_carbon_cap_kg, yearly_reduction_rate, net_zero_target_year, sbti_pathway, baseline_year")
    .eq("org_id", profile.org_id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const bills     = billsData     ?? [];
  const prevBills = prevBillsData ?? [];

  const org = (
    Array.isArray(profile.organisations)
      ? profile.organisations[0]
      : profile.organisations
  ) as { name: string; tier: string } | null;

  // ── Totals ──────────────────────────────────────────────────────────────────
  const totalCo2  = bills.reduce((s, b) => s + (b.co2_kg   ?? 0), 0);
  const totalKwh  = bills.filter((b) => b.usage_unit === "kWh").reduce((s, b) => s + (b.usage_amount ?? 0), 0);
  const totalCost = bills.reduce((s, b) => s + (b.cost_gbp ?? 0), 0);

  // ── Previous year ────────────────────────────────────────────────────────────
  const prevYearCo2  = prevBills.reduce((s, b) => s + (b.co2_kg   ?? 0), 0);
  const prevYearCost = prevBills.reduce((s, b) => s + (b.cost_gbp ?? 0), 0);

  // ── By type (co2 + cost) ─────────────────────────────────────────────────────
  const byTypeMap: Record<string, { co2: number; cost: number }> = {};
  for (const b of bills) {
    if (!byTypeMap[b.bill_type]) byTypeMap[b.bill_type] = { co2: 0, cost: 0 };
    byTypeMap[b.bill_type].co2  += b.co2_kg   ?? 0;
    byTypeMap[b.bill_type].cost += b.cost_gbp ?? 0;
  }

  // ── Scope split ──────────────────────────────────────────────────────────────
  const scope1Types = ["gas", "fuel_diesel", "fuel_petrol"];
  const scope2Types = ["electricity"];
  const scope3Types = ["water"];
  const scope1 = bills.filter((b) => scope1Types.includes(b.bill_type)).reduce((s, b) => s + (b.co2_kg ?? 0), 0);
  const scope2 = bills.filter((b) => scope2Types.includes(b.bill_type)).reduce((s, b) => s + (b.co2_kg ?? 0), 0);
  const scope3 = bills.filter((b) => scope3Types.includes(b.bill_type)).reduce((s, b) => s + (b.co2_kg ?? 0), 0);

  // ── By quarter ───────────────────────────────────────────────────────────────
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

  // ── By month (all 12, filled with 0 if no bills) ─────────────────────────────
  const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const monthMap: Record<number, { co2: number; cost: number }> = {};
  for (let i = 1; i <= 12; i++) monthMap[i] = { co2: 0, cost: 0 };
  for (const b of bills) {
    const m = new Date(b.bill_date).getMonth() + 1;
    monthMap[m].co2  += b.co2_kg   ?? 0;
    monthMap[m].cost += b.cost_gbp ?? 0;
  }
  const byMonth = MONTH_LABELS.map((label, i) => ({
    month: label,
    co2:  Math.round(monthMap[i + 1].co2  * 100) / 100,
    cost: Math.round(monthMap[i + 1].cost * 100) / 100,
  }));

  // ── SECR coverage: distinct months that have at least one bill ────────────────
  const monthsWithData = new Set(
    bills.map((b) => new Date(b.bill_date).getMonth() + 1)
  ).size;

  return NextResponse.json({
    org:  { name: org?.name ?? "", tier: org?.tier ?? "free" },
    year,
    total_co2_kg:   Math.round(totalCo2  * 100) / 100,
    total_kwh:      Math.round(totalKwh),
    total_cost_gbp: Math.round(totalCost * 100) / 100,
    by_type: Object.entries(byTypeMap).map(([type, { co2, cost }]) => ({
      type,
      co2_kg:   Math.round(co2  * 100) / 100,
      cost_gbp: Math.round(cost * 100) / 100,
    })),
    by_scope: {
      scope1: Math.round(scope1 * 100) / 100,
      scope2: Math.round(scope2 * 100) / 100,
      scope3: Math.round(scope3 * 100) / 100,
    },
    by_quarter:       byQuarter,
    by_month:         byMonth,
    bill_count:       bills.length,
    prev_year_co2:    Math.round(prevYearCo2  * 100) / 100,
    prev_year_cost:   Math.round(prevYearCost * 100) / 100,
    months_with_data: monthsWithData,
    target: targetData
      ? {
          annual_carbon_cap_kg:  targetData.annual_carbon_cap_kg,
          yearly_reduction_rate: targetData.yearly_reduction_rate,
          net_zero_target_year:  targetData.net_zero_target_year,
          sbti_pathway:          targetData.sbti_pathway,
          baseline_year:         targetData.baseline_year,
        }
      : null,
  });
}
