"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useTheme } from "next-themes";
import { Scale, ArrowDown, ArrowUp, Minus, Calendar } from "lucide-react";

/* ── Types ────────────────────────────────────────────────────── */
type BillRow = {
  bill_date: string; bill_type: string;
  co2_kg: number; usage_amount: number;
  usage_unit: string; cost_gbp: number | null;
};

const TYPE_LABELS: Record<string, string> = {
  electricity: "Electricity", gas: "Gas", water: "Water",
  fuel_diesel: "Diesel", fuel_petrol: "Petrol",
};
const TYPE_COLORS: Record<string, string> = {
  electricity: "#22c55e", gas: "#3b82f6", water: "#06b6d4",
  fuel_diesel: "#f59e0b", fuel_petrol: "#f97316",
};

/* ── Helpers ─────────────────────────────────────────────────── */
function billsInRange(bills: BillRow[], from: string, to: string) {
  return bills.filter((b) => b.bill_date >= from && b.bill_date <= to + "-31");
}
function aggregate(bs: BillRow[]) {
  const byType: Record<string, number> = {};
  let co2 = 0, kwh = 0, cost = 0;
  for (const b of bs) {
    co2  += b.co2_kg ?? 0;
    cost += b.cost_gbp ?? 0;
    if (b.usage_unit === "kWh") kwh += b.usage_amount ?? 0;
    byType[b.bill_type] = (byType[b.bill_type] ?? 0) + (b.co2_kg ?? 0);
  }
  return { co2, kwh, cost, byType };
}
function delta(a: number, b: number) {
  return a > 0 ? ((b - a) / a) * 100 : 0;
}

/* ── Component ───────────────────────────────────────────────── */
export default function ComparePage() {
  const [bills,   setBills]   = useState<BillRow[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const [fromA, setFromA] = useState(() => `${now.getFullYear()}-${String(now.getMonth() - 2).padStart(2, "0") || "01"}`);
  const [toA,   setToA]   = useState(() => `${now.getFullYear()}-${String(now.getMonth()).padStart(2, "0") || "01"}`);
  const [fromB, setFromB] = useState(() => `${now.getFullYear()}-${String(now.getMonth() - 5).padStart(2, "0") || "01"}`);
  const [toB,   setToB]   = useState(() => `${now.getFullYear()}-${String(now.getMonth() - 3).padStart(2, "0") || "01"}`);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles").select("org_id").eq("id", user.id).single();
      if (!profile?.org_id) return;
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      const { data } = await supabase
        .from("bills")
        .select("bill_date,bill_type,co2_kg,usage_amount,usage_unit,cost_gbp")
        .eq("org_id", profile.org_id)
        .gte("bill_date", twoYearsAgo.toISOString().slice(0, 10))
        .order("bill_date", { ascending: true });
      setBills(data ?? []);
      setLoading(false);
    })();
  }, []);

  const sA = useMemo(() => aggregate(billsInRange(bills, fromA, toA)), [bills, fromA, toA]);
  const sB = useMemo(() => aggregate(billsInRange(bills, fromB, toB)), [bills, fromB, toB]);

  const allTypes = Array.from(new Set([...Object.keys(sA.byType), ...Object.keys(sB.byType)]));
  const typeChart = allTypes.map((t) => ({
    name:  TYPE_LABELS[t] ?? t,
    A:     +(sA.byType[t] ?? 0).toFixed(1),
    B:     +(sB.byType[t] ?? 0).toFixed(1),
    color: TYPE_COLORS[t] ?? "#6b7280",
  }));

  function DeltaChip({ a, b }: { a: number; b: number }) {
    const d   = delta(a, b);
    const abs = Math.abs(d);
    if (abs < 0.1) return <span className="text-[10px] font-black uppercase text-text-muted opacity-40">—</span>;
    const down = d < 0;
    return (
      <div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase flex items-center gap-0.5 shadow-sm border ${
        down ? "bg-gt-green-500/10 text-gt-green-700 border-gt-green-500/20" : "bg-brand-orange/10 text-brand-orange-dark border-brand-orange/20"
      }`}>
        {down ? <ArrowDown className="w-2.5 h-2.5" /> : <ArrowUp className="w-2.5 h-2.5" />}
        {abs.toFixed(1)}%
      </div>
    );
  }

  return (
    <div className="relative space-y-8 animate-fade-in pb-20">
      {/* Background Decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gt-green-500/5 rounded-full blur-[140px] -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-orange/5 rounded-full blur-[120px] translate-y-1/4 -translate-x-1/4" />
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-bg-surface shadow-premium flex items-center justify-center">
          <Scale className="w-6 h-6 text-gt-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-text-primary">Comparative Audit</h1>
          <p className="text-sm font-bold text-text-muted opacity-60">Side-by-side performance analysis of any two reporting periods</p>
        </div>
      </div>

      {/* Range pickers */}
      <div className="grid grid-cols-2 gap-8">
        {([
          { period: "A", color: "var(--brand-green)", from: fromA, to: toA, setFrom: setFromA, setTo: setToA },
          { period: "B", color: "var(--brand-orange)", from: fromB, to: toB, setFrom: setFromB, setTo: setToB },
        ] as const).map(({ period, color, from, to, setFrom, setTo }) => (
          <div key={period} className="premium-card p-6 border-none relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full opacity-60" style={{ background: color }} />
            <div className="flex items-center justify-between mb-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color }}>
                Observation Period {period}
              </p>
              <div className="w-8 h-8 rounded-lg bg-bg-inset flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar className="w-4 h-4 text-text-muted" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[["Start Month", from, setFrom], ["End Month", to, setTo]].map(([lbl, val, set]) => (
                <div key={String(lbl)}>
                  <p className="text-[9px] font-black uppercase tracking-widest mb-2 text-text-muted opacity-50">
                    {String(lbl)}
                  </p>
                  <input
                    type="month"
                    value={String(val)}
                    onChange={(e) => (set as (v: string) => void)(e.target.value)}
                    className="w-full bg-bg-inset/50 border-2 border-transparent rounded-xl px-4 py-3 text-sm font-black text-text-primary focus:border-gt-green-500 focus:bg-white transition-all outline-none"
                    style={{ colorScheme: "light dark" }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center animate-pulse">
           <div className="w-12 h-12 border-4 border-gt-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
           <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Analyzing Historical Streams...</p>
        </div>
      ) : (
        <div className="space-y-8 animate-scale-in">
          {/* Summary metric cards */}
          <div className="grid grid-cols-3 gap-6">
            {[
              { label: "Carbon Footprint", a: sA.co2,  b: sB.co2,  unit: "kgCO₂e",  fmt: (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 1 }) },
              { label: "Energy Intensity",   a: sA.kwh,  b: sB.kwh,  unit: "kWh", fmt: (v: number) => v.toLocaleString() },
              { label: "Aggregate Cost",    a: sA.cost, b: sB.cost,  unit: "GBP",   fmt: (v: number) => `£${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
            ].map(({ label, a, b, unit, fmt }) => (
              <div key={label} className="premium-card p-6 border-none shadow-xl">
                <p className="text-[10px] font-black uppercase tracking-widest mb-6 text-text-muted opacity-50 text-center">
                  {label}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-center space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gt-green-600">Period A</p>
                    <p className="text-2xl font-black text-text-primary tracking-tighter">{fmt(a)}</p>
                    <p className="text-[9px] font-bold text-text-muted uppercase opacity-40">{unit}</p>
                  </div>
                  
                  <div className="mb-2">
                    <DeltaChip a={a} b={b} />
                  </div>

                  <div className="text-center space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-brand-orange-dark">Period B</p>
                    <p className="text-2xl font-black text-text-primary tracking-tighter">{fmt(b)}</p>
                    <p className="text-[9px] font-bold text-text-muted uppercase opacity-40">{unit}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Type-by-type chart */}
          <div className="premium-card p-8 border-none shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest text-text-primary">Resource Comparison Matrix</h2>
                <p className="text-[10px] font-bold text-text-muted mt-1 uppercase tracking-widest opacity-40">Period A vs Period B Impact (kgCO₂e)</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gt-green-600" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-text-muted">Period A</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-brand-orange-dark" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-text-muted">Period B</span>
                </div>
              </div>
            </div>
            
            {typeChart.length === 0 ? (
              <div className="h-[240px] flex items-center justify-center bg-bg-inset/30 rounded-3xl border border-dashed border-border-subtle">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">No overlapping data detected</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={typeChart} barGap={12} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                  <XAxis 
                    dataKey="name" 
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
                      background: "var(--bg-surface)",
                      color: "var(--text-primary)"
                    }}
                  />
                  <Bar dataKey="A" name="Period A" fill="var(--brand-green-dark)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="B" name="Period B" fill="var(--brand-orange-dark)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Per-type delta table */}
          <div className="premium-card overflow-hidden border-none shadow-xl">
            <div className="p-6 border-b border-border-subtle/50 bg-bg-inset/10">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Granular Stream Breakdown</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-text-primary">
                <thead>
                  <tr className="bg-bg-inset/20 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted border-b border-border-subtle">
                    <th className="text-left px-8 py-5">Emission Source</th>
                    <th className="text-right px-6 py-5">Period A (kg)</th>
                    <th className="text-right px-6 py-5">Period B (kg)</th>
                    <th className="text-right px-8 py-5">Efficiency Delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/50">
                  {allTypes.map((t) => {
                    const a = sA.byType[t] ?? 0;
                    const b = sB.byType[t] ?? 0;
                    return (
                      <tr key={t} className="group hover:bg-bg-inset/30 transition-all duration-300">
                        <td className="px-8 py-4 font-black text-xs">{TYPE_LABELS[t] ?? t}</td>
                        <td className="px-6 py-4 text-right font-black text-gt-green-600">{a.toLocaleString(undefined, { maximumFractionDigits: 1 })}</td>
                        <td className="px-6 py-4 text-right font-black text-brand-orange-dark">{b.toLocaleString(undefined, { maximumFractionDigits: 1 })}</td>
                        <td className="px-8 py-4 text-right">
                          <div className="flex justify-end">
                            <DeltaChip a={a} b={b} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
