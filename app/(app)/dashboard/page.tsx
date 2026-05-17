import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  TrendingDown, Zap, Flame, Fuel, BarChart3,
  ArrowUpRight, ArrowDownRight,
  Upload, FileText, Users, Scale, Target,
  Lightbulb, AlertTriangle, CheckCircle, Leaf,
} from "lucide-react";
import DashboardCharts from "./DashboardCharts";
import { BudgetRing } from "./BudgetRing";
import { PeriodComparison } from "./PeriodComparison";

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
  electricity: "#22c55e", gas: "#16a34a", water: "#4ade80",
  fuel_diesel: "#15803d", fuel_petrol: "#14532d",
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
    insights.push({
      type: "info",
      title: `${(projected / 1000).toFixed(1)} tCO₂e projected this year`,
      body: `Based on your monthly average of ${monthlyAvg.toFixed(0)} kg. Set a target to reduce it.`,
    });
  }

  /* ── Bills slim (for client PeriodComparison) ────────────────── */
  const billsSlim = bills.map(({ bill_date, co2_kg, usage_amount, usage_unit, cost_gbp }) => ({
    bill_date, co2_kg, usage_amount, usage_unit, cost_gbp,
  }));

  const recentBills = bills.slice(0, 5);

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

      {/* ── 5 Stat cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
        <StatCard
          label="Total CO₂"
          value={`${(totalCo2 / 1000).toFixed(2)}`}
          unit="tCO₂e"
          sub="All time tracked"
          icon={<TrendingDown className="w-4 h-4" />}
          accent="green"
        />
        <StatCard
          label="This Month"
          value={`${(thisMonthCo2 / 1000).toFixed(3)}`}
          unit="tCO₂e"
          sub={
            <span className="flex items-center gap-1" style={{ color: trendDown ? "var(--brand-green)" : "var(--brand-orange)" }}>
              {trendDown ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
              {Math.abs(Number(trendPct))}% vs last month
            </span>
          }
          icon={<Zap className="w-4 h-4" />}
          accent="green"
        />
        <StatCard
          label="Monthly Avg"
          value={`${monthlyAvg.toFixed(0)}`}
          unit="kg / mo"
          sub={`Over ${distinctMonths} billing months`}
          icon={<BarChart3 className="w-4 h-4" />}
          accent="green"
        />
        <StatCard
          label="Total Energy"
          value={`${Math.round(totalKwh).toLocaleString()}`}
          unit="kWh"
          sub="Electricity + Gas"
          icon={<Flame className="w-4 h-4" />}
          accent="green"
        />
        <div className="col-span-2 sm:col-span-1">
          <StatCard
            label="Equivalent To"
            value={`${milesDriven.toLocaleString()}`}
            unit="miles"
            sub="Avg petrol car driven"
            icon={<Fuel className="w-4 h-4" />}
            accent="green"
          />
        </div>
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
          <p className="text-xs font-bold uppercase tracking-widest mb-4"
            style={{ color: "var(--text-muted)" }}>
            Monthly CO₂ Emissions (6 months)
          </p>
          <DashboardCharts monthlyChart={monthlyChart} byType={byType} totalCo2={totalCo2} chartOnly="co2" />
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
          <BudgetRing thisMonthCo2={thisMonthCo2} monthlyAvg={monthlyAvg} />
        </div>
      </div>

      {/* ── Row: Period Comparison + Emissions Breakdown + AI ────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 lg:gap-4">

        {/* Period Comparison */}
        <div
          className="md:col-span-2 lg:col-span-5 rounded-2xl p-4 lg:p-6"
          style={{
            background: "var(--neu-base)",
            boxShadow: "var(--shadow-raised)",
            border: "var(--card-border)",
          }}
        >
          <PeriodComparison bills={billsSlim} />
        </div>

        {/* Emissions by type */}
        <div
          className="lg:col-span-4 rounded-2xl p-4 lg:p-6 flex flex-col gap-4"
          style={{
            background: "var(--neu-base)",
            boxShadow: "var(--shadow-raised)",
            border: "var(--card-border)",
          }}
        >
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            Emissions by Type
          </p>
          <div className="flex-1 space-y-3">
            {byType.length === 0 && (
              <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>No data yet</p>
            )}
            {byType.map(({ type, co2_kg }) => {
              const pct = totalCo2 > 0 ? (co2_kg / totalCo2) * 100 : 0;
              const color = TYPE_COLORS[type] ?? "#6b7280";
              return (
                <div key={type}>
                  <div className="flex justify-between text-xs mb-1.5 font-semibold"
                    style={{ color: "var(--text-secondary)" }}>
                    <span>{TYPE_LABELS[type] ?? type}</span>
                    <span style={{ color: "var(--text-muted)" }}>{co2_kg.toFixed(1)} kg · {pct.toFixed(0)}%</span>
                  </div>
                  <div
                    className="w-full h-2 rounded-full overflow-hidden"
                    style={{
                      background: "var(--neu-base)",
                      boxShadow: "var(--shadow-inset-xs)",
                    }}
                  >
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Insights */}
        <div className="lg:col-span-3 rounded-2xl p-4 lg:p-5 flex flex-col gap-3"
          style={{
            background: "var(--neu-base)",
            boxShadow: "var(--shadow-raised)",
            border: "var(--card-border)",
          }}>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            AI Insights
          </p>
          {insights.length === 0 && (
            <p className="text-xs text-center py-4" style={{ color: "var(--text-muted)" }}>Upload bills to get insights</p>
          )}
          {insights.map((ins, i) => (
            <InsightCard key={i} insight={ins} />
          ))}
        </div>
      </div>

      {/* ── Energy consumption chart (full width, inset well) ───── */}
      <div
        className="rounded-2xl p-4 lg:p-6 min-h-[220px] lg:min-h-[300px]"
        style={{
          background: "var(--neu-base)",
          boxShadow: "var(--shadow-inset)",
          border: "var(--card-border)",
        }}
      >
        <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>
          Monthly Energy Consumption (kWh)
        </p>
        <DashboardCharts monthlyChart={monthlyChart} byType={byType} totalCo2={totalCo2} chartOnly="energy" />
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
//            { label: "Generate Report", href: "/reports", Icon: FileText, color: "var(--brand-green-dark)", bg: "bg-gt-green-600/10" },
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
function StatCard({ label, value, unit, sub, icon, accent }: {
  label: string; value: string; unit: string;
  sub: React.ReactNode; icon: React.ReactNode; accent: "green" | "orange";
}) {
  const accentColor = accent === "green" ? "var(--brand-green)" : "var(--brand-orange)";
  const iconColor = accent === "green" ? "var(--brand-green-dark)" : "var(--brand-orange-dark)";
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
        <p className="text-xl lg:text-3xl font-black tracking-tight leading-none" style={{ color: "var(--text-primary)" }}>
          {value}
        </p>
        <p className="text-[10px] lg:text-xs font-bold" style={{ color: "var(--text-muted)" }}>{unit}</p>
      </div>
      <div className="text-[10px] lg:text-xs mt-1.5 lg:mt-2" style={{ color: "var(--text-muted)" }}>{sub}</div>
    </div>
  );
}

/* ── Insight Card ────────────────────────────────────────────── */
function InsightCard({ insight }: {
  insight: { type: "success" | "warning" | "info"; title: string; body: string };
}) {
  const cfg = {
    success: { Icon: CheckCircle, color: "#22c55e", bg: "rgba(34,197,94,0.10)" },
    warning: { Icon: AlertTriangle, color: "#16a34a", bg: "rgba(22,163,74,0.10)" },
    info: { Icon: Lightbulb, color: "#4ade80", bg: "rgba(74,222,128,0.10)" },
  }[insight.type];

  return (
    <div
      className="rounded-xl p-3 flex flex-col gap-1.5"
      style={{ background: cfg.bg, border: `1px solid ${cfg.color}25` }}
    >
      <div className="flex items-start gap-2">
        <cfg.Icon className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: cfg.color }} />
        <p className="text-xs font-bold leading-tight" style={{ color: "var(--text-primary)" }}>
          {insight.title}
        </p>
      </div>
      <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
        {insight.body}
      </p>
    </div>
  );
}
