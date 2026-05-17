import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  TrendingDown, Zap, Flame, Fuel, BarChart3,
  ArrowUpRight, ArrowDownRight,
  Upload, FileText, Users, Scale, Target,
  Lightbulb, AlertTriangle, CheckCircle, Leaf,
  Droplet, Truck, Car,
} from "lucide-react";
import DashboardCharts from "./DashboardCharts";
import { BudgetRing } from "./BudgetRing";
import { PeriodComparison } from "./PeriodComparison";
import { Tooltip } from "@/components/ui/Tooltip";

/* ── Constants ───────────────────────────────────────────────── */
const TYPE_LABELS: Record<string, string> = {
  electricity: "Electricity", gas: "Gas", water: "Water",
  fuel_diesel: "Diesel", fuel_petrol: "Petrol",
};
const BADGE_STYLES: Record<string, { bg: string; text: string }> = {
  electricity: { bg: "rgba(34,197,94,0.12)", text: "var(--brand-green-dark)" },
  gas: { bg: "rgba(34,197,94,0.10)", text: "var(--brand-green-dark)" },
  water: { bg: "rgba(34,197,94,0.08)", text: "var(--brand-green-dark)" },
  fuel_diesel: { bg: "rgba(20,80,40,0.12)", text: "var(--brand-green-darker)" },
  fuel_petrol: { bg: "rgba(20,80,40,0.12)", text: "var(--brand-green-darker)" },
};
const TYPE_COLORS: Record<string, string> = {
  electricity: "#22c55e",
  gas: "#f97316",
  water: "#06b6d4",
  fuel_diesel: "#d97706",
  fuel_petrol: "#ef4444",
};
const TYPE_GRADIENTS: Record<string, string> = {
  electricity: "linear-gradient(90deg, #22c55e, #4ade80)",
  gas: "linear-gradient(90deg, #f97316, #fdba74)",
  water: "linear-gradient(90deg, #06b6d4, #67e8f9)",
  fuel_diesel: "linear-gradient(90deg, #d97706, #fbbf24)",
  fuel_petrol: "linear-gradient(90deg, #ef4444, #f87171)",
};
const TYPE_ICONS: Record<string, React.ReactNode> = {
  electricity: <Zap className="w-3.5 h-3.5" />,
  gas: <Flame className="w-3.5 h-3.5" />,
  water: <Droplet className="w-3.5 h-3.5" />,
  fuel_diesel: <Truck className="w-3.5 h-3.5" />,
  fuel_petrol: <Car className="w-3.5 h-3.5" />,
};
const TYPE_TOOLTIPS: Record<string, React.ReactNode> = {
  electricity: (
    <div className="space-y-1.5 text-left">
      <p style={{ color: "#22c55e", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em" }}>
        Scope 2 • Indirect
      </p>
      <p className="text-text-secondary leading-normal font-semibold">
        Emissions from purchased electricity. **Tip:** Switch to a 100% certified green energy supplier or invest in on-site solar arrays to immediately zero out Scope 2.
      </p>
    </div>
  ),
  gas: (
    <div className="space-y-1.5 text-left">
      <p style={{ color: "#f97316", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em" }}>
        Scope 1 • Direct
      </p>
      <p className="text-text-secondary leading-normal font-semibold">
        Direct combustion from heating boilers. **Tip:** Improve building insulation, service boilers quarterly, or evaluate electric heat pumps to phase out gas entirely.
      </p>
    </div>
  ),
  water: (
    <div className="space-y-1.5 text-left">
      <p style={{ color: "#06b6d4", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em" }}>
        Scope 3 • Value Chain
      </p>
      <p className="text-text-secondary leading-normal font-semibold">
        Supply chain water treatment. **Tip:** Install aerators on office taps, introduce rain-water harvesting systems, and inspect pipe networks regularly to prevent leaks.
      </p>
    </div>
  ),
  fuel_diesel: (
    <div className="space-y-1.5 text-left">
      <p style={{ color: "#d97706", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em" }}>
        Scope 1 • Direct
      </p>
      <p className="text-text-secondary leading-normal font-semibold">
        Direct combustion from machinery & heavy fleets. **Tip:** Optimize delivery routes, switch to hybrid/electric machinery, and mandate eco-driving habits.
      </p>
    </div>
  ),
  fuel_petrol: (
    <div className="space-y-1.5 text-left">
      <p style={{ color: "#ef4444", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em" }}>
        Scope 1 • Direct
      </p>
      <p className="text-text-secondary leading-normal font-semibold">
        Direct combustion from corporate cars. **Tip:** Incentivize electric vehicles (EVs) for sales reps, mandate car-pooling, or offer cycling allowances.
      </p>
    </div>
  ),
};

/* ── Page ─────────────────────────────────────────────────────── */
export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, role, organisations(name)")
    .eq("id", user.id)
    .single();

  const org = (
    Array.isArray(profile?.organisations) ? profile.organisations[0] : profile?.organisations
  ) as { name: string } | null;
  const orgName = org?.name ?? "Your Organisation";
  const orgId = profile?.org_id ?? null;

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

  const { data: billsData } = orgId ? await supabase
    .from("bills")
    .select("id,bill_type,bill_date,usage_amount,usage_unit,co2_kg,cost_gbp,supplier,created_at")
    .eq("org_id", orgId)
    .gte("bill_date", twelveMonthsAgo.toISOString().slice(0, 10))
    .order("bill_date", { ascending: false }) : { data: [] };

  const { data: targetData } = orgId ? await supabase
    .from("targets")
    .select("annual_carbon_cap_kg, yearly_reduction_rate, net_zero_target_year")
    .eq("org_id", orgId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle() : { data: null };

  type BillRow = {
    id: string; bill_type: string; bill_date: string;
    usage_amount: number; usage_unit: string; co2_kg: number;
    cost_gbp: number | null; supplier: string | null; created_at: string;
  };
  const bills: BillRow[] = billsData ?? [];

  /* ── Core stats ─────────────────────────────────────────────── */
  const totalCo2 = bills.reduce((s, b) => s + (b.co2_kg ?? 0), 0);
  const totalKwh = bills.filter((b) => b.usage_unit === "kWh")
    .reduce((s, b) => s + (b.usage_amount ?? 0), 0);

  const totalCost = bills.reduce((s, b) => s + (b.cost_gbp ?? 0), 0);
  const estimatedSavings = Math.round(totalCost * 0.11);
  const hasGreenSupplier = bills.some(b => 
    b.supplier?.toLowerCase().includes("octopus") || 
    b.supplier?.toLowerCase().includes("edf") || 
    b.supplier?.toLowerCase().includes("green")
  );
  const renewableMix = hasGreenSupplier ? 85 : 43;

  const targetCapKg = targetData?.annual_carbon_cap_kg ?? 35000;
  const targetYear = targetData?.net_zero_target_year ?? 2030;
  const targetUsedPct = targetCapKg > 0 ? Math.min(100, (totalCo2 / targetCapKg) * 100) : 0;

  const now = new Date();
  const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStr = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}`;

  const thisMonthCo2 = bills.filter((b) => b.bill_date?.startsWith(thisMonthStr))
    .reduce((s, b) => s + (b.co2_kg ?? 0), 0);
  const lastMonthCo2 = bills.filter((b) => b.bill_date?.startsWith(lastMonthStr))
    .reduce((s, b) => s + (b.co2_kg ?? 0), 0);

  const trendPct = lastMonthCo2 > 0
    ? (((thisMonthCo2 - lastMonthCo2) / lastMonthCo2) * 100).toFixed(1)
    : "0";
  const trendDown = thisMonthCo2 <= lastMonthCo2;

  /* Monthly average over distinct billing months */
  const distinctMonths = new Set(bills.map((b) => b.bill_date?.slice(0, 7))).size;
  const monthlyAvg = distinctMonths > 0 ? totalCo2 / distinctMonths : 0;

  const milesDriven = Math.round(totalCo2 / 0.255);

  /* ── Chart data ─────────────────────────────────────────────── */
  const monthlyMap: Record<string, { co2: number; kwh: number; __label?: string }> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap[key] = { co2: 0, kwh: 0, __label: d.toLocaleString("en-GB", { month: "short" }) };
  }
  for (const b of bills) {
    const p = b.bill_date?.slice(0, 7);
    if (p && monthlyMap[p]) {
      monthlyMap[p].co2 += b.co2_kg ?? 0;
      if (b.usage_unit === "kWh") monthlyMap[p].kwh += b.usage_amount ?? 0;
    }
  }
  const monthlyChart = Object.values(monthlyMap).map((v) => ({
    month: v.__label as string,
    co2: Math.round(v.co2 * 10) / 10,
    kwh: Math.round(v.kwh),
  }));

  const typeMap: Record<string, number> = {};
  for (const b of bills) {
    typeMap[b.bill_type] = (typeMap[b.bill_type] ?? 0) + (b.co2_kg ?? 0);
  }
  const byType = Object.entries(typeMap)
    .map(([type, co2_kg]) => ({ type, co2_kg: Math.round(co2_kg * 10) / 10 }))
    .sort((a, b) => b.co2_kg - a.co2_kg);

  /* ── AI insights ─────────────────────────────────────────────── */
  const insights: { type: "success" | "warning" | "info"; title: string; body: string }[] = [];

  if (byType.length > 0) {
    const top = byType[0];
    const pct = totalCo2 > 0 ? ((top.co2_kg / totalCo2) * 100).toFixed(0) : "0";
    insights.push({
      type: "warning",
      title: `${TYPE_LABELS[top.type] ?? top.type} is your top source`,
      body: `${pct}% of all emissions — consider switching to a lower-carbon alternative.`,
    });
  }
  if (lastMonthCo2 > 0) {
    const isDown = thisMonthCo2 <= lastMonthCo2;
    insights.push({
      type: isDown ? "success" : "warning",
      title: isDown ? `↓ ${Math.abs(Number(trendPct))}% reduction this month` : `↑ ${Math.abs(Number(trendPct))}% increase this month`,
      body: isDown
        ? "Great progress — keep up the efficiency gains."
        : "Emissions rose vs last month. Review energy usage.",
    });
  }
  const projected = monthlyAvg * 12;
  if (projected > 0) {
    const isSmall = projected < 100;
    const title = isSmall
      ? `${projected.toFixed(1)} kg CO₂e projected this year`
      : `${(projected / 1000).toFixed(1)} tCO₂e projected this year`;

    insights.push({
      type: "info",
      title,
      body: `Based on your monthly average of ${monthlyAvg.toFixed(1)} kg. Set a target to reduce it.`,
    });
  }

  /* ── Bills slim (for client PeriodComparison) ────────────────── */
  const billsSlim = bills.map(({ bill_date, co2_kg, usage_amount, usage_unit, cost_gbp }) => ({
    bill_date, co2_kg, usage_amount, usage_unit, cost_gbp,
  }));

  const recentBills = bills.slice(0, 5);

  /* ── Compliance completeness calculation ────────────────────── */
  const last12Months: { key: string; label: string }[] = [];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    last12Months.push({ key, label });
  }

  const uploadedMonths = new Set(bills.map(b => b.bill_date?.slice(0, 7)));
  const coveredMonthsCount = last12Months.filter(m => uploadedMonths.has(m.key)).length;
  const completenessPct = Math.round((coveredMonthsCount / 12) * 100);
  const recent4Months = last12Months.slice(-4).reverse();

  const isFootprintSmall = totalCo2 < 100;
  const footprintVal = isFootprintSmall ? totalCo2.toFixed(1) : (totalCo2 / 1000).toFixed(2);
  const footprintUnit = isFootprintSmall ? "kg CO₂e" : "tCO₂e";
  const footprintText = isFootprintSmall ? `${totalCo2.toFixed(1)} kg` : `${(totalCo2 / 1000).toFixed(2)} tonnes`;

  const isTrendZero = Number(trendPct) === 0;

  return (
    <div className="space-y-4 lg:space-y-5 animate-fade-in">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Leaf className="w-4 h-4 lg:w-5 lg:h-5" style={{ color: "var(--brand-green)" }} />
            <h1 className="text-base lg:text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
              Carbon Dashboard
            </h1>
          </div>
          <p className="text-xs lg:text-sm" style={{ color: "var(--text-muted)" }}>
            Overview for{" "}
            <span style={{ color: "var(--text-brand)", fontWeight: 700 }}>{orgName}</span>
          </p>
        </div>

        <div
          className="neu-raised inline-flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-4 py-1.5 lg:py-2 rounded-xl shrink-0"
          style={{ color: "var(--brand-green-dark)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-gt-green-500 animate-pulse-green inline-block" />
          <span className="text-[10px] lg:text-xs font-bold uppercase tracking-widest">DEFRA Active</span>
        </div>
      </div>

      {/* ── Executive Power-Combo Stat Cards ───────────────────── */}
      <div id="executive-row" className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard
          label="Total Footprint"
          value={footprintVal}
          unit={footprintUnit}
          sub={
            isTrendZero ? (
              <span className="flex items-center gap-1 font-bold animate-pulse-once" style={{ color: "var(--text-muted)", opacity: 0.8 }}>
                ● 0% vs last month
              </span>
            ) : (
              <span className="flex items-center gap-1 font-bold" style={{ color: trendDown ? "var(--brand-green-dark)" : "var(--brand-orange-dark)" }}>
                {trendDown ? <ArrowDownRight className="w-3.5 h-3.5 text-gt-green-500" /> : <ArrowUpRight className="w-3.5 h-3.5 text-brand-orange" />}
                {Math.abs(Number(trendPct))}% vs last month
              </span>
            )
          }
          icon={<Leaf className="w-4 h-4" />}
          accent="green"
          tooltip={
            <div className="space-y-1 text-left">
              <p style={{ color: "var(--brand-green)", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                Environmental Scale
              </p>
              <p className="text-text-secondary leading-normal font-semibold">
                <span className="text-gt-green-500 font-black text-xs">
                  {footprintText}
                </span>{" "}
                of carbon footprint is equivalent to driving a petrol car{" "}
                <span className="text-gt-green-500 font-black text-xs tracking-tight animate-pulse-green">
                  {milesDriven.toLocaleString()} miles
                </span>!
              </p>
            </div>
          }
          tooltipAlign="left"
        />
        <StatCard
          label="Carbon Budget"
          value={targetUsedPct === 0 ? "0" : targetUsedPct < 0.1 ? targetUsedPct.toFixed(3) : targetUsedPct.toFixed(1)}
          unit="% Used"
          sub={
            <span 
              className="flex items-center gap-1 font-bold" 
              style={{ 
                color: targetUsedPct < 50 
                  ? "var(--brand-green-dark)" 
                  : targetUsedPct < 85 
                    ? "var(--brand-orange-dark)" 
                    : "#ef4444" 
              }}
            >
              {targetUsedPct < 50 ? "● On Track (Safe)" : targetUsedPct < 85 ? "● Warning (Moderate)" : "● Action Needed"}
            </span>
          }
          icon={<Target className="w-4 h-4" />}
          accent={targetUsedPct >= 85 ? "orange" : "green"}
          tooltip={
            <div className="space-y-1 text-left">
              <p style={{ color: "var(--brand-green)", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                Target Allocation
              </p>
              <p className="text-text-secondary leading-normal font-semibold">
                Consumed{" "}
                <span className="text-gt-green-500 font-black text-xs">
                  {targetUsedPct === 0 ? "0" : targetUsedPct < 0.1 ? targetUsedPct.toFixed(3) : targetUsedPct.toFixed(1)}%
                </span>{" "}
                of your annual allowance of{" "}
                <span className="text-gt-green-500 font-black text-xs">
                  {(targetCapKg / 1000).toLocaleString(undefined, { maximumFractionDigits: 0 })} tonnes
                </span>. Keep emissions low to hit Net Zero by {targetYear}!
              </p>
            </div>
          }
          tooltipAlign="center"
        />
        <StatCard
          label="Utility Spend"
          value={`£${totalCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          unit="GBP"
          sub={
            <span className="font-bold text-gt-green-600">
              ✓ £{estimatedSavings.toLocaleString()} Saved (ROI)
            </span>
          }
          icon={<Zap className="w-4 h-4" />}
          accent="green"
          tooltip={
            <div className="space-y-1 text-left">
              <p style={{ color: "var(--brand-green)", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                Financial Spend & ROI
              </p>
              <p className="text-text-secondary leading-normal font-semibold">
                Total spend across all utilities is{" "}
                <span className="text-gt-green-500 font-black text-xs">
                  £{totalCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>. Swapping to clean energy can save you an estimated{" "}
                <span className="text-gt-green-500 font-black text-xs tracking-tight animate-pulse-green">
                  £{estimatedSavings.toLocaleString()}
                </span>!
              </p>
            </div>
          }
          tooltipAlign="center"
        />
        <StatCard
          label="Clean Power Mix"
          value={`${renewableMix}`}
          unit="% Green"
          sub={
            <span className="font-bold text-text-muted">
              {hasGreenSupplier ? "✓ Active Green Tariff" : "UK Grid Base: 43%"}
            </span>
          }
          icon={<Flame className="w-4 h-4" />}
          accent="green"
          tooltip={
            <div className="space-y-1 text-left">
              <p style={{ color: "var(--brand-green)", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                Renewable Energy Mix
              </p>
              <p className="text-text-secondary leading-normal font-semibold">
                Your electricity grid share is{" "}
                <span className="text-gt-green-500 font-black text-xs">
                  {renewableMix}% clean
                </span>. Switch to a green supplier to immediately reach{" "}
                <span className="text-gt-green-500 font-black text-xs tracking-tight animate-pulse-green">
                  85% or higher
                </span>!
              </p>
            </div>
          }
          tooltipAlign="right"
        />
      </div>

      {/* ── Row: CO₂ trend chart + Budget Ring ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4">
        {/* Chart in a deep inset well */}
        <div
          className="lg:col-span-8 rounded-2xl p-4 lg:p-6 min-h-[260px] lg:min-h-[350px]"
          style={{
            background: "var(--neu-base)",
            boxShadow: "var(--shadow-inset)",
            border: "var(--card-border)",
          }}
        >
          <DashboardCharts monthlyChart={monthlyChart} byType={byType} totalCo2={totalCo2} chartOnly="interactive" />
        </div>

        {/* Budget Ring */}
        <div
          className="lg:col-span-4 rounded-2xl p-4 lg:p-6"
          style={{
            background: "var(--neu-base)",
            boxShadow: "var(--shadow-raised)",
            border: "var(--card-border)",
          }}
        >
          <BudgetRing thisMonthCo2={thisMonthCo2} monthlyAvg={monthlyAvg} distinctMonths={distinctMonths} />
        </div>
      </div>

      {/* ── Row: Period Comparison + Emissions Breakdown + AI ────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 lg:gap-4">

        {/* SECR Compliance Audit Readiness Card */}
        <div
          className="md:col-span-2 lg:col-span-5 rounded-2xl p-4 lg:p-6 flex flex-col justify-between"
          style={{
            background: "var(--neu-base)",
            boxShadow: "var(--shadow-raised)",
            border: "var(--card-border)",
          }}
        >
          {/* Card Header */}
          <div className="flex items-center justify-between mb-4 border-b border-border-subtle/10 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-gt-green-500" />
              <p className="text-xs font-bold uppercase tracking-widest text-text-primary">
                SECR Audit Readiness
              </p>
            </div>
            <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-gt-green-500/10 text-gt-green-600 border border-gt-green-500/20">
              FY {now.getFullYear()} Active
            </span>
          </div>

          {/* Main Split Content */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center flex-1">
            {/* Left: The Circular Gauge */}
            <div className="sm:col-span-5 flex flex-col items-center justify-center relative">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r={32}
                    className="stroke-gt-green-500/5 fill-none"
                    strokeWidth="7"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r={32}
                    className="stroke-gt-green-500 fill-none"
                    strokeWidth="7"
                    strokeDasharray={2 * Math.PI * 32}
                    strokeDashoffset={2 * Math.PI * 32 - (completenessPct / 100) * (2 * Math.PI * 32)}
                    strokeLinecap="round"
                    style={{
                      filter: "drop-shadow(0 0 5px rgba(34, 197, 94, 0.35))",
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-black tracking-tight text-text-primary leading-none">
                    {completenessPct}%
                  </span>
                  <span className="text-[8px] font-bold text-text-muted uppercase tracking-wider mt-0.5">
                    Ready
                  </span>
                </div>
              </div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mt-2.5 text-center">
                {coveredMonthsCount} of 12 months synced
              </p>
            </div>

            {/* Right: Checklist list */}
            <div className="sm:col-span-7 space-y-2 border-t sm:border-t-0 sm:border-l border-border-subtle/10 pt-3 sm:pt-0 sm:pl-4 self-stretch flex flex-col justify-center">
              <p className="text-[9px] font-black uppercase tracking-wider text-text-muted mb-1">
                Data Completeness Trail
              </p>
              
              {recent4Months.map(m => {
                const isComplete = uploadedMonths.has(m.key);
                return (
                  <div key={m.key} className="flex items-center gap-2 text-xs">
                    {isComplete ? (
                      <CheckCircle className="w-4 h-4 text-gt-green-500 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-gt-green-500/25 flex items-center justify-center shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-gt-green-500/40 animate-pulse" />
                      </div>
                    )}
                    <span 
                      className={`font-semibold tracking-tight ${isComplete ? "text-text-secondary" : "text-text-muted"}`}
                    >
                      {m.label}
                    </span>
                    <span className={`text-[9px] font-bold ml-auto px-1.5 py-0.5 rounded-md ${
                      isComplete 
                        ? "bg-gt-green-500/5 text-gt-green-600/90" 
                        : "bg-gt-green-500/5 text-gt-green-500/50"
                    }`}>
                      {isComplete ? "Synced" : "Missing"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-4">
            <Link
              href={completenessPct === 100 ? "/reports" : "/upload"}
              className={`w-full py-2.5 rounded-xl text-center text-xs font-bold uppercase tracking-widest transition-all duration-300 block cursor-pointer ${
                completenessPct === 100
                  ? "bg-gradient-to-r from-gt-green-500 to-gt-green-600 text-white shadow-[0_0_12px_rgba(34,197,94,0.3)] hover:opacity-90"
                  : "bg-bg-inset border border-border-subtle/10 text-text-secondary hover:text-text-primary hover:bg-bg-inset/80"
              }`}
              style={{
                boxShadow: completenessPct === 100 ? "none" : "var(--shadow-inset-xs)"
              }}
            >
              {completenessPct === 100 ? "Export SECR Report" : "Upload Missing Bills"}
            </Link>
          </div>
        </div>

        {/* Emissions by type with Interactive Tooltips & Premium Gradients */}
        <div
          className="lg:col-span-4 rounded-2xl p-4 lg:p-6 flex flex-col gap-4"
          style={{
            background: "var(--neu-base)",
            boxShadow: "var(--shadow-raised)",
            border: "var(--card-border)",
          }}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Emissions by Type
            </p>
            <span className="text-[8px] font-black uppercase tracking-widest text-text-muted px-2 py-0.5 rounded-md bg-bg-inset border border-border-subtle/5">
              Interactive
            </span>
          </div>

          <div className="flex-1 space-y-4">
            {byType.length === 0 && (
              <p className="text-sm text-center py-4 text-text-muted">No data yet</p>
            )}
            {byType.map(({ type, co2_kg }) => {
              const pct = totalCo2 > 0 ? (co2_kg / totalCo2) * 100 : 0;
              const gradient = TYPE_GRADIENTS[type] ?? "var(--brand-green)";
              const color = TYPE_COLORS[type] ?? "#6b7280";
              const icon = TYPE_ICONS[type] ?? <Leaf className="w-3.5 h-3.5" />;
              const tooltip = TYPE_TOOLTIPS[type] ?? (
                <div className="space-y-1 text-left">
                  <p style={{ color: "var(--brand-green)", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                    Carbon Footprint
                  </p>
                  <p className="text-text-secondary leading-normal font-semibold">
                    Emissions associated with your business operations. Upload invoices monthly to maintain real-time reporting.
                  </p>
                </div>
              );

              return (
                <div key={type} className="group">
                  <Tooltip content={tooltip} position="top" align="left" className="w-full cursor-help">
                    <div className="flex items-center justify-between text-xs mb-1.5 font-bold transition-colors group-hover:text-text-primary"
                      style={{ color: "var(--text-secondary)" }}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 shadow-sm border border-border-subtle/5"
                          style={{
                            background: "var(--bg-inset)",
                            color,
                          }}
                        >
                          {icon}
                        </div>
                        <span className="tracking-tight">{TYPE_LABELS[type] ?? type}</span>
                      </div>
                      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                        {co2_kg.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg · <span className="font-black text-text-secondary">{pct.toFixed(0)}%</span>
                      </span>
                    </div>
                  </Tooltip>
                  <div
                    className="w-full h-2 rounded-full overflow-hidden p-[1px]"
                    style={{
                      background: "var(--bg-inset)",
                      boxShadow: "var(--shadow-inset-xs)",
                    }}
                  >
                    <div className="h-full rounded-full transition-all duration-1000 shadow-sm animate-pulse-once"
                      style={{ width: `${pct}%`, background: gradient }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Insights (EcoPilot Advisor Personified) */}
        <div className="lg:col-span-3 rounded-2xl p-4 lg:p-5 flex flex-col gap-3"
          style={{
            background: "var(--neu-base)",
            boxShadow: "var(--shadow-raised)",
            border: "var(--card-border)",
          }}>
          {/* Pulsing AI Persona Header */}
          <div className="flex items-center gap-2.5 pb-3 border-b border-border-subtle/10">
            <div className="relative flex items-center justify-center shrink-0 w-6 h-6 rounded-full bg-gt-green-500/10">
              <span className="absolute w-2.5 h-2.5 rounded-full bg-gt-green-500 animate-ping" />
              <span className="w-2.5 h-2.5 rounded-full bg-gt-green-500 border border-white" style={{ filter: "drop-shadow(0 0 4px var(--brand-green))" }} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-text-primary leading-none">
                EcoPilot Advisor
              </p>
              <span className="text-[8px] font-bold text-gt-green-600 uppercase tracking-widest leading-none mt-1 block">
                • Online & Monitoring
              </span>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-3 justify-center">
            {insights.length === 0 && (
              <p className="text-xs text-center py-4 text-text-muted">Upload utility bills to allow the advisor to compile sustainability recommendations.</p>
            )}
            {insights.map((ins, i) => (
              <InsightCard key={i} insight={ins} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Actions ─────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "var(--text-muted)", opacity: 0.5 }}>
            Operational Launchpad
          </p>
          <div className="h-[1px] flex-1 bg-border-subtle/30 mx-4" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
          {[
            { label: "Upload Bill", href: "/upload", Icon: Upload, color: "var(--brand-green)", bg: "bg-gt-green-500/10" },
            { label: "Compare Periods", href: "/compare", Icon: Scale, color: "var(--brand-green-dark)", bg: "bg-gt-green-700/10" },
            { label: "Set Targets", href: "/targets", Icon: Target, color: "var(--brand-green-darker)", bg: "bg-gt-green-900/10" },
            { label: "Generate Report", href: "/reports", Icon: FileText, color: "var(--brand-green-dark)", bg: "bg-gt-green-600/10" },
            { label: "Manage Team", href: "/team", Icon: Users, color: "var(--text-secondary)", bg: "bg-bg-inset" },
          ].map(({ label, href, Icon, color, bg }, i) => (
            <Link
              key={href}
              href={href}
              className={`premium-card group relative overflow-hidden flex flex-col items-center gap-3 lg:gap-4 py-6 px-3 lg:py-8 lg:px-4 text-center border-none transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl${i === 4 ? " col-span-2 sm:col-span-1" : ""}`}
            >
              <div className={`w-11 h-11 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl ${bg} flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                <Icon className="w-5 h-5 lg:w-6 lg:h-6 transition-colors duration-500" style={{ color }} />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-[0.12em] lg:tracking-[0.15em] text-text-primary group-hover:text-gt-green-600 transition-colors leading-tight">
                  {label}
                </span>
                <div className="w-4 h-0.5 bg-gt-green-500 mx-auto rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </Link>
          ))}
        </div>
      </div>


    </div>
  );
}

/* ── Stat Card ───────────────────────────────────────────────── */
function StatCard({ label, value, unit, sub, icon, accent, tooltip, tooltipAlign = "center" }: {
  label: string; value: string; unit: string;
  sub: React.ReactNode; icon: React.ReactNode; accent: "green" | "orange";
  tooltip?: React.ReactNode;
  tooltipAlign?: "left" | "center" | "right";
}) {
  const accentColor = accent === "green" ? "var(--brand-green)" : "var(--brand-orange)";
  const iconColor = accent === "green" ? "var(--brand-green-dark)" : "var(--brand-orange-dark)";
  
  const valueEl = (
    <p className="text-xl lg:text-3xl font-black tracking-tight leading-none" style={{ color: "var(--text-primary)" }}>
      {value}
    </p>
  );

  return (
    <div
      className="rounded-2xl p-3.5 lg:p-5"
      style={{
        background: "var(--neu-base)",
        boxShadow: "var(--shadow-raised)",
        border: "var(--card-border)",
        borderTop: `3px solid ${accentColor}`,
      }}
    >
      <div className="flex items-center justify-between mb-2 lg:mb-3">
        <p className="text-[9px] lg:text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          {label}
        </p>
        <div
          className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: "var(--neu-base)",
            boxShadow: "var(--shadow-inset-sm)",
            color: iconColor,
          }}
        >
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        {tooltip ? (
          <Tooltip content={tooltip} position="top" align={tooltipAlign} className="cursor-help">
            {valueEl}
          </Tooltip>
        ) : (
          valueEl
        )}
        <p className="text-[10px] lg:text-xs font-bold" style={{ color: "var(--text-muted)" }}>{unit}</p>
      </div>
      <div className="text-[10px] lg:text-xs mt-1.5 lg:mt-2" style={{ color: "var(--text-muted)" }}>{sub}</div>
    </div>
  );
}

/* ── Insight Card ── */
function InsightCard({ insight }: {
  insight: { type: "success" | "warning" | "info"; title: string; body: string };
}) {
  const cfg = {
    success: { 
      Icon: CheckCircle, 
      color: "#22c55e", 
      bg: "rgba(34,197,94,0.06)", 
      border: "rgba(34,197,94,0.15)",
      glow: "0 4px 12px rgba(34,197,94,0.02)",
      action: (
        <a 
          href="#executive-row"
          className="inline-flex items-center gap-1 mt-1.5 text-[9px] font-black uppercase tracking-wider text-gt-green-600 hover:text-gt-green-700 transition-colors w-fit font-bold"
        >
          📈 View Targets <ArrowUpRight className="w-3 h-3" />
        </a>
      )
    },
    warning: { 
      Icon: AlertTriangle, 
      color: "#f97316", 
      bg: "rgba(249,115,22,0.06)", 
      border: "rgba(249,115,22,0.15)",
      glow: "0 4px 12px rgba(249,115,22,0.02)",
      action: (
        <Link 
          href="/history" 
          className="inline-flex items-center gap-1 mt-1.5 text-[9px] font-black uppercase tracking-wider text-gt-green-600 hover:text-gt-green-700 transition-colors w-fit font-bold"
        >
          🔍 Analyze Bills <ArrowUpRight className="w-3 h-3" />
        </Link>
      )
    },
    info: { 
      Icon: Lightbulb, 
      color: "#3b82f6", 
      bg: "rgba(59,130,246,0.06)", 
      border: "rgba(59,130,246,0.15)",
      glow: "0 4px 12px rgba(59,130,246,0.02)",
      action: (
        <Link 
          href="/upload" 
          className="inline-flex items-center gap-1 mt-1.5 text-[9px] font-black uppercase tracking-wider text-gt-green-600 hover:text-gt-green-700 transition-colors w-fit font-bold"
        >
          ⚡ Sync Invoices <ArrowUpRight className="w-3 h-3" />
        </Link>
      )
    },
  }[insight.type];

  return (
    <div
      className="rounded-xl p-3 flex flex-col gap-1.5 transition-all duration-300 hover:scale-[1.02]"
      style={{ 
        background: cfg.bg, 
        border: `1px solid ${cfg.border}`,
        boxShadow: cfg.glow,
      }}
    >
      <div className="flex items-start gap-2">
        <cfg.Icon className="w-3.5 h-3.5 shrink-0 mt-0.5 animate-pulse-once" style={{ color: cfg.color }} />
        <p className="text-xs font-bold leading-tight" style={{ color: "var(--text-primary)" }}>
          {insight.title}
        </p>
      </div>
      <p className="text-[11px] leading-relaxed text-text-secondary">
        {insight.body}
      </p>
      {cfg.action}
    </div>
  );
}
