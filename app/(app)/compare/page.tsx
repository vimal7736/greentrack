"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useTheme } from "next-themes";
import { Scale, ArrowDown, ArrowUp, Minus } from "lucide-react";

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
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [bills,   setBills]   = useState<BillRow[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const [fromA, setFromA] = useState(() => `${now.getFullYear()}-${String(now.getMonth() - 2).padStart(2, "0") || "01"}`);
  const [toA,   setToA]   = useState(() => `${now.getFullYear()}-${String(now.getMonth()).padStart(2, "0") || "01"}`);
  const [fromB, setFromB] = useState(() => `${now.getFullYear()}-${String(now.getMonth() - 5).padStart(2, "0") || "01"}`);
  const [toB,   setToB]   = useState(() => `${now.getFullYear()}-${String(now.getMonth() - 3).padStart(2, "0") || "01"}`);

  useEffect(() => { setMounted(true); }, []);

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

  const isDark = mounted && resolvedTheme === "dark";
  const base   = isDark ? "#1c1c1c" : "#e4e0d6";
  const dark   = isDark ? "#0e0e0e" : "#b6b3aa";
  const light  = isDark ? "#2c2c2c" : "#ffffff";
  const text   = isDark ? "#f5f0e8" : "#0a0a0a";
  const muted  = isDark ? "#7a7570" : "#9a9590";
  const raised = `6px 6px 14px ${dark}, -6px -6px 14px ${light}`;
  const inset  = `inset 5px 5px 10px ${dark}, inset -5px -5px 10px ${light}`;

  const sA = useMemo(() => aggregate(billsInRange(bills, fromA, toA)), [bills, fromA, toA]);
  const sB = useMemo(() => aggregate(billsInRange(bills, fromB, toB)), [bills, fromB, toB]);

  /* Type-by-type comparison chart data */
  const allTypes = Array.from(new Set([...Object.keys(sA.byType), ...Object.keys(sB.byType)]));
  const typeChart = allTypes.map((t) => ({
    name:  TYPE_LABELS[t] ?? t,
    A:     +(sA.byType[t] ?? 0).toFixed(1),
    B:     +(sB.byType[t] ?? 0).toFixed(1),
    color: TYPE_COLORS[t] ?? "#6b7280",
  }));

  const tooltipStyle = {
    background: isDark ? "#1c1c1c" : "#f5f0e8",
    border:     `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
    borderRadius: 8, color: text, fontSize: 11, fontWeight: 600,
  };

  function DeltaChip({ a, b }: { a: number; b: number }) {
    const d   = delta(a, b);
    const abs = Math.abs(d);
    if (abs < 0.1) return <span style={{ color: muted }}><Minus className="w-3 h-3 inline" /> —</span>;
    const down = d < 0;
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-bold"
            style={{ color: down ? "#22c55e" : "#f97316" }}>
        {down ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
        {abs.toFixed(1)}%
      </span>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" style={{ color: text }}>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
             style={{ background: base, boxShadow: raised }}>
          <Scale className="w-5 h-5" style={{ color: "var(--brand-green)" }} />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Period Comparison</h1>
          <p className="text-sm" style={{ color: muted }}>Compare any two date ranges side by side</p>
        </div>
      </div>

      {/* Range pickers */}
      <div className="grid grid-cols-2 gap-5">
        {([
          { period: "A", color: "#22c55e", from: fromA, to: toA, setFrom: setFromA, setTo: setToA },
          { period: "B", color: "#f97316", from: fromB, to: toB, setFrom: setFromB, setTo: setToB },
        ] as const).map(({ period, color, from, to, setFrom, setTo }) => (
          <div key={period}
               className="rounded-2xl p-5"
               style={{ background: base, boxShadow: raised, borderTop: `3px solid ${color}` }}>
            <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color }}>
              Period {period}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[["From", from, setFrom], ["To", to, setTo]].map(([lbl, val, set]) => (
                <div key={String(lbl)}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: muted }}>
                    {String(lbl)}
                  </p>
                  <input
                    type="month"
                    value={String(val)}
                    onChange={(e) => (set as (v: string) => void)(e.target.value)}
                    className="w-full text-sm font-semibold px-3 py-2 rounded-xl outline-none"
                    style={{
                      background: base,
                      boxShadow:  `inset 3px 3px 6px ${dark}, inset -3px -3px 6px ${light}`,
                      color: text,
                      border: `1.5px solid ${color}35`,
                      colorScheme: isDark ? "dark" : "light",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16" style={{ color: muted }}>Loading bills…</div>
      ) : (
        <>
          {/* Summary metric cards */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "CO₂ Emissions", a: sA.co2,  b: sB.co2,  unit: "kg",  fmt: (v: number) => v.toFixed(1) },
              { label: "Energy Used",   a: sA.kwh,  b: sB.kwh,  unit: "kWh", fmt: (v: number) => v.toFixed(0) },
              { label: "Total Cost",    a: sA.cost, b: sB.cost,  unit: "£",   fmt: (v: number) => `£${v.toFixed(0)}` },
            ].map(({ label, a, b, unit, fmt }) => (
              <div key={label} className="rounded-2xl p-5"
                   style={{ background: base, boxShadow: raised }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: muted }}>
                  {label}
                </p>
                <div className="grid grid-cols-3 gap-2 items-end">
                  <div>
                    <p className="text-[10px] font-bold uppercase" style={{ color: "#22c55e" }}>A</p>
                    <p className="text-lg font-black leading-tight">{fmt(a)}</p>
                    <p className="text-[10px]" style={{ color: muted }}>{unit}</p>
                  </div>
                  <div className="text-center pb-1">
                    <DeltaChip a={a} b={b} />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase" style={{ color: "#f97316" }}>B</p>
                    <p className="text-lg font-black leading-tight">{fmt(b)}</p>
                    <p className="text-[10px]" style={{ color: muted }}>{unit}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Type-by-type chart */}
          <div className="rounded-2xl p-6"
               style={{ background: base, boxShadow: inset }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: muted }}>
              CO₂ by Emission Type — A vs B
            </p>
            {typeChart.length === 0 ? (
              <p className="text-center py-8 text-sm" style={{ color: muted }}>No data in selected ranges</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={typeChart} barGap={6} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false}
                                 stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: muted }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: muted }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11, color: muted }} />
                  <Bar dataKey="A" name="Period A" fill="#22c55e" radius={[4, 4, 0, 0]} opacity={0.9} />
                  <Bar dataKey="B" name="Period B" fill="#f97316" radius={[4, 4, 0, 0]} opacity={0.9} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Per-type delta table */}
          <div className="rounded-2xl p-6"
               style={{ background: base, boxShadow: raised }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: muted }}>
              Detailed Breakdown
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}` }}>
                  {["Emission Type", "Period A (kg)", "Period B (kg)", "Change"].map((h, i) => (
                    <th key={h}
                        className={`pb-3 text-[10px] font-black uppercase tracking-widest ${i > 0 ? "text-right" : "text-left"}`}
                        style={{ color: muted }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allTypes.map((t) => {
                  const a = sA.byType[t] ?? 0;
                  const b = sB.byType[t] ?? 0;
                  return (
                    <tr key={t} style={{ borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}` }}>
                      <td className="py-3 font-semibold">{TYPE_LABELS[t] ?? t}</td>
                      <td className="py-3 text-right" style={{ color: "#22c55e" }}>{a.toFixed(1)}</td>
                      <td className="py-3 text-right" style={{ color: "#f97316" }}>{b.toFixed(1)}</td>
                      <td className="py-3 text-right"><DeltaChip a={a} b={b} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
