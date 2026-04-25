"use client";

import { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { Scale } from "lucide-react";
import { PageLayout }    from "@/components/ui/PageLayout";
import { Spinner }       from "@/components/ui/Spinner";
import { ChartCard }     from "@/components/ui/ChartCard";
import { DeltaChip }     from "@/components/ui/DeltaChip";
import { PeriodPicker }  from "@/components/ui/PeriodPicker";
import { useBillsHistory } from "@/hooks/useBillsHistory";
import { billsInRange, aggregateBills, monthOffset } from "@/lib/carbon/aggregate";
import { BILL_TYPE_LABELS, BILL_TYPE_COLORS } from "@/lib/carbon/constants";
import { CHART_AXIS_TICK, CHART_TOOLTIP_STYLE, CHART_CURSOR } from "@/lib/chart/config";

const now = new Date();

export default function ComparePage() {
  const { bills, loading } = useBillsHistory();

  const [fromA, setFromA] = useState(() => monthOffset(now, -2));
  const [toA,   setToA]   = useState(() => monthOffset(now,  0));
  const [fromB, setFromB] = useState(() => monthOffset(now, -5));
  const [toB,   setToB]   = useState(() => monthOffset(now, -3));

  const sA = useMemo(() => aggregateBills(billsInRange(bills, fromA, toA)), [bills, fromA, toA]);
  const sB = useMemo(() => aggregateBills(billsInRange(bills, fromB, toB)), [bills, fromB, toB]);

  const allTypes  = Array.from(new Set([...Object.keys(sA.byType), ...Object.keys(sB.byType)]));
  const typeChart = allTypes.map((t) => ({
    name:  BILL_TYPE_LABELS[t] ?? t,
    A:     +(sA.byType[t] ?? 0).toFixed(1),
    B:     +(sB.byType[t] ?? 0).toFixed(1),
    color: BILL_TYPE_COLORS[t] ?? "#6b7280",
  }));

  return (
    <PageLayout
      icon={<Scale className="w-6 h-6" />}
      title="Comparative Audit"
      subtitle="Side-by-side performance analysis of any two reporting periods"
    >
      {/* Period pickers — always visible */}
      <div className="grid grid-cols-2 gap-8">
        <PeriodPicker
          label="Observation Period A"
          color="var(--brand-green)"
          from={fromA} to={toA}
          onFromChange={setFromA} onToChange={setToA}
        />
        <PeriodPicker
          label="Observation Period B"
          color="var(--brand-orange)"
          from={fromB} to={toB}
          onFromChange={setFromB} onToChange={setToB}
        />
      </div>

      {loading ? (
        <div className="py-20">
          <Spinner label="Analyzing Historical Streams..." />
        </div>
      ) : (
        <div className="space-y-8 animate-scale-in">
          {/* Summary metric cards */}
          <div className="grid grid-cols-3 gap-6">
            {([
              {
                label: "Carbon Footprint", unit: "kgCO₂e",
                a: sA.co2,  b: sB.co2,
                fmt: (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 1 }),
              },
              {
                label: "Energy Intensity", unit: "kWh",
                a: sA.kwh,  b: sB.kwh,
                fmt: (v: number) => v.toLocaleString(),
              },
              {
                label: "Aggregate Cost", unit: "GBP",
                a: sA.cost, b: sB.cost,
                fmt: (v: number) => `£${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
              },
            ] as const).map(({ label, a, b, unit, fmt }) => (
              <div key={label} className="premium-card p-6">
                <p className="text-[10px] font-black uppercase tracking-widest mb-6 text-text-muted opacity-50 text-center">
                  {label}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-center space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-gt-green-600">Period A</p>
                    <p className="text-2xl font-black text-text-primary tracking-tighter">{fmt(a)}</p>
                    <p className="text-[9px] font-bold text-text-muted uppercase opacity-40">{unit}</p>
                  </div>
                  <div className="mb-2"><DeltaChip a={a} b={b} /></div>
                  <div className="text-center space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-brand-orange-dark">Period B</p>
                    <p className="text-2xl font-black text-text-primary tracking-tighter">{fmt(b)}</p>
                    <p className="text-[9px] font-bold text-text-muted uppercase opacity-40">{unit}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Resource comparison chart */}
          <ChartCard
            title="Resource Comparison Matrix"
            subtitle="Period A vs Period B Impact (kgCO₂e)"
            right={
              <div className="flex items-center gap-4">
                {[
                  { color: "bg-gt-green-600",     label: "Period A" },
                  { color: "bg-brand-orange-dark", label: "Period B" },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${color}`} />
                    <span className="text-[9px] font-black uppercase tracking-widest text-text-muted">{label}</span>
                  </div>
                ))}
              </div>
            }
          >
            {typeChart.length === 0 ? (
              <div className="h-[240px] flex items-center justify-center bg-bg-inset/30 rounded-3xl border border-dashed border-border-subtle">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                  No overlapping data detected
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={typeChart} barGap={12} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={CHART_AXIS_TICK} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={CHART_AXIS_TICK} />
                  <Tooltip cursor={CHART_CURSOR} contentStyle={CHART_TOOLTIP_STYLE} />
                  <Bar dataKey="A" name="Period A" fill="var(--brand-green-dark)"  radius={[6, 6, 0, 0]} />
                  <Bar dataKey="B" name="Period B" fill="var(--brand-orange-dark)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Granular stream breakdown table */}
          <div className="premium-card overflow-hidden">
            <div className="p-6 border-b border-border-subtle/50 bg-bg-inset/10">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">
                Granular Stream Breakdown
              </h2>
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
                        <td className="px-8 py-4 font-black text-xs">{BILL_TYPE_LABELS[t] ?? t}</td>
                        <td className="px-6 py-4 text-right font-black text-gt-green-600">
                          {a.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                        </td>
                        <td className="px-6 py-4 text-right font-black text-brand-orange-dark">
                          {b.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                        </td>
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
    </PageLayout>
  );
}
