import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/dashboard
 * Returns aggregated CO2 stats + chart data for the logged-in org.
 * Used by the dashboard page (Server Component fetches this).
 */
export async function GET() {
  const supabase = await createClient();

  // Get logged-in user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  // Get the user's org_id from their profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile?.org_id) {
    return NextResponse.json({ error: "No organisation found" }, { status: 404 });
  }

  const orgId = profile.org_id;

  // Fetch all bills for this org (last 12 months)
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const { data: bills } = await supabase
    .from("bills")
    .select("*")
    .eq("org_id", orgId)
    .gte("bill_date", twelveMonthsAgo.toISOString().split("T")[0])
    .order("bill_date", { ascending: false });

  if (!bills) {
    return NextResponse.json({ error: "Failed to fetch bills" }, { status: 500 });
  }

  // ── Calculate summary numbers ─────────────────────────────────────────────

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}`;

  const total_co2_kg = bills.reduce((sum, b) => sum + b.co2_kg, 0);
  const total_kwh = bills
    .filter((b) => b.usage_unit === "kWh")
    .reduce((sum, b) => sum + b.usage_amount, 0);

  const this_month_co2_kg = bills
    .filter((b) => b.bill_date.startsWith(thisMonth))
    .reduce((sum, b) => sum + b.co2_kg, 0);

  const last_month_co2_kg = bills
    .filter((b) => b.bill_date.startsWith(lastMonth))
    .reduce((sum, b) => sum + b.co2_kg, 0);

  // ── Build monthly chart data (last 6 months) ──────────────────────────────

  const monthlyMap: Record<string, { co2: number; kwh: number }> = {};

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-GB", { month: "short" });
    monthlyMap[key] = { co2: 0, kwh: 0 };
    // Store label for later
    (monthlyMap[key] as Record<string, unknown>)._label = label;
  }

  bills.forEach((b) => {
    const key = b.bill_date.substring(0, 7); // "YYYY-MM"
    if (monthlyMap[key]) {
      monthlyMap[key].co2 += b.co2_kg;
      if (b.usage_unit === "kWh") monthlyMap[key].kwh += b.usage_amount;
    }
  });

  const monthly_chart = Object.entries(monthlyMap).map(([, v]) => ({
    month: (v as Record<string, unknown>)._label as string,
    co2: Math.round(v.co2),
    kwh: Math.round(v.kwh),
  }));

  // ── Emissions by bill type ────────────────────────────────────────────────

  const typeMap: Record<string, number> = {};
  bills.forEach((b) => {
    typeMap[b.bill_type] = (typeMap[b.bill_type] ?? 0) + b.co2_kg;
  });
  const by_type = Object.entries(typeMap).map(([type, co2_kg]) => ({ type, co2_kg }));

  // ── Recent 5 bills ────────────────────────────────────────────────────────

  const recent_bills = bills.slice(0, 5);

  return NextResponse.json({
    total_co2_kg: Math.round(total_co2_kg * 100) / 100,
    this_month_co2_kg: Math.round(this_month_co2_kg * 100) / 100,
    last_month_co2_kg: Math.round(last_month_co2_kg * 100) / 100,
    total_kwh: Math.round(total_kwh),
    monthly_chart,
    by_type,
    recent_bills,
  });
}
