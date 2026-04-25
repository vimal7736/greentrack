"use client";

import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";

type BillSlim = {
  bill_date:     string;
  co2_kg:        number;
  usage_amount:  number;
  usage_unit:    string;
  cost_gbp:      number | null;
};

interface Props { bills: BillSlim[] }

function monthBills(bills: BillSlim[], ym: string) {
  return bills.filter((b) => b.bill_date?.startsWith(ym));
}
function stats(bs: BillSlim[]) {
  return {
    co2:  bs.reduce((s, b) => s + b.co2_kg, 0),
    kwh:  bs.filter((b) => b.usage_unit === "kWh").reduce((s, b) => s + b.usage_amount, 0),
    cost: bs.reduce((s, b) => s + (b.cost_gbp ?? 0), 0),
  };
}

export function PeriodComparison({ bills }: Props) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  const now = new Date();
  const [pA, setPA] = useState(
    () => new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7)
  );
  const [pB, setPB] = useState(
    () => new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 7)
  );

  const sA = useMemo(() => stats(monthBills(bills, pA)), [bills, pA]);
  const sB = useMemo(() => stats(monthBills(bills, pB)), [bills, pB]);

  const delta = (a: number, b: number) =>
    a > 0 ? (((b - a) / a) * 100) : 0;

  const base  = isDark ? "#1c1c1c" : "#e4e0d6";
  const dark  = isDark ? "#0e0e0e" : "#b6b3aa";
  const light = isDark ? "#2c2c2c" : "#ffffff";
  const text  = isDark ? "#f5f0e8" : "#0a0a0a";
  const muted = isDark ? "#7a7570" : "#9a9590";
  const inset = `inset 3px 3px 7px ${dark}, inset -3px -3px 7px ${light}`;

  const chartData = [
    { name: "CO₂",  A: +sA.co2.toFixed(1),  B: +sB.co2.toFixed(1) },
    { name: "kWh",  A: +sA.kwh.toFixed(0),  B: +sB.kwh.toFixed(0) },
  ];

  function DeltaBadge({ val }: { val: number }) {
    const isZero = Math.abs(val) < 0.1;
    const isDown = val < 0;
    const color  = isZero ? muted : isDown ? "#22c55e" : "#f97316";
    const Icon   = isZero ? Minus : isDown ? ArrowDown : ArrowUp;
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-bold" style={{ color }}>
        <Icon className="w-3 h-3" />
        {isZero ? "—" : `${Math.abs(val).toFixed(1)}%`}
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-5 h-full">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: muted }}>
          Period Comparison
        </p>
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}>
          Month by Month
        </span>
      </div>

      {/* Month pickers */}
      <div className="grid grid-cols-2 gap-3">
        {([ ["Period A", pA, setPA, "#22c55e"], ["Period B", pB, setPB, "#f97316"] ] as const).map(
          ([lbl, val, set, accent]) => (
            <div key={lbl}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5"
                 style={{ color: accent }}>
                {lbl}
              </p>
              <input
                type="month"
                value={val}
                onChange={(e) => set(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl outline-none cursor-pointer"
                style={{
                  background: base,
                  boxShadow: inset,
                  color: text,
                  border: `1.5px solid ${accent}35`,
                  colorScheme: isDark ? "dark" : "light",
                }}
              />
            </div>
          )
        )}
      </div>

      {/* Delta metric tiles */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "CO₂", a: sA.co2,  b: sB.co2,  unit: "kg",  fmt: (v: number) => v.toFixed(1) },
          { label: "kWh", a: sA.kwh,  b: sB.kwh,  unit: "kWh", fmt: (v: number) => v.toFixed(0) },
          { label: "Cost",a: sA.cost, b: sB.cost,  unit: "£",  fmt: (v: number) => v.toFixed(0) },
        ].map(({ label, a, b, unit, fmt }) => (
          <div
            key={label}
            className="rounded-xl p-3"
            style={{ background: base, boxShadow: inset }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: muted }}>
              {label}
            </p>
            <p className="text-sm font-black mt-1 leading-tight" style={{ color: text }}>
              {unit === "£" ? "£" : ""}{fmt(b)} {unit !== "£" ? unit : ""}
            </p>
            <DeltaBadge val={delta(a, b)} />
          </div>
        ))}
      </div>

      {/* Comparison chart */}
      <div className="flex-1 min-h-[130px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={4} barSize={22}>
            <CartesianGrid
              strokeDasharray="3 3" vertical={false}
              stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}
            />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: muted }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: muted }}
              axisLine={false} tickLine={false} width={36}
            />
            <Tooltip
              contentStyle={{
                background: isDark ? "#1c1c1c" : "#f5f0e8",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                borderRadius: 8, color: text, fontSize: 11, fontWeight: 600,
              }}
            />
            <Bar dataKey="A" name="Period A" fill="#22c55e" radius={[4,4,0,0]} opacity={0.85} />
            <Bar dataKey="B" name="Period B" fill="#f97316" radius={[4,4,0,0]} opacity={0.85} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
