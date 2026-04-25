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
          className="col-span-8 rounded-2xl p-6 min-h-[350px]"
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
        className="rounded-2xl p-6 min-h-[300px]"
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
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "var(--text-muted)", opacity: 0.5 }}>
            Operational Launchpad
          </p>
          <div className="h-[1px] flex-1 bg-border-subtle/30 mx-4" />
        </div>
        
        <div className="grid grid-cols-5 gap-4">
          {[
            { label: "Upload Bill",     href: "/upload",   Icon: Upload,   color: "var(--brand-green)", bg: "bg-gt-green-500/10" },
            { label: "Compare Periods", href: "/compare",  Icon: Scale,    color: "var(--brand-green-dark)", bg: "bg-gt-green-700/10" },
            { label: "Set Targets",     href: "/targets",  Icon: Target,   color: "var(--brand-orange)", bg: "bg-brand-orange/10" },
            { label: "Generate Report", href: "/reports",  Icon: FileText, color: "var(--brand-orange-dark)", bg: "bg-brand-orange-dark/10" },
            { label: "Manage Team",     href: "/team",     Icon: Users,    color: "var(--text-secondary)", bg: "bg-bg-inset" },
          ].map(({ label, href, Icon, color, bg }) => (
            <Link
              key={href}
              href={href}
              className="premium-card group relative overflow-hidden flex flex-col items-center gap-4 py-8 px-4 text-center border-none transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
            >
              <div className={`w-14 h-14 rounded-2xl ${bg} flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                <Icon className="w-6 h-6 transition-colors duration-500" style={{ color }} />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-text-primary group-hover:text-gt-green-600 transition-colors">
                  {label}
                </span>
                <div className="w-4 h-0.5 bg-gt-green-500 mx-auto rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0" />
              </div>
              
              {/* Decorative background glow on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </Link>
          ))}
        </div>
      </div>

      {/* ── Recent Bills ─────────────────────────────────────────── */}
      <div className="premium-card border-none overflow-hidden shadow-2xl">
        <div className="px-8 py-6 border-b border-border-subtle/30 bg-bg-inset/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-gt-green-500 animate-pulse" />
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Ledger Activity</p>
          </div>
          <Link
            href="/history"
            className="px-4 py-2 rounded-xl bg-bg-inset hover:bg-white hover:shadow-lg text-[9px] font-black uppercase tracking-widest text-text-primary transition-all flex items-center gap-2"
          >
            Archive Access <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="p-2">
          {recentBills.length === 0 ? (
            <div className="relative py-24 px-8 overflow-hidden rounded-2xl bg-bg-inset/20 flex flex-col items-center text-center">
              {/* Background abstract element */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gt-green-500/5 rounded-full blur-[80px] pointer-events-none" />
              
              <div className="relative z-10 space-y-6 max-w-sm">
                <div className="w-20 h-20 bg-white shadow-premium rounded-3xl mx-auto flex items-center justify-center animate-bounce-slow">
                   <Upload className="w-8 h-8 text-gt-green-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-black text-text-primary uppercase tracking-widest">Repository Vacant</h3>
                  <p className="text-xs font-bold text-text-muted opacity-60 leading-relaxed">
                    Begin your decarbonization audit by synchronizing your first energy utility statement.
                  </p>
                </div>
                <Link 
                  href="/upload" 
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gt-green-600 transition-all hover:scale-105 shadow-xl shadow-black/20"
                >
                  Initialize First Audit <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] font-black uppercase tracking-widest text-text-muted opacity-40">
                    <th className="px-8 py-4 text-left font-black">Instrument</th>
                    <th className="px-6 py-4 text-left font-black">Date</th>
                    <th className="px-6 py-4 text-left font-black">Vendor</th>
                    <th className="px-6 py-4 text-right font-black">Consumption</th>
                    <th className="px-8 py-4 text-right font-black">Carbon Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/20">
                  {recentBills.map((bill) => {
                    const bs = BADGE_STYLES[bill.bill_type] ?? { bg: "rgba(0,0,0,0.06)", text: "var(--text-muted)" };
                    return (
                      <tr key={bill.id} className="group hover:bg-bg-inset/30 transition-all duration-300">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                               {bill.bill_type === 'electricity' ? <Zap className="w-4 h-4 text-gt-green-500" /> : <Flame className="w-4 h-4 text-brand-orange" />}
                             </div>
                             <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: bs.text }}>
                               {TYPE_LABELS[bill.bill_type] ?? bill.bill_type}
                             </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                           <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest">{bill.bill_date}</p>
                        </td>
                        <td className="px-6 py-5">
                           <p className="text-[10px] font-black text-text-primary uppercase tracking-tighter opacity-60">
                             {bill.supplier ?? "Verified Protocol"}
                           </p>
                        </td>
                        <td className="px-6 py-5 text-right">
                           <div className="flex flex-col items-end">
                              <span className="text-xs font-black text-text-primary tracking-tight">{bill.usage_amount.toLocaleString()}</span>
                              <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest opacity-40">{bill.usage_unit}</span>
                           </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                           <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gt-green-500/5 border border-gt-green-500/10">
                              <span className="text-sm font-black text-gt-green-700 tracking-tighter">
                                {bill.co2_kg} <span className="text-[10px] opacity-40 font-bold uppercase tracking-widest ml-1">kg</span>
                              </span>
                           </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
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
