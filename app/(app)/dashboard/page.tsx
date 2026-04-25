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
import NoOrgState from "@/components/NoOrgState";
import { BudgetRing } from "./BudgetRing";
import { PeriodComparison } from "./PeriodComparison";

/* ── Constants ───────────────────────────────────────────────── */
const TYPE_LABELS: Record<string, string> = {
  electricity: "Electricity", gas: "Gas", water: "Water",
  fuel_diesel: "Diesel",      fuel_petrol: "Petrol",
};
const BADGE_STYLES: Record<string, { bg: string; text: string }> = {
  electricity: { bg: "rgba(34,197,94,0.12)",  text: "var(--brand-green-dark)" },
  gas:         { bg: "rgba(59,130,246,0.12)", text: "#2563eb" },
  water:       { bg: "rgba(6,182,212,0.12)",  text: "#0891b2" },
  fuel_diesel: { bg: "rgba(249,115,22,0.12)", text: "var(--brand-orange-dark)" },
  fuel_petrol: { bg: "rgba(249,115,22,0.12)", text: "var(--brand-orange-dark)" },
};
const TYPE_COLORS: Record<string, string> = {
  electricity: "#22c55e", gas: "#3b82f6", water: "#06b6d4",
  fuel_diesel: "#f59e0b", fuel_petrol: "#f97316",
};

/* ── Page ─────────────────────────────────────────────────────── */
export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, organisations(name)")
    .eq("id", user.id)
    .single();

  if (!profile?.org_id) return <NoOrgState />;

  const org = (
    Array.isArray(profile.organisations) ? profile.organisations[0] : profile.organisations
  ) as { name: string } | null;
  const orgName = org?.name ?? "Your Organisation";

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

  const { data: billsData } = await supabase
    .from("bills")
    .select("id,bill_type,bill_date,usage_amount,usage_unit,co2_kg,cost_gbp,supplier,created_at")
    .eq("org_id", profile.org_id)
    .gte("bill_date", twelveMonthsAgo.toISOString().slice(0, 10))
    .order("bill_date", { ascending: false });

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

  const now           = new Date();
  const thisMonthStr  = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStr  = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}`;

  const thisMonthCo2 = bills.filter((b) => b.bill_date?.startsWith(thisMonthStr))
                            .reduce((s, b) => s + (b.co2_kg ?? 0), 0);
  const lastMonthCo2 = bills.filter((b) => b.bill_date?.startsWith(lastMonthStr))
                            .reduce((s, b) => s + (b.co2_kg ?? 0), 0);

  const trendPct  = lastMonthCo2 > 0
    ? (((thisMonthCo2 - lastMonthCo2) / lastMonthCo2) * 100).toFixed(1)
    : "0";
  const trendDown = thisMonthCo2 <= lastMonthCo2;

  /* Monthly average over distinct billing months */
  const distinctMonths = new Set(bills.map((b) => b.bill_date?.slice(0, 7))).size;
  const monthlyAvg     = distinctMonths > 0 ? totalCo2 / distinctMonths : 0;

  const milesDriven = Math.round(totalCo2 / 0.255);

  /* ── Chart data ─────────────────────────────────────────────── */
  const monthlyMap: Record<string, { co2: number; kwh: number; __label?: string }> = {};
  for (let i = 5; i >= 0; i--) {
    const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
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
    co2:   Math.round(v.co2 * 10) / 10,
    kwh:   Math.round(v.kwh),
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
      type:  "warning",
      title: `${TYPE_LABELS[top.type] ?? top.type} is your top source`,
      body:  `${pct}% of all emissions — consider switching to a lower-carbon alternative.`,
    });
  }
  if (lastMonthCo2 > 0) {
    const isDown = thisMonthCo2 <= lastMonthCo2;
    insights.push({
      type:  isDown ? "success" : "warning",
      title: isDown ? `↓ ${Math.abs(Number(trendPct))}% reduction this month` : `↑ ${Math.abs(Number(trendPct))}% increase this month`,
      body:  isDown
        ? "Great progress — keep up the efficiency gains."
        : "Emissions rose vs last month. Review energy usage.",
    });
  }
  const projected = monthlyAvg * 12;
  if (projected > 0) {
    insights.push({
      type:  "info",
      title: `${(projected / 1000).toFixed(1)} tCO₂e projected this year`,
      body:  `Based on your monthly average of ${monthlyAvg.toFixed(0)} kg. Set a target to reduce it.`,
    });
  }

  /* ── Bills slim (for client PeriodComparison) ────────────────── */
  const billsSlim = bills.map(({ bill_date, co2_kg, usage_amount, usage_unit, cost_gbp }) => ({
    bill_date, co2_kg, usage_amount, usage_unit, cost_gbp,
  }));

  const recentBills = bills.slice(0, 5);

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Leaf className="w-5 h-5" style={{ color: "var(--brand-green)" }} />
            <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
              Carbon Dashboard
            </h1>
          </div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Overview for{" "}
            <span style={{ color: "var(--text-brand)", fontWeight: 700 }}>{orgName}</span>
          </p>
        </div>

        <div
          className="neu-raised inline-flex items-center gap-2 px-4 py-2 rounded-xl"
          style={{ color: "var(--brand-green-dark)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-gt-green-500 animate-pulse-green inline-block" />
          <span className="text-xs font-bold uppercase tracking-widest">2025 DEFRA Active</span>
        </div>
      </div>

      {/* ── 5 Stat cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-5 gap-4">
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
          accent="orange"
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
          accent="orange"
        />
        <StatCard
          label="Equivalent To"
          value={`${milesDriven.toLocaleString()}`}
          unit="miles"
          sub="Avg petrol car driven"
          icon={<Fuel className="w-4 h-4" />}
          accent="green"
        />
      </div>

      {/* ── Row: CO₂ trend chart + Budget Ring ───────────────────── */}
      <div className="grid grid-cols-12 gap-4">
        {/* Chart in a deep inset well */}
        <div
          className="col-span-8 rounded-2xl p-6"
          style={{
            background: "var(--neu-base)",
            boxShadow:  "var(--shadow-inset)",
            border:     "var(--card-border)",
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
          className="col-span-4 rounded-2xl p-6"
          style={{
            background: "var(--neu-base)",
            boxShadow:  "var(--shadow-raised)",
            border:     "var(--card-border)",
          }}
        >
          <BudgetRing thisMonthCo2={thisMonthCo2} monthlyAvg={monthlyAvg} />
        </div>
      </div>

      {/* ── Row: Period Comparison + Emissions Breakdown + AI ────── */}
      <div className="grid grid-cols-12 gap-4">

        {/* Period Comparison */}
        <div
          className="col-span-5 rounded-2xl p-6"
          style={{
            background: "var(--neu-base)",
            boxShadow:  "var(--shadow-raised)",
            border:     "var(--card-border)",
          }}
        >
          <PeriodComparison bills={billsSlim} />
        </div>

        {/* Emissions by type */}
        <div
          className="col-span-4 rounded-2xl p-6 flex flex-col gap-4"
          style={{
            background: "var(--neu-base)",
            boxShadow:  "var(--shadow-raised)",
            border:     "var(--card-border)",
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
              const pct   = totalCo2 > 0 ? (co2_kg / totalCo2) * 100 : 0;
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
                      boxShadow:  "var(--shadow-inset-xs)",
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
        <div className="col-span-3 rounded-2xl p-5 flex flex-col gap-3"
             style={{
               background: "var(--neu-base)",
               boxShadow:  "var(--shadow-raised)",
               border:     "var(--card-border)",
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
        className="rounded-2xl p-6"
        style={{
          background: "var(--neu-base)",
          boxShadow:  "var(--shadow-inset)",
          border:     "var(--card-border)",
        }}
      >
        <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>
          Monthly Energy Consumption (kWh)
        </p>
        <DashboardCharts monthlyChart={monthlyChart} byType={byType} totalCo2={totalCo2} chartOnly="energy" />
      </div>

      {/* ── Quick Actions ─────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
          Quick Actions
        </p>
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: "Upload Bill",     href: "/upload",   Icon: Upload,   accent: "var(--brand-green)" },
            { label: "Compare Periods", href: "/compare",  Icon: Scale,    accent: "var(--brand-green-dark)" },
            { label: "Set Targets",     href: "/targets",  Icon: Target,   accent: "var(--brand-orange)" },
            { label: "Generate Report", href: "/reports",  Icon: FileText, accent: "var(--brand-orange-dark)" },
            { label: "Manage Team",     href: "/team",     Icon: Users,    accent: "var(--text-secondary)" },
          ].map(({ label, href, Icon, accent }) => (
            <Link
              key={href}
              href={href}
              className="neu-btn flex flex-col items-center gap-2 py-4 px-3 rounded-2xl text-center"
              style={{ color: "var(--text-secondary)" }}
            >
              <Icon className="w-5 h-5" style={{ color: accent }} />
              <span className="text-[11px] font-semibold leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Recent Bills ─────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: "var(--neu-base)",
          boxShadow:  "var(--shadow-raised)",
          border:     "var(--card-border)",
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            Recent Bills
          </p>
          <Link
            href="/history"
            className="neu-btn px-3 py-1.5 text-xs font-bold rounded-lg"
            style={{ color: "var(--brand-green-dark)" }}
          >
            View all →
          </Link>
        </div>

        {recentBills.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>No bills yet</p>
            <Link href="/upload" className="neu-btn px-4 py-2 text-sm font-bold rounded-xl"
                  style={{ color: "var(--brand-green-dark)" }}>
              Upload your first bill →
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
                {["Type", "Date", "Supplier", "Usage", "CO₂e"].map((h, i) => (
                  <th
                    key={h}
                    className={`pb-3 text-xs font-bold uppercase tracking-widest ${i > 1 ? "text-right" : "text-left"}`}
                    style={{ color: "var(--text-muted)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentBills.map((bill) => {
                const bs = BADGE_STYLES[bill.bill_type] ?? { bg: "rgba(0,0,0,0.06)", text: "var(--text-muted)" };
                return (
                  <tr key={bill.id} className="group">
                    <td className="py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                            style={{ background: bs.bg, color: bs.text }}>
                        {TYPE_LABELS[bill.bill_type] ?? bill.bill_type}
                      </span>
                    </td>
                    <td className="py-3 text-xs" style={{ color: "var(--text-muted)" }}>{bill.bill_date}</td>
                    <td className="py-3 text-xs text-right" style={{ color: "var(--text-muted)" }}>
                      {bill.supplier ?? "—"}
                    </td>
                    <td className="py-3 text-xs text-right" style={{ color: "var(--text-secondary)" }}>
                      {bill.usage_amount} {bill.usage_unit}
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-sm font-black" style={{ color: "var(--text-primary)" }}>
                        {bill.co2_kg} kg
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ── Stat Card ───────────────────────────────────────────────── */
function StatCard({ label, value, unit, sub, icon, accent }: {
  label:  string; value: string; unit: string;
  sub:    React.ReactNode; icon: React.ReactNode; accent: "green" | "orange";
}) {
  const accentColor = accent === "green" ? "var(--brand-green)" : "var(--brand-orange)";
  const iconColor   = accent === "green" ? "var(--brand-green-dark)" : "var(--brand-orange-dark)";
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: "var(--neu-base)",
        boxShadow:  "var(--shadow-raised)",
        border:     "var(--card-border)",
        borderTop:  `3px solid ${accentColor}`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          {label}
        </p>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: "var(--neu-base)",
            boxShadow:  "var(--shadow-inset-sm)",
            color: iconColor,
          }}
        >
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <p className="text-3xl font-black tracking-tight leading-none" style={{ color: "var(--text-primary)" }}>
          {value}
        </p>
        <p className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>{unit}</p>
      </div>
      <div className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>{sub}</div>
    </div>
  );
}

/* ── Insight Card ────────────────────────────────────────────── */
function InsightCard({ insight }: {
  insight: { type: "success" | "warning" | "info"; title: string; body: string };
}) {
  const cfg = {
    success: { Icon: CheckCircle,   color: "#22c55e", bg: "rgba(34,197,94,0.10)"  },
    warning: { Icon: AlertTriangle, color: "#f97316", bg: "rgba(249,115,22,0.10)" },
    info:    { Icon: Lightbulb,     color: "#3b82f6", bg: "rgba(59,130,246,0.10)"  },
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
