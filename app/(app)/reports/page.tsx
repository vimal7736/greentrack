"use client";
import { useState } from "react";
import {
  FileText, Download, TrendingDown, TrendingUp,
  Zap, Leaf, CheckCircle, Calendar, ChevronDown,
  Target, Banknote, Activity, Shield,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";
import { PageLayout }  from "@/components/ui/PageLayout";
import { ChartCard }   from "@/components/ui/ChartCard";
import { useFetch }    from "@/hooks/useFetch";
import {
  BILL_TYPE_LABELS,
  BILL_TYPE_COLORS,
  SCOPE_LABELS,
} from "@/lib/carbon/constants";
import {
  CHART_AXIS_TICK,
  CHART_TOOLTIP_STYLE,
  CHART_CURSOR,
} from "@/lib/chart/config";
import type { ReportSummary } from "@/types";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS        = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

const SCOPE_CFG = {
  scope1: { label: "Scope 1", sub: "Direct — Gas & Fleet",      color: "#f97316" },
  scope2: { label: "Scope 2", sub: "Indirect — Electricity",    color: "#22c55e" },
  scope3: { label: "Scope 3", sub: "Associated — Water",        color: "#06b6d4" },
} as const;

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmtGbp(n: number) {
  return `£${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function ReportsPage() {
  const [isYearOpen, setIsYearOpen] = useState(false);
  const [year, setYear]             = useState(String(CURRENT_YEAR));

  const { data: summary, loading, error } = useFetch<ReportSummary>(
    `/api/reports/summary?year=${year}`
  );

  const isFreePlan = summary?.org.tier === "free";

  // Budget
  const cap           = summary?.target?.annual_carbon_cap_kg ?? 0;
  const actual        = summary?.total_co2_kg ?? 0;
  const budgetUsedPct = cap > 0 ? (actual / cap) * 100 : 0;
  const isOverBudget  = cap > 0 && actual > cap;
  const remaining     = cap - actual;

  // Year-over-year
  const prevCo2   = summary?.prev_year_co2  ?? 0;
  const prevCost  = summary?.prev_year_cost ?? 0;
  const currCost  = summary?.total_cost_gbp ?? 0;
  const yoyPct    = prevCo2 > 0 ? ((actual - prevCo2) / prevCo2) * 100 : null;
  const yoyCostPct= prevCost > 0 ? ((currCost - prevCost) / prevCost) * 100 : null;

  // Monthly target line
  const monthlyTarget = cap > 0 ? cap / 12 : null;

  // SECR month coverage — which of the 12 by_month slots have co2 > 0
  const monthsHaveData = (summary?.by_month ?? []).map((m) => m.co2 > 0);
  const monthsWithData = summary?.months_with_data ?? 0;

  /* ── Year selector + export button ── */
  const headerRight = (
    <div className="flex items-center gap-3">
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsYearOpen((v) => !v)}
          className="neu-btn rounded-xl px-4 py-2.5 flex items-center gap-2 group transition-all active:scale-95"
        >
          <Calendar className="w-3.5 h-3.5 text-text-muted group-hover:text-gt-green-500 transition-colors" />
          <span className="text-[10px] font-black uppercase tracking-widest text-text-primary">
            {year} Fiscal
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-text-muted transition-transform duration-300 ${isYearOpen ? "rotate-180" : ""}`}
          />
        </button>

        {isYearOpen && (
          <div className="absolute top-full left-0 mt-2 z-50">
            <div
              className="animate-scale-in border shadow-2xl p-2 rounded-2xl w-44"
              style={{ background: "var(--bg-elevated)", borderColor: "var(--border-default)" }}
            >
              {YEARS.map((y) => (
                <button
                  key={y}
                  onClick={() => { setYear(String(y)); setIsYearOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    year === String(y)
                      ? "bg-gt-green-600 text-white"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                  style={year !== String(y) ? { background: "transparent" } : {}}
                >
                  {y} Fiscal
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        disabled={isFreePlan || loading}
        onClick={() => window.open(`/api/reports/print?year=${year}`, "_blank")}
        className="group relative px-5 py-2.5 rounded-xl bg-gt-green-900 text-white text-[10px] font-black uppercase tracking-widest transition-all hover:bg-black disabled:opacity-30 flex items-center gap-2 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-gt-green-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <Download className="w-4 h-4 relative z-10" />
        <span className="hidden sm:inline relative z-10">Export PDF</span>
      </button>
    </div>
  );

  return (
    <PageLayout
      icon={<FileText className="w-5 h-5" />}
      title="Reports & Analytics"
      subtitle="SECR-ready compliance data, carbon budgets, and environmental impact summaries"
      headerRight={headerRight}
      error={error}
    >
      {/* Close year dropdown on outside click */}
      {isYearOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsYearOpen(false)} />
      )}

      {/* ── FREE PLAN BANNER ─────────────────────────────────────────────────── */}
      {isFreePlan && (
        <div
          className="premium-card p-6 overflow-hidden relative group border-none"
          style={{ background: "linear-gradient(135deg, var(--color-gt-green-900), #0a0a0a)" }}
        >
          <div className="absolute top-0 right-0 p-8 opacity-[0.07] group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700 pointer-events-none">
            <Zap className="w-32 h-32 text-white" />
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-black tracking-tight text-white">Unlock Full SECR Reporting</h3>
              <p className="text-xs font-bold text-white/50 max-w-md leading-relaxed">
                Your plan only supports on-screen analytics. Upgrade to export
                fully compliant PDF reports for your board and stakeholders.
              </p>
            </div>
            <a
              href="/billing"
              className="self-start sm:self-auto shrink-0 px-6 py-2.5 rounded-xl bg-gt-green-500 hover:bg-white hover:text-black text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Upgrade Now
            </a>
          </div>
        </div>
      )}

      {/* ── EXECUTIVE SUMMARY — 4 stat cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Footprint */}
        <div className="premium-card p-4 sm:p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">Total Footprint</p>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(34,197,94,0.12)", color: "var(--brand-green)" }}>
              <Leaf className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black tracking-tighter leading-none text-text-primary">
              {loading ? "—" : ((actual) / 1000).toFixed(3)}
              <span className="text-xs opacity-40 font-bold ml-1">tCO₂e</span>
            </p>
            <p className="text-[9px] font-bold text-text-muted mt-1.5 opacity-60">
              {summary?.bill_count ?? 0} bills audited
            </p>
          </div>
        </div>

        {/* Total Spend */}
        <div className="premium-card p-4 sm:p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">Total Spend</p>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(59,130,246,0.12)", color: "#3b82f6" }}>
              <Banknote className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black tracking-tighter leading-none text-text-primary">
              {loading ? "—" : fmtGbp(currCost)}
            </p>
            <p className="text-[9px] font-bold text-text-muted mt-1.5 opacity-60">
              {(summary?.total_kwh ?? 0).toLocaleString("en-GB")} kWh consumed
            </p>
          </div>
        </div>

        {/* Year-over-Year */}
        <div className="premium-card p-4 sm:p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">vs Last Year</p>
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                background: yoyPct !== null && yoyPct < 0 ? "rgba(34,197,94,0.12)" : "rgba(249,115,22,0.12)",
                color:      yoyPct !== null && yoyPct < 0 ? "var(--brand-green)"    : "#f97316",
              }}
            >
              {yoyPct !== null && yoyPct < 0
                ? <TrendingDown className="w-3.5 h-3.5" />
                : <TrendingUp   className="w-3.5 h-3.5" />}
            </div>
          </div>
          <div>
            <p
              className="text-xl sm:text-2xl font-black tracking-tighter leading-none"
              style={{
                color: loading || yoyPct === null
                  ? "var(--text-primary)"
                  : yoyPct < 0 ? "var(--brand-green)" : "#f97316",
              }}
            >
              {loading ? "—" : yoyPct === null ? "N/A" : `${yoyPct >= 0 ? "+" : ""}${yoyPct.toFixed(1)}%`}
            </p>
            <p className="text-[9px] font-bold text-text-muted mt-1.5 opacity-60">
              {prevCo2 > 0
                ? `${(prevCo2 / 1000).toFixed(2)}t in ${Number(year) - 1}`
                : "No prior year data"}
            </p>
          </div>
        </div>

        {/* Budget Status */}
        <div className="premium-card p-4 sm:p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">Budget Status</p>
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                background: cap === 0 ? "rgba(113,113,113,0.12)" : isOverBudget ? "rgba(249,115,22,0.12)" : "rgba(34,197,94,0.12)",
                color:      cap === 0 ? "var(--text-muted)"       : isOverBudget ? "#f97316"              : "var(--brand-green)",
              }}
            >
              <Target className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <p
              className="text-xl sm:text-2xl font-black tracking-tighter leading-none"
              style={{
                color: cap === 0 ? "var(--text-muted)" : isOverBudget ? "#f97316" : "var(--brand-green)",
              }}
            >
              {loading ? "—" : cap > 0 ? `${budgetUsedPct.toFixed(0)}%` : "—"}
              {cap > 0 && <span className="text-xs opacity-40 font-bold ml-1">of cap</span>}
            </p>
            <p className="text-[9px] font-bold text-text-muted mt-1.5 opacity-60">
              {cap > 0
                ? isOverBudget
                  ? `${Math.abs(remaining).toFixed(0)} kg over budget`
                  : `${remaining.toFixed(0)} kg remaining`
                : "No target set"}
            </p>
          </div>
        </div>
      </div>

      {/* ── CARBON BUDGET TRACKER ────────────────────────────────────────────── */}
      {summary?.target && (
        <div className="premium-card p-5 sm:p-6 space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted">
                Carbon Budget Tracker
              </h3>
              <p className="text-sm font-black text-text-primary mt-1">
                Annual cap: {(cap / 1000).toFixed(2)} tCO₂e
                <span className="text-[10px] font-bold text-text-muted ml-2 opacity-50">
                  · SBTi {summary.target.sbti_pathway.toUpperCase()} pathway
                  {summary.target.net_zero_target_year
                    ? ` · Net zero by ${summary.target.net_zero_target_year}`
                    : ""}
                </span>
              </p>
            </div>
            <div
              className={`self-start sm:self-auto px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                isOverBudget
                  ? "bg-orange-500/10 text-orange-600 border-orange-500/25"
                  : "bg-gt-green-500/10 text-gt-green-700 border-gt-green-500/20"
              }`}
            >
              {isOverBudget ? "Over Budget" : "On Track"}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-text-muted">
              <span>0 kg</span>
              <span>{actual.toLocaleString("en-GB")} kg used</span>
              <span>{cap.toLocaleString("en-GB")} kg cap</span>
            </div>

            {/* Track */}
            <div
              className="h-4 rounded-full overflow-hidden"
              style={{ background: "var(--bg-inset)", boxShadow: "var(--shadow-inset-xs)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(budgetUsedPct, 100)}%`,
                  background: isOverBudget
                    ? "linear-gradient(90deg, #f97316, #ef4444)"
                    : "linear-gradient(90deg, var(--brand-green), var(--brand-green-dark))",
                  boxShadow: isOverBudget
                    ? "0 0 12px rgba(249,115,22,0.35)"
                    : "0 0 12px rgba(34,197,94,0.35)",
                }}
              />
            </div>

            <div className="flex justify-between items-center">
              <p className="text-[9px] font-bold text-text-muted opacity-50">
                {budgetUsedPct.toFixed(1)}% consumed
              </p>
              <p
                className="text-[9px] font-black uppercase tracking-widest"
                style={{ color: isOverBudget ? "#f97316" : "var(--brand-green)" }}
              >
                {isOverBudget
                  ? `${Math.abs(remaining).toFixed(0)} kg over`
                  : `${remaining.toFixed(0)} kg remaining`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── MONTHLY TREND + SCOPE BREAKDOWN ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        {/* Monthly chart — takes 3 of 5 cols */}
        <div className="lg:col-span-3">
          <ChartCard
            title="Monthly Emissions"
            titleIcon={<Activity className="w-4 h-4 text-gt-green-500" />}
            subtitle={
              monthlyTarget
                ? `CO₂e by month · ${year} · dashed line = monthly target (${(monthlyTarget / 1000).toFixed(2)}t)`
                : `CO₂e by month · ${year}`
            }
            right={
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--bg-inset)" }}>
                <Leaf className="w-4 h-4 text-text-muted" />
              </div>
            }
          >
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={summary?.by_month ?? []}
                margin={{ top: 8, right: 4, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={CHART_AXIS_TICK} dy={8} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={CHART_AXIS_TICK}
                  tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}t` : `${v}`}
                  width={36}
                />
                <Tooltip
                  cursor={CHART_CURSOR}
                  contentStyle={CHART_TOOLTIP_STYLE}
                  formatter={(v) => [`${Number(v).toLocaleString("en-GB")} kg`, "CO₂e"]}
                />
                {monthlyTarget && (
                  <ReferenceLine
                    y={monthlyTarget}
                    stroke="#f97316"
                    strokeDasharray="6 3"
                    strokeWidth={1.5}
                    label={{
                      value: "Monthly target",
                      position: "insideTopRight",
                      fontSize: 8,
                      fill: "#f97316",
                      fontWeight: 900,
                    }}
                  />
                )}
                <Bar dataKey="co2" radius={[5, 5, 0, 0]} name="CO₂e (kg)">
                  {(summary?.by_month ?? []).map((m, i) => (
                    <Cell
                      key={i}
                      fill={
                        monthlyTarget && m.co2 > monthlyTarget
                          ? "#f97316"
                          : "var(--brand-green-dark)"
                      }
                      opacity={m.co2 === 0 ? 0.25 : 1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Scope breakdown — takes 2 of 5 cols */}
        <div className="lg:col-span-2 premium-card p-5 space-y-5 flex flex-col">
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted">
              Scope Breakdown
            </h3>
            <p className="text-[9px] font-bold text-text-muted opacity-50 mt-0.5">GHG Protocol classification</p>
          </div>

          <div className="flex-1 space-y-5">
            {(["scope1", "scope2", "scope3"] as const).map((key) => {
              const cfg = SCOPE_CFG[key];
              const val = summary?.by_scope[key] ?? 0;
              const pct = actual > 0 ? (val / actual) * 100 : 0;
              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: cfg.color }}>
                        {cfg.label}
                      </p>
                      <p className="text-[8px] font-bold text-text-muted opacity-50 mt-0.5">{cfg.sub}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-text-primary leading-none">
                        {(val / 1000).toFixed(2)}
                        <span className="text-[8px] opacity-40 ml-0.5">t</span>
                      </p>
                      <p className="text-[8px] font-bold opacity-50 mt-0.5" style={{ color: cfg.color }}>
                        {pct.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ background: "var(--bg-inset)", boxShadow: "var(--shadow-inset-xs)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: cfg.color, opacity: 0.75 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total pill */}
          <div
            className="rounded-xl p-3.5 flex items-center justify-between mt-auto"
            style={{ background: "var(--bg-inset)", boxShadow: "var(--shadow-inset-xs)" }}
          >
            <p className="text-[8px] font-black uppercase tracking-widest text-text-muted opacity-50">
              Total Emissions
            </p>
            <p className="text-base font-black tracking-tighter text-text-primary">
              {(actual / 1000).toFixed(3)}
              <span className="text-xs opacity-40 ml-1">tCO₂e</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── RESOURCE BREAKDOWN TABLE ─────────────────────────────────────────── */}
      <div className="premium-card overflow-hidden">
        {/* Header */}
        <div
          className="px-5 sm:px-8 py-5"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted">
            Resource Breakdown
          </h3>
          <p className="text-[9px] font-bold text-text-muted opacity-50 mt-0.5">
            By utility type — emissions, cost, and contribution weight
          </p>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr
                className="text-[9px] font-black uppercase tracking-widest text-text-muted"
                style={{
                  borderBottom: "1px solid var(--border-subtle)",
                  background: "var(--bg-inset)",
                }}
              >
                <th className="text-left px-8 py-3">Utility</th>
                <th className="text-left px-6 py-3">Scope</th>
                <th className="text-right px-6 py-3">CO₂e (kg)</th>
                <th className="text-right px-6 py-3">Spend</th>
                <th className="text-right px-8 py-3">Weight</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-14 text-center text-[10px] font-black uppercase tracking-widest text-text-muted animate-pulse"
                  >
                    Analysing resource streams…
                  </td>
                </tr>
              ) : (summary?.by_type ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-14 text-center text-[10px] font-black uppercase tracking-widest text-text-muted opacity-40">
                    No bills recorded for {year}
                  </td>
                </tr>
              ) : (
                <>
                  {(summary?.by_type ?? []).map(({ type, co2_kg, cost_gbp }) => {
                    const pct   = actual > 0 ? (co2_kg / actual) * 100 : 0;
                    const color = BILL_TYPE_COLORS[type] ?? "var(--brand-green)";
                    return (
                      <tr
                        key={type}
                        className="transition-colors"
                        style={{ borderBottom: "1px solid var(--border-subtle)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-inset)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                      >
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                            <span className="font-black text-text-primary text-sm">
                              {BILL_TYPE_LABELS[type] ?? type}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
                            style={{ background: `${color}1a`, color }}
                          >
                            {SCOPE_LABELS[type] ?? "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-text-primary">
                          {co2_kg.toLocaleString(undefined, { minimumFractionDigits: 1 })}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-text-muted">
                          {cost_gbp > 0
                            ? fmtGbp(cost_gbp)
                            : <span className="opacity-30">—</span>}
                        </td>
                        <td className="px-8 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div
                              className="w-16 h-1.5 rounded-full overflow-hidden"
                              style={{ background: "var(--bg-inset)" }}
                            >
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${pct}%`, background: color }}
                              />
                            </div>
                            <span className="text-[9px] font-black text-text-muted w-8 text-right">
                              {pct.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Summary row */}
                  {summary && (
                    <tr style={{ background: "var(--bg-inset)", borderTop: "2px solid var(--border-default)" }}>
                      <td className="px-8 py-4 text-sm font-black text-text-primary">Total</td>
                      <td />
                      <td
                        className="px-6 py-4 text-right text-sm font-black"
                        style={{ color: "var(--brand-green-dark)" }}
                      >
                        {actual.toLocaleString(undefined, { minimumFractionDigits: 1 })}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-text-primary">
                        {currCost > 0 ? fmtGbp(currCost) : <span className="opacity-30">—</span>}
                      </td>
                      <td className="px-8 py-4 text-right text-[9px] font-black uppercase tracking-widest text-text-muted opacity-40">
                        100%
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile card view */}
        <div className="md:hidden p-4 space-y-3">
          {loading ? (
            <div className="py-10 text-center text-[10px] font-black uppercase tracking-widest text-text-muted animate-pulse">
              Analysing…
            </div>
          ) : (summary?.by_type ?? []).length === 0 ? (
            <div className="py-10 text-center text-[10px] font-black uppercase tracking-widest text-text-muted opacity-40">
              No bills for {year}
            </div>
          ) : (
            (summary?.by_type ?? []).map(({ type, co2_kg, cost_gbp }) => {
              const pct   = actual > 0 ? (co2_kg / actual) * 100 : 0;
              const color = BILL_TYPE_COLORS[type] ?? "var(--brand-green)";
              return (
                <div
                  key={type}
                  className="rounded-2xl p-4 space-y-3"
                  style={{ background: "var(--bg-inset)", boxShadow: "var(--shadow-inset-xs)" }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                      <p className="font-black text-text-primary">{BILL_TYPE_LABELS[type] ?? type}</p>
                    </div>
                    <span
                      className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                      style={{ background: `${color}1a`, color }}
                    >
                      {SCOPE_LABELS[type] ?? "—"}
                    </span>
                  </div>
                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: "var(--bg-base)" }}
                  >
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <div className="flex justify-between items-end pt-0.5">
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-widest text-text-muted opacity-50">CO₂e</p>
                      <p className="font-black text-text-primary">
                        {co2_kg.toLocaleString(undefined, { minimumFractionDigits: 1 })} kg
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black uppercase tracking-widest text-text-muted opacity-50">Spend</p>
                      <p className="font-bold text-text-muted">{cost_gbp > 0 ? fmtGbp(cost_gbp) : "—"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black uppercase tracking-widest text-text-muted opacity-50">Weight</p>
                      <p className="font-black" style={{ color }}>{pct.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── YEAR-OVER-YEAR + SECR COMPLIANCE ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

        {/* Year-over-Year */}
        <div className="premium-card p-5 sm:p-6 space-y-5">
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted">Year-over-Year</h3>
            <p className="text-[9px] font-bold text-text-muted opacity-50 mt-0.5">
              {year} vs {Number(year) - 1}
            </p>
          </div>

          {prevCo2 === 0 ? (
            <div
              className="rounded-2xl py-8 flex items-center justify-center"
              style={{ background: "var(--bg-inset)", boxShadow: "var(--shadow-inset-xs)" }}
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted opacity-40">
                No {Number(year) - 1} data available
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {[
                {
                  label:   "Carbon Footprint",
                  current: `${(actual / 1000).toFixed(3)} t`,
                  prev:    `${(prevCo2 / 1000).toFixed(3)} t`,
                  pct:     yoyPct,
                },
                {
                  label:   "Utility Spend",
                  current: fmtGbp(currCost),
                  prev:    fmtGbp(prevCost),
                  pct:     yoyCostPct,
                },
              ].map(({ label, current, prev, pct }) => (
                <div
                  key={label}
                  className="rounded-2xl p-4 flex items-center justify-between gap-4"
                  style={{ background: "var(--bg-inset)", boxShadow: "var(--shadow-inset-xs)" }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-text-muted opacity-60">
                      {label}
                    </p>
                    <p className="text-lg font-black text-text-primary tracking-tighter mt-0.5 leading-none">
                      {current}
                    </p>
                    <p className="text-[9px] font-bold text-text-muted opacity-40 mt-1">
                      was {prev} in {Number(year) - 1}
                    </p>
                  </div>
                  {pct !== null && (
                    <div
                      className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black"
                      style={{
                        background: pct < 0 ? "rgba(34,197,94,0.12)"  : "rgba(249,115,22,0.12)",
                        color:      pct < 0 ? "var(--brand-green)"     : "#f97316",
                      }}
                    >
                      {pct < 0
                        ? <TrendingDown className="w-3.5 h-3.5" />
                        : <TrendingUp   className="w-3.5 h-3.5" />}
                      {Math.abs(pct).toFixed(1)}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECR Compliance */}
        <div className="premium-card p-5 sm:p-6 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted">
                SECR Compliance
              </h3>
              <p className="text-[9px] font-bold text-text-muted opacity-50 mt-0.5">
                Data coverage for {year}
              </p>
            </div>
            <div
              className={`shrink-0 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                monthsWithData >= 10
                  ? "bg-gt-green-500/10 text-gt-green-700 border-gt-green-500/20"
                  : monthsWithData >= 6
                  ? "bg-amber-500/10 text-amber-600 border-amber-500/25"
                  : "bg-orange-500/10 text-orange-600 border-orange-500/20"
              }`}
            >
              {monthsWithData >= 10 ? "Audit Ready" : monthsWithData >= 6 ? "Partial" : "Incomplete"}
            </div>
          </div>

          {/* 12-month dot grid */}
          <div className="grid grid-cols-6 gap-2">
            {MONTH_LABELS.map((m, i) => {
              const hasData = monthsHaveData[i] ?? false;
              return (
                <div key={m} className="flex flex-col items-center gap-1.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                    style={{
                      background: hasData ? "rgba(34,197,94,0.12)"       : "var(--bg-inset)",
                      boxShadow:  hasData ? "none"                        : "var(--shadow-inset-xs)",
                      border:     hasData ? "1px solid rgba(34,197,94,0.3)" : "1px solid var(--border-subtle)",
                    }}
                  >
                    {hasData ? (
                      <CheckCircle className="w-3.5 h-3.5" style={{ color: "var(--brand-green)" }} />
                    ) : (
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: "var(--border-strong)" }}
                      />
                    )}
                  </div>
                  <p className="text-[7px] font-black uppercase tracking-wider text-text-muted opacity-50">{m}</p>
                </div>
              );
            })}
          </div>

          {/* Coverage summary */}
          <div
            className="rounded-xl p-4 flex items-center justify-between gap-4"
            style={{ background: "var(--bg-inset)", boxShadow: "var(--shadow-inset-xs)" }}
          >
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-text-muted opacity-50">
                Coverage
              </p>
              <p className="text-lg font-black text-text-primary tracking-tighter leading-none mt-0.5">
                {monthsWithData}
                <span className="text-xs opacity-40">/12 months</span>
              </p>
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-text-muted opacity-50">
                Records
              </p>
              <p className="text-lg font-black text-text-primary tracking-tighter leading-none mt-0.5">
                {summary?.bill_count ?? 0}
              </p>
            </div>
            <div className="flex items-center gap-2 opacity-25 shrink-0">
              <Shield className="w-5 h-5 text-text-muted" />
              <span className="text-[8px] font-black uppercase tracking-widest text-text-muted">DEFRA 2025</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── DOCUMENT FOOTER ──────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        style={{ background: "var(--bg-inset)", boxShadow: "var(--shadow-inset-xs)" }}
      >
        <p className="text-[9px] font-bold text-text-muted opacity-40 max-w-lg leading-relaxed">
          Derived from HM Government DESNZ 2025 conversion factors. This report is generated
          against SECR / TCFD disclosure standards for UK reporting periods. Figures include
          Scope 1, 2, and 3 emissions as defined by the GHG Protocol.
        </p>
        <div className="flex items-center gap-2 opacity-20 shrink-0">
          <CheckCircle className="w-4 h-4" />
          <span className="text-[9px] font-black uppercase tracking-widest">Audit Trail Valid</span>
        </div>
      </div>
    </PageLayout>
  );
}
