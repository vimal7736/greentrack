"use client";

import { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { Scale, Leaf } from "lucide-react";
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
  const { bills, loading } = useBillsHistory(10);

  const [fromA, setFromA] = useState(() => monthOffset(now, -2));
  const [toA,   setToA]   = useState(() => monthOffset(now,  0));
  const [fromB, setFromB] = useState(() => monthOffset(now, -5));
  const [toB,   setToB]   = useState(() => monthOffset(now, -3));

  const sA = useMemo(() => aggregateBills(billsInRange(bills, fromA, toA)), [bills, fromA, toA]);
  const sB = useMemo(() => aggregateBills(billsInRange(bills, fromB, toB)), [bills, fromB, toB]);

  const allTypes = ["electricity", "gas", "water", "fuel_diesel", "fuel_petrol"];
  const typeChart = allTypes.map((t) => ({
    name:  BILL_TYPE_LABELS[t] ?? t,
    A:     +(sA.byType[t] ?? 0).toFixed(1),
    B:     +(sB.byType[t] ?? 0).toFixed(1),
    color: BILL_TYPE_COLORS[t] ?? "#6b7280",
  }));

  const co2Diff = sA.co2 - sB.co2;
  const costDiff = sA.cost - sB.cost;
  const isBetter = sA.co2 <= sB.co2;
  const co2ReductionPct = sB.co2 > 0 ? Math.abs((co2Diff / sB.co2) * 100) : 0;
  const co2Max = Math.max(sA.co2, sB.co2);
  const co2Min = Math.min(sA.co2, sB.co2);
  const co2Ratio = co2Min > 0 ? co2Max / co2Min : co2Max;
  const colorA = isBetter ? "var(--brand-green)" : "var(--brand-orange)";
  const colorB = isBetter ? "var(--brand-orange)" : "var(--brand-green)";
  const gradA = isBetter ? "from-emerald-500 to-gt-green-600" : "from-brand-orange to-orange-600";
  const gradB = isBetter ? "from-brand-orange to-orange-600" : "from-emerald-500 to-gt-green-600";
  const glowA = isBetter ? "rgba(16,185,129,0.4)" : "rgba(249,115,22,0.4)";
  const glowB = isBetter ? "rgba(249,115,22,0.4)" : "rgba(16,185,129,0.4)";

  return (
    <PageLayout
      icon={<Scale className="w-6 h-6" />}
      title="Comparative Audit"
      subtitle="Side-by-side performance analysis of any two reporting periods"
    >
      {/* Period pickers — always visible */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
        <PeriodPicker
          label="Observation Period A"
          color={colorA}
          from={fromA} to={toA}
          onFromChange={setFromA} onToChange={setToA}
        />
        <PeriodPicker
          label="Observation Period B"
          color={colorB}
          from={fromB} to={toB}
          onFromChange={setFromB} onToChange={setToB}
        />
      </div>

      {loading ? (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 relative overflow-hidden bg-[var(--neu-base)] border border-border-subtle/50 rounded-[24px] shadow-sm transition-colors duration-500 animate-scale-in">
          <div className="absolute w-[250px] h-[250px] rounded-full bg-brand-orange/5 blur-[100px] pointer-events-none" />
          
          <div className="relative w-48 h-48 flex items-center justify-center pointer-events-none">
            <Leaf 
              className="w-10 h-10 text-gt-orange-500 fill-gt-orange-500/10 filter drop-shadow-[0_0_10px_rgba(249,115,22,0.2)] absolute left-10 top-12"
              style={{
                animation: "smooth-float-orange 4.5s ease-in-out infinite",
              }}
            />

            <Leaf 
              className="w-10 h-10 text-text-primary fill-text-primary/10 filter drop-shadow-[0_0_10px_rgba(0,0,0,0.15)] absolute right-10 bottom-12"
              style={{
                animation: "smooth-float-black 5s ease-in-out infinite",
              }}
            />
          </div>

          <div className="relative z-10 flex flex-col items-center gap-2.5 text-center mt-4">
            <h2 className="text-sm font-black text-text-primary tracking-[0.3em] uppercase animate-[text-glow_2.5s_ease-in-out_infinite]">
              GreenTrack Comparative Audit
            </h2>
            <div className="h-[2px] w-20 bg-border-subtle rounded-full overflow-hidden relative">
              <div 
                className="h-full w-full animate-[progress-bar_2.5s_ease-in-out_infinite]"
                style={{
                  background: "linear-gradient(to right, var(--text-primary), var(--brand-orange))",
                }}
              />
            </div>
            <span className="text-[10px] text-text-muted font-bold tracking-widest uppercase opacity-80 mt-1">
              Analyzing historical billing records and performing carbon stream audits...
            </span>
          </div>

          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes smooth-float-green {
              0%, 100% {
                transform: translateY(0px) rotate(-15deg);
              }
              50% {
                transform: translateY(-12px) rotate(-5deg);
              }
            }
            @keyframes smooth-float-orange {
              0%, 100% {
                transform: translateY(0px) rotate(10deg);
              }
              50% {
                transform: translateY(-15px) rotate(20deg);
              }
            }
            @keyframes smooth-float-black {
              0%, 100% {
                transform: translateY(0px) rotate(25deg);
              }
              50% {
                transform: translateY(-10px) rotate(15deg);
              }
            }
            @keyframes text-glow {
              0%, 100% {
                opacity: 0.7;
              }
              50% {
                opacity: 1;
              }
            }
            @keyframes progress-bar {
              0% { transform: translateX(-100%); }
              50% { transform: translateX(0); }
              100% { transform: translateX(100%); }
            }
          `}} />
        </div>
      ) : (
        <div className="space-y-8 animate-scale-in">
          {/* Summary metric cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
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
            ] as const).map(({ label, a, b, unit, fmt }) => {
              const total = a + b;
              const pctA = total > 0 ? (a / total) * 100 : 50;
              const pctB = total > 0 ? (b / total) * 100 : 50;

              return (
                <div 
                  key={label} 
                  className="premium-card p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
                  style={{
                    background: "var(--neu-base)",
                    boxShadow: "var(--shadow-raised)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "24px",
                  }}
                >
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-gt-green-500/20 via-transparent to-brand-orange/20" />

                  <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 text-text-secondary opacity-70 text-center">
                    {label}
                  </p>

                  <div className="flex items-center justify-between gap-4 mb-6">
                    <div className="text-center space-y-1 bg-bg-inset/10 rounded-2xl p-2.5 min-w-[70px] border border-border-subtle/10 flex-1">
                      <p className="text-[8px] font-black uppercase tracking-[0.15em]" style={{ color: colorA }}>Period A</p>
                      <p className="text-2xl font-black text-text-primary tracking-tighter">{fmt(a)}</p>
                      <p className="text-[9px] font-black text-text-muted opacity-50 tracking-wider uppercase">{unit}</p>
                    </div>

                    <div className="flex flex-col items-center justify-center shrink-0">
                      <DeltaChip a={a} b={b} />
                      <span className="text-[8px] font-black text-text-muted opacity-40 uppercase tracking-widest mt-1">difference</span>
                    </div>

                    <div className="text-center space-y-1 bg-bg-inset/10 rounded-2xl p-2.5 min-w-[70px] border border-border-subtle/10 flex-1">
                      <p className="text-[8px] font-black uppercase tracking-[0.15em]" style={{ color: colorB }}>Period B</p>
                      <p className="text-2xl font-black text-text-primary tracking-tighter">{fmt(b)}</p>
                      <p className="text-[9px] font-black text-text-muted opacity-50 tracking-wider uppercase">{unit}</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-border-subtle/20">
                    <div className="flex items-center justify-between text-[9px] font-black text-text-secondary tracking-widest uppercase opacity-80 mb-1">
                      <span>Proportion</span>
                      <span className="text-[8px] opacity-40 text-text-muted">Balance</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-bg-inset/80 overflow-hidden flex p-[1.5px] border border-border-subtle shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)] relative">
                      <div 
                        className={`h-full rounded-full bg-gradient-to-r ${gradA} transition-all duration-700`} 
                        style={{ width: `${pctA}%`, boxShadow: `0 0 10px ${glowA}` }} 
                      />
                      {pctA > 0 && pctB > 0 && <div className="w-[2px] h-full bg-bg-inset/90 z-10 shrink-0" />}
                      <div 
                        className={`h-full rounded-full bg-gradient-to-r ${gradB} transition-all duration-700`} 
                        style={{ width: `${pctB}%`, boxShadow: `0 0 10px ${glowB}` }} 
                      />
                    </div>
                    <div className="flex justify-between text-[9px] font-black text-text-muted tracking-wider px-1 opacity-70">
                      <span className="font-bold" style={{ color: colorA }}>{pctA.toFixed(0)}%</span>
                      <span className="font-bold" style={{ color: colorB }}>{pctB.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* EcoPilot Comparative Auditor */}
          <div 
            className="rounded-2xl p-4 sm:p-6 border border-border-subtle relative overflow-hidden transition-all hover:scale-[1.005] animate-scale-in"
            style={{
              background: "var(--neu-base)",
              boxShadow: "var(--shadow-raised)",
            }}
          >
            {/* Auditor pulser tag */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gt-green-500 animate-pulse-green" />
              <span className="text-[8px] font-black uppercase tracking-wider text-text-muted opacity-80">EcoPilot Auditor</span>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-gt-green-500/10 border border-gt-green-500/30 flex items-center justify-center text-gt-green-500 shrink-0">
                <Scale className="w-5 h-5" />
              </div>
              <div className="space-y-1 sm:space-y-2">
                <h3 className="text-xs sm:text-sm font-black text-text-primary tracking-tight">
                  Comparative Performance Audit
                </h3>
                <p className="text-[11px] sm:text-xs text-text-secondary leading-relaxed font-semibold">
                  {co2Diff === 0 ? (
                    <span>Both observation periods show identical carbon footprint outputs. Upload more utility data to perform a deep-dive delta audit.</span>
                  ) : isBetter ? (
                    <span>
                      Outstanding efficiency! <strong className="font-bold" style={{ color: "var(--brand-green)" }}>Period A was {co2Ratio.toFixed(1)} times cleaner than Period B!</strong> This eco-friendly shift saved you <strong className="font-bold" style={{ color: "var(--brand-green)" }}>£{Math.abs(costDiff).toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong> in aggregate utility costs.
                    </span>
                  ) : (
                    <span>
                      Alert: <strong className="font-bold" style={{ color: "var(--brand-orange)" }}>Period A was {co2Ratio.toFixed(1)} times more polluting than Period B!</strong> Utility spend also rose by <strong className="font-bold" style={{ color: "var(--brand-orange)" }}>£{Math.abs(costDiff).toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>. We recommend auditing your highest emission source during this period in the Resource Comparison Matrix below.
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Resource comparison chart */}
          <ChartCard
            title="Resource Comparison Matrix"
            subtitle="Period A vs Period B Impact (kgCO₂e)"
            right={
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                {[
                  { color: "var(--brand-green)",  label: "Period A" },
                  { color: "var(--brand-orange)", label: "Period B" },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
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
                  <Bar dataKey="A" name="Period A" fill={colorA} radius={[6, 6, 0, 0]} />
                  <Bar dataKey="B" name="Period B" fill={colorB} radius={[6, 6, 0, 0]} />
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
                    <th className="text-left px-4 sm:px-8 py-4 sm:py-5">Emission Source</th>
                    <th className="text-right px-4 sm:px-6 py-4 sm:py-5">Period A (kg)</th>
                    <th className="text-right px-4 sm:px-6 py-4 sm:py-5">Period B (kg)</th>
                    <th className="text-right px-4 sm:px-8 py-4 sm:py-5">Delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/50">
                  {allTypes.map((t) => {
                    const a = sA.byType[t] ?? 0;
                    const b = sB.byType[t] ?? 0;
                    return (
                      <tr key={t} className="group hover:bg-bg-inset/30 transition-all duration-300">
                        <td className="px-4 sm:px-8 py-3 sm:py-4 font-black text-xs">{BILL_TYPE_LABELS[t] ?? t}</td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-right font-black" style={{ color: colorA }}>
                          {a.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-right font-black" style={{ color: colorB }}>
                          {b.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                        </td>
                        <td className="px-4 sm:px-8 py-3 sm:py-4 text-right">
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
