"use client";
import { useState } from "react";
import {
  FileText, Download, TrendingDown, BarChart2,
  Zap, Leaf, CheckCircle, Calendar,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { PageLayout }  from "@/components/ui/PageLayout";
import { ChartCard }   from "@/components/ui/ChartCard";
import { useFetch }    from "@/hooks/useFetch";
import { BILL_TYPE_LABELS, SCOPE_LABELS } from "@/lib/carbon/constants";
import { CHART_AXIS_TICK, CHART_TOOLTIP_STYLE, CHART_CURSOR } from "@/lib/chart/config";
import type { ReportSummary } from "@/types";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

export default function ReportsPage() {
  const [year, setYear] = useState(String(CURRENT_YEAR));
  const { data: summary, loading, error } = useFetch<ReportSummary>(
    `/api/reports/summary?year=${year}`
  );

  const isFreePlan = summary?.org.tier === "free";

  const yearSelector = (
    <div className="flex items-center gap-3">
      <div className="neu-btn bg-white border-none rounded-xl px-4 py-2.5 flex items-center gap-2 group transition-all">
        <Calendar className="w-4 h-4 text-text-muted group-hover:text-gt-green-500 transition-colors" />
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="text-xs font-black uppercase tracking-widest text-text-primary bg-transparent focus:outline-none cursor-pointer"
        >
          {YEARS.map((y) => <option key={y} value={y}>{y} Fiscal</option>)}
        </select>
      </div>
      <button
        type="button"
        disabled={isFreePlan || loading}
        onClick={() => window.open(`/api/reports/print?year=${year}`, "_blank")}
        className="group relative px-6 py-3 rounded-xl bg-gt-green-900 text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:bg-black disabled:opacity-30 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-gt-green-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="relative z-10 flex items-center gap-2">
          <Download className="w-4 h-4" /> Download PDF
        </span>
      </button>
    </div>
  );

  return (
    <PageLayout
      icon={<FileText className="w-5 h-5" />}
      title="Analytics & Reports"
      subtitle="Official SECR-ready compliance data and environmental impact summaries"
      headerRight={yearSelector}
      error={error}
    >
      {/* Free plan upgrade banner */}
      {isFreePlan && (
        <div className="premium-card p-6 border-none bg-gradient-to-br from-gt-green-900 to-black text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
            <Zap className="w-32 h-32" />
          </div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <h3 className="text-lg font-black tracking-tight">Unlock SECR Reporting</h3>
              <p className="text-xs font-bold text-white/60 max-w-md leading-relaxed">
                Your current plan only supports dashboard analytics. Upgrade to download
                fully compliant PDF reports for your board and stakeholders.
              </p>
            </div>
            <a
              href="/billing"
              className="px-6 py-3 rounded-xl bg-gt-green-500 hover:bg-white hover:text-black text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Upgrade Now
            </a>
          </div>
        </div>
      )}

      {/* Report preview */}
      <div className="premium-card p-10 space-y-10 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none rotate-12">
          <Leaf className="w-[600px] h-[600px]" />
        </div>

        {/* Card header */}
        <div className="flex items-start justify-between relative z-10">
          <div className="space-y-1">
            <h2 className="text-xl font-black tracking-tight flex items-center gap-3" style={{ color: "var(--text-primary)" }}>
              <div className="w-8 h-8 rounded-lg bg-gt-green-500 text-white flex items-center justify-center shadow-lg shadow-gt-green-500/20">
                <FileText className="w-4 h-4" />
              </div>
              SECR Annual Compliance Report
            </h2>
            <p className="text-xs font-bold opacity-50 ml-11" style={{ color: "var(--text-muted)" }}>
              Fiscal Year Summary — Powered by GreenTrack AI Engine
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
              isFreePlan
                ? "bg-bg-inset text-text-muted border-border-subtle"
                : "bg-gt-green-500/10 text-gt-green-700 border-gt-green-500/20"
            }`}>
              {summary?.org.tier ?? "—"} Member
            </div>
            <span className="text-[9px] font-bold text-text-muted opacity-40">
              Generated: {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Inner document */}
        <div className="rounded-[2.5rem] bg-bg-surface shadow-2xl border border-border-subtle/50 overflow-hidden relative z-10">
          <div className="bg-gradient-to-r from-gt-green-900 to-black px-10 py-8 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-white font-black text-2xl tracking-tighter">{summary?.org.name ?? "—"}</p>
              <p className="text-gt-green-400 text-[10px] font-black uppercase tracking-[0.3em]">
                Environmental Audit Report · {year}
              </p>
            </div>
            <div className="text-right flex flex-col items-end">
              <div className="px-3 py-1 rounded-md bg-white/10 backdrop-blur-md mb-2">
                <p className="text-white text-[10px] font-black uppercase tracking-widest">SECR Compliant</p>
              </div>
              <p className="text-gt-green-500 text-[9px] font-black uppercase tracking-[0.2em]">Verified Outcome</p>
            </div>
          </div>

          <div className="p-10 space-y-12">
            {/* Summary bento stats */}
            <div className="grid grid-cols-3 gap-6">
              {[
                {
                  label: "Aggregate Footprint",
                  value: loading ? "—" : ((summary?.total_co2_kg ?? 0) / 1000).toFixed(3),
                  unit: "tCO₂e", note: "Total Scopes 1, 2 & 3",
                },
                {
                  label: "Energy Intensity",
                  value: loading ? "—" : (summary?.total_kwh ?? 0).toLocaleString(),
                  unit: "kWh", note: "Gross Energy Usage",
                },
                {
                  label: "Audit Volume",
                  value: loading ? "—" : String(summary?.bill_count ?? 0),
                  unit: "Records", note: `Audited in ${year}`,
                },
              ].map(({ label, value, unit, note }) => (
                <div key={label} className="rounded-3xl p-6 text-center" style={{ background: "var(--neu-base)", boxShadow: "var(--shadow-inset)" }}>
                  <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-2">{label}</p>
                  <p className="text-2xl font-black text-text-primary tracking-tighter">
                    {value} <span className="text-xs opacity-30 ml-1">{unit}</span>
                  </p>
                  <p className="text-[9px] font-bold text-text-muted mt-2 opacity-50">{note}</p>
                </div>
              ))}
            </div>

            {/* Scope distribution */}
            {summary && (
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted px-1">
                  Compliance Distribution
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Scope 1", value: summary.by_scope.scope1, color: "text-brand-orange-dark bg-brand-orange/5 border-brand-orange/10",  sub: "Direct (Gas/Fuel)" },
                    { label: "Scope 2", value: summary.by_scope.scope2, color: "text-blue-600 bg-blue-500/5 border-blue-500/10",                   sub: "Indirect (Grid)" },
                    { label: "Scope 3", value: summary.by_scope.scope3, color: "text-cyan-600 bg-cyan-500/5 border-cyan-500/10",                   sub: "Associated (Water)" },
                  ].map(({ label, value, color, sub }) => (
                    <div key={label} className={`rounded-2xl p-5 border ${color}`}>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{label}</p>
                      <p className="text-lg font-black mt-1 text-text-primary">
                        {Math.round(value).toLocaleString()} <span className="text-[10px] opacity-40">kg</span>
                      </p>
                      <p className="text-[9px] font-bold opacity-50 mt-1">{sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resource decomposition table */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted px-1">
                Resource Decomposition
              </h3>
              <div className="rounded-2xl border border-border-subtle/50 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-bg-inset/30">
                    <tr className="text-[9px] font-black uppercase tracking-widest text-text-muted border-b border-border-subtle/50">
                      <th className="text-left px-6 py-3">Resource Source</th>
                      <th className="text-left px-6 py-3">Compliance Scope</th>
                      <th className="text-right px-6 py-3">Impact (kgCO₂e)</th>
                      <th className="text-right px-8 py-3">Weight</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle/30">
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-[10px] font-black uppercase tracking-widest text-text-muted animate-pulse">
                          Analyzing Resource Streams...
                        </td>
                      </tr>
                    ) : (
                      summary?.by_type.map(({ type, co2_kg }) => (
                        <tr key={type} className="hover:bg-bg-inset/20 transition-colors">
                          <td className="px-6 py-3.5 font-bold text-text-primary">{BILL_TYPE_LABELS[type] ?? type}</td>
                          <td className="px-6 py-3.5">
                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-bg-inset/50 text-text-muted">
                              {SCOPE_LABELS[type] ?? "—"}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-right font-black text-text-primary">
                            {co2_kg.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-8 py-3.5 text-right font-bold text-text-muted">
                            {summary.total_co2_kg > 0
                              ? ((co2_kg / summary.total_co2_kg) * 100).toFixed(1)
                              : "0"}%
                          </td>
                        </tr>
                      ))
                    )}
                    {summary && (
                      <tr className="bg-bg-inset/20 font-black border-t-2 border-border-subtle">
                        <td className="px-6 py-5 text-lg tracking-tighter text-text-primary">Summary Total</td>
                        <td />
                        <td className="px-6 py-5 text-right text-lg text-gt-green-700 tracking-tighter">
                          {summary.total_co2_kg.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-8 py-5 text-right text-[10px] uppercase tracking-widest opacity-30 text-text-muted">
                          100% Impact
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Document footer */}
            <div className="pt-8 border-t border-border-subtle/50 flex items-center justify-between">
              <p className="text-[9px] font-bold text-text-muted opacity-40 max-w-sm leading-relaxed">
                Derived from HM Government conversion factors. This document is digitally verified
                against SECR / TCFD disclosure standards for UK reporting periods.
              </p>
              <div className="flex items-center gap-2 opacity-20">
                <CheckCircle className="w-4 h-4" />
                <span className="text-[9px] font-black uppercase tracking-widest">Audit Trail Valid</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-8">
        <ChartCard
          title="Quarterly Impact"
          titleIcon={<TrendingDown className="w-4 h-4 text-gt-green-500" />}
          subtitle={`Emissions Velocity (${year})`}
          right={
            <div className="w-10 h-10 rounded-xl bg-bg-inset flex items-center justify-center">
              <Zap className="w-5 h-5 text-text-muted" />
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={summary?.by_quarter ?? []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
              <XAxis dataKey="period" axisLine={false} tickLine={false} tick={CHART_AXIS_TICK} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={CHART_AXIS_TICK} />
              <Tooltip
                cursor={{ fill: "var(--bg-inset)", opacity: 0.4 }}
                contentStyle={{ ...CHART_TOOLTIP_STYLE, textTransform: "uppercase", letterSpacing: "0.1em" }}
              />
              <Bar dataKey="co2" fill="var(--brand-green-dark)" radius={[6, 6, 0, 0]} name="CO₂e (kg)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Emission Breakdown"
          titleIcon={<BarChart2 className="w-4 h-4 text-blue-500" />}
          subtitle="Categorical Distribution"
          right={
            <div className="w-10 h-10 rounded-xl bg-bg-inset flex items-center justify-center">
              <Leaf className="w-5 h-5 text-text-muted" />
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={(summary?.by_type ?? []).map((b) => ({
                name: BILL_TYPE_LABELS[b.type] ?? b.type,
                co2:  b.co2_kg,
              }))}
              layout="vertical"
              margin={{ left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-subtle)" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={CHART_AXIS_TICK} />
              <YAxis
                dataKey="name" type="category" axisLine={false} tickLine={false}
                tick={{ fontSize: 8, fontWeight: 900, fill: "var(--text-primary)" }} width={70}
              />
              <Tooltip cursor={CHART_CURSOR} contentStyle={CHART_TOOLTIP_STYLE} />
              <Bar dataKey="co2" radius={[0, 6, 6, 0]} fill="var(--brand-green)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </PageLayout>
  );
}
