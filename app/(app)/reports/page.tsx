"use client";
import { useState, useEffect } from "react";
import { FileText, Download, TrendingDown, BarChart2, AlertCircle, Calendar, Zap, Leaf, CheckCircle } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

const TYPE_LABELS: Record<string, string> = {
  electricity: "UK Electricity",
  gas: "Natural Gas",
  fuel_diesel: "Diesel",
  fuel_petrol: "Petrol",
  water: "Water",
};

const SCOPE_LABELS: Record<string, string> = {
  electricity: "Scope 2",
  gas: "Scope 1",
  fuel_diesel: "Scope 1",
  fuel_petrol: "Scope 1",
  water: "Scope 3",
};

interface Summary {
  org: { name: string; tier: string };
  year: string;
  total_co2_kg: number;
  total_kwh: number;
  total_cost_gbp: number;
  by_type: { type: string; co2_kg: number }[];
  by_scope: { scope1: number; scope2: number; scope3: number };
  by_quarter: { period: string; co2: number }[];
  bill_count: number;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

export default function ReportsPage() {
  const [year, setYear] = useState(String(CURRENT_YEAR));
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/reports/summary?year=${year}`);
      if (res.ok) setSummary(await res.json());
      else setError("Failed to load report data");
      setLoading(false);
    }
    load();
  }, [year]);

  function handleDownload() {
    window.open(`/api/reports/print?year=${year}`, "_blank");
  }

  const isFreePlan = summary?.org.tier === "free";

  return (
    <div className="relative space-y-8 animate-fade-in pb-20">
      {/* Background Decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gt-green-500/5 rounded-full blur-[140px] -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-orange/5 rounded-full blur-[120px] translate-y-1/4 -translate-x-1/4" />
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-5 h-5" style={{ color: "var(--brand-green)" }} />
            <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
              Analytics & Reports
            </h1>
          </div>
          <p className="text-sm font-bold opacity-60" style={{ color: "var(--text-muted)" }}>
            Official SECR-ready compliance data and environmental impact summaries
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="neu-btn bg-white border-none rounded-xl px-4 py-2.5 flex items-center gap-2 group transition-all">
            <Calendar className="w-4 h-4 text-text-muted group-hover:text-gt-green-500 transition-colors" />
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="text-xs font-black uppercase tracking-widest text-text-primary bg-transparent focus:outline-none cursor-pointer"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>{y} Fiscal</option>
              ))}
            </select>
          </div>
          
          <button
            type="button"
            disabled={isFreePlan || loading}
            onClick={handleDownload}
            className="group relative px-6 py-3 rounded-xl bg-gt-green-900 text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:bg-black disabled:opacity-30 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-gt-green-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative z-10 flex items-center gap-2">
              <Download className="w-4 h-4" /> Download PDF
            </span>
          </button>
        </div>
      </div>

      {error && (
        <div className="glass-orange rounded-2xl p-4 flex items-center gap-3 text-xs font-bold border-none animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0 text-brand-orange-dark" />
          <span style={{ color: "var(--brand-orange-dark)" }}>{error}</span>
        </div>
      )}

      {isFreePlan && !loading && (
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
      <div className="premium-card p-10 space-y-10 border-none shadow-2xl relative overflow-hidden">
        {/* Subtle document watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none rotate-12">
           <Leaf className="w-[600px] h-[600px]" />
        </div>

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
              isFreePlan ? "bg-bg-inset text-text-muted border-border-subtle" : "bg-gt-green-500/10 text-gt-green-700 border-gt-green-500/20"
            }`}>
              {summary?.org.tier ?? "—"} Member
            </div>
            <span className="text-[9px] font-bold text-text-muted opacity-40">Generated: {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* Preview Panel (The Document) */}
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
            {/* Summary Bento Stats */}
            <div className="grid grid-cols-3 gap-6">
              {[
                { label: "Aggregate Footprint", value: loading ? "—" : `${((summary?.total_co2_kg ?? 0) / 1000).toFixed(3)}`, unit: "tCO₂e", note: "Total Scopes 1, 2 & 3" },
                { label: "Energy Intensity", value: loading ? "—" : `${(summary?.total_kwh ?? 0).toLocaleString()}`, unit: "kWh", note: "Gross Energy Usage" },
                { label: "Audit Volume", value: loading ? "—" : String(summary?.bill_count ?? 0), unit: "Records", note: `Audited in ${year}` },
              ].map(({ label, value, unit, note }) => (
                <div key={label} className="bg-bg-inset/50 rounded-3xl p-6 text-center border border-border-subtle/30">
                  <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-2">{label}</p>
                  <p className="text-2xl font-black text-text-primary tracking-tighter">
                    {value} <span className="text-xs opacity-30 ml-1">{unit}</span>
                  </p>
                  <p className="text-[9px] font-bold text-text-muted mt-2 opacity-50">{note}</p>
                </div>
              ))}
            </div>

            {/* Scope Visualizer */}
            {summary && (
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted px-1">
                  Compliance Distribution
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Scope 1", value: summary.by_scope.scope1, color: "text-brand-orange-dark bg-brand-orange/5 border-brand-orange/10", sub: "Direct (Gas/Fuel)" },
                    { label: "Scope 2", value: summary.by_scope.scope2, color: "text-blue-600 bg-blue-500/5 border-blue-500/10", sub: "Indirect (Grid)" },
                    { label: "Scope 3", value: summary.by_scope.scope3, color: "text-cyan-600 bg-cyan-500/5 border-cyan-500/10", sub: "Associated (Water)" },
                  ].map(({ label, value, color, sub }) => (
                    <div key={label} className={`rounded-2xl p-5 border ${color}`}>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{label}</p>
                      <p className="text-lg font-black mt-1 text-text-primary">{Math.round(value).toLocaleString()} <span className="text-[10px] opacity-40">kg</span></p>
                      <p className="text-[9px] font-bold opacity-50 mt-1">{sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Source Audit Table */}
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
                      <tr><td colSpan={4} className="py-12 text-center text-[10px] font-black uppercase tracking-widest text-text-muted animate-pulse">Analyzing Resource Streams...</td></tr>
                    ) : (
                      summary?.by_type.map(({ type, co2_kg }) => (
                        <tr key={type} className="hover:bg-bg-inset/20 transition-colors">
                          <td className="px-6 py-3.5 font-bold text-text-primary">{TYPE_LABELS[type] ?? type}</td>
                          <td className="px-6 py-3.5">
                             <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-bg-inset/50 text-text-muted">
                               {SCOPE_LABELS[type] ?? "—"}
                             </span>
                          </td>
                          <td className="px-6 py-3.5 text-right font-black text-text-primary">{co2_kg.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
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
                        <td></td>
                        <td className="px-6 py-5 text-right text-lg text-gt-green-700 tracking-tighter">{summary.total_co2_kg.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="px-8 py-5 text-right text-[10px] uppercase tracking-widest opacity-30 text-text-muted">100% Impact</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

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
        <div className="premium-card p-8 border-none shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-text-primary flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-gt-green-500" /> Quarterly Impact
              </h2>
              <p className="text-[10px] font-bold text-text-muted mt-1 uppercase tracking-widest opacity-40">Emissions Velocity ({year})</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-bg-inset flex items-center justify-center">
               <Zap className="w-5 h-5 text-text-muted" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={summary?.by_quarter ?? []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
              <XAxis 
                dataKey="period" 
                axisLine={false} 
                tickLine={false}
                tick={{ fontSize: 9, fontWeight: 900, fill: "var(--text-muted)" }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false}
                tick={{ fontSize: 9, fontWeight: 900, fill: "var(--text-muted)" }} 
              />
              <Tooltip 
                cursor={{ fill: "var(--bg-inset)", opacity: 0.4 }}
                contentStyle={{ 
                  borderRadius: "16px", 
                  border: "none", 
                  boxShadow: "var(--shadow-premium)",
                  fontSize: "10px",
                  fontWeight: "900",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em"
                }}
              />
              <Bar dataKey="co2" fill="var(--brand-green-dark)" radius={[6, 6, 0, 0]} name="CO₂e (kg)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="premium-card p-8 border-none shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-text-primary flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-blue-500" /> Emission Breakdown
              </h2>
              <p className="text-[10px] font-bold text-text-muted mt-1 uppercase tracking-widest opacity-40">Categorical Distribution</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-bg-inset flex items-center justify-center">
               <Leaf className="w-5 h-5 text-text-muted" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={(summary?.by_type ?? []).map((b) => ({
                name: TYPE_LABELS[b.type] ?? b.type,
                co2: b.co2_kg,
              }))}
              layout="vertical"
              margin={{ left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-subtle)" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: "var(--text-muted)" }} />
              <YAxis 
                dataKey="name" 
                type="category" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 8, fontWeight: 900, fill: "var(--text-primary)" }} 
                width={70} 
              />
              <Tooltip 
                cursor={{ fill: "var(--bg-inset)", opacity: 0.4 }}
                contentStyle={{ 
                  borderRadius: "16px", 
                  border: "none", 
                  boxShadow: "var(--shadow-premium)",
                  fontSize: "10px",
                  fontWeight: "900"
                }}
              />
              <Bar dataKey="co2" radius={[0, 6, 6, 0]} fill="var(--brand-green)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
