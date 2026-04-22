import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TrendingDown, Zap, Flame, Fuel, ArrowUpRight, ArrowDownRight } from "lucide-react";
import DashboardCharts from "./DashboardCharts";
import NoOrgState from "@/components/NoOrgState";

const BILL_TYPE_LABELS: Record<string, string> = {
  electricity: "Electricity",
  gas: "Gas",
  water: "Water",
  fuel_diesel: "Diesel",
  fuel_petrol: "Petrol",
};

const BADGE_COLORS: Record<string, string> = {
  electricity: "bg-yellow-100 text-yellow-700",
  gas: "bg-blue-100 text-blue-700",
  water: "bg-cyan-100 text-cyan-700",
  fuel_diesel: "bg-orange-100 text-orange-700",
  fuel_petrol: "bg-orange-100 text-orange-700",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, organisations(name)")
    .eq("id", user.id)
    .single();

  if (!profile?.org_id) {
    return <NoOrgState />;
  }

  const org = (Array.isArray(profile.organisations) ? profile.organisations[0] : profile.organisations) as { name: string } | null;
  const orgName = org?.name ?? "Your Organisation";

  // Fetch last 12 months of bills
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

  const { data: billsData } = await supabase
    .from("bills")
    .select("id, bill_type, bill_date, usage_amount, usage_unit, co2_kg, cost_gbp, supplier, created_at")
    .eq("org_id", profile.org_id)
    .gte("bill_date", twelveMonthsAgo.toISOString().slice(0, 10))
    .order("bill_date", { ascending: false });

  type BillRow = {
    id: string;
    bill_type: string;
    bill_date: string;
    usage_amount: number;
    usage_unit: string;
    co2_kg: number;
    cost_gbp: number | null;
    supplier: string | null;
    created_at: string;
  };
  const bills: BillRow[] = billsData ?? [];

  // ── Summary Stats ──────────────────────────────────────────────────────────
  const totalCo2 = bills.reduce((s, b) => s + (b.co2_kg ?? 0), 0);
  const totalKwh = bills
    .filter((b) => b.usage_unit === "kWh")
    .reduce((s, b) => s + (b.usage_amount ?? 0), 0);

  const now = new Date();
  const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStr = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}`;

  const thisMonthCo2 = bills
    .filter((b) => b.bill_date?.startsWith(thisMonthStr))
    .reduce((s, b) => s + (b.co2_kg ?? 0), 0);
  const lastMonthCo2 = bills
    .filter((b) => b.bill_date?.startsWith(lastMonthStr))
    .reduce((s, b) => s + (b.co2_kg ?? 0), 0);

  const trendPct = lastMonthCo2 > 0
    ? (((thisMonthCo2 - lastMonthCo2) / lastMonthCo2) * 100).toFixed(1)
    : "0";
  const trendDown = thisMonthCo2 <= lastMonthCo2;

  // ── Monthly chart data (last 6 months) ────────────────────────────────────
  const monthlyMap: Record<string, { co2: number; kwh: number }> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-GB", { month: "short" });
    monthlyMap[key] = { co2: 0, kwh: 0 };
    // store label alongside key
    (monthlyMap[key] as Record<string, unknown>).__label = label;
  }
  for (const bill of bills) {
    const prefix = bill.bill_date?.slice(0, 7);
    if (prefix && monthlyMap[prefix]) {
      monthlyMap[prefix].co2 += bill.co2_kg ?? 0;
      if (bill.usage_unit === "kWh") monthlyMap[prefix].kwh += bill.usage_amount ?? 0;
    }
  }
  const monthlyChart = Object.entries(monthlyMap).map(([, v]) => ({
    month: (v as Record<string, unknown>).__label as string,
    co2: Math.round(v.co2 * 10) / 10,
    kwh: Math.round(v.kwh),
  }));

  // ── By-type breakdown ──────────────────────────────────────────────────────
  const typeMap: Record<string, number> = {};
  for (const bill of bills) {
    typeMap[bill.bill_type] = (typeMap[bill.bill_type] ?? 0) + (bill.co2_kg ?? 0);
  }
  const byType = Object.entries(typeMap).map(([type, co2_kg]) => ({
    type,
    co2_kg: Math.round(co2_kg * 10) / 10,
  }));

  // ── Recent 5 bills ─────────────────────────────────────────────────────────
  const recentBills = bills.slice(0, 5);

  const milesDriven = Math.round(totalCo2 / 0.255);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Carbon footprint overview for {orgName}</p>
        </div>
        <span className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-medium">
          2025 DEFRA Factors Active
        </span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Total CO₂ (All Time)"
          value={`${(totalCo2 / 1000).toFixed(2)} tCO₂e`}
          sub="Tonnes CO₂ equivalent"
          icon={<TrendingDown className="w-5 h-5 text-green-600" />}
          color="bg-green-50"
        />
        <StatCard
          label="This Month"
          value={`${(thisMonthCo2 / 1000).toFixed(3)} tCO₂e`}
          sub={
            <span className={`flex items-center gap-1 text-xs ${trendDown ? "text-green-600" : "text-red-500"}`}>
              {trendDown
                ? <ArrowDownRight className="w-3 h-3" />
                : <ArrowUpRight className="w-3 h-3" />}
              {Math.abs(Number(trendPct))}% vs last month
            </span>
          }
          icon={<Zap className="w-5 h-5 text-yellow-500" />}
          color="bg-yellow-50"
        />
        <StatCard
          label="Total Energy Used"
          value={`${Math.round(totalKwh).toLocaleString()} kWh`}
          sub="Electricity + Gas combined"
          icon={<Flame className="w-5 h-5 text-orange-500" />}
          color="bg-orange-50"
        />
        <StatCard
          label="Real-World Equivalent"
          value={`${milesDriven.toLocaleString()} miles`}
          sub="Based on avg car emissions"
          icon={<Fuel className="w-5 h-5 text-blue-500" />}
          color="bg-blue-50"
        />
      </div>

      {/* Charts — client component */}
      <DashboardCharts monthlyChart={monthlyChart} byType={byType} totalCo2={totalCo2} />

      {/* Recent Bills */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">Recent Bills</h2>
          <a href="/history" className="text-xs text-green-600 hover:underline">View all →</a>
        </div>
        {recentBills.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            No bills yet. <a href="/upload" className="text-green-600 hover:underline">Upload your first bill →</a>
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-100">
                <th className="text-left pb-2">Type</th>
                <th className="text-left pb-2">Date</th>
                <th className="text-right pb-2">Usage</th>
                <th className="text-right pb-2">CO₂e</th>
              </tr>
            </thead>
            <tbody>
              {recentBills.map((bill) => (
                <tr key={bill.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BADGE_COLORS[bill.bill_type] ?? "bg-gray-100 text-gray-600"}`}>
                      {BILL_TYPE_LABELS[bill.bill_type] ?? bill.bill_type}
                    </span>
                  </td>
                  <td className="py-2 text-gray-500">{bill.bill_date}</td>
                  <td className="py-2 text-right text-gray-700">
                    {bill.usage_amount} {bill.usage_unit}
                  </td>
                  <td className="py-2 text-right font-medium text-gray-900">{bill.co2_kg} kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon, color }: {
  label: string;
  value: string;
  sub: React.ReactNode;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <div className={`w-9 h-9 ${color} rounded-lg flex items-center justify-center`}>{icon}</div>
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <div className="text-xs text-gray-400 mt-1">{sub}</div>
    </div>
  );
}
