"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { Target, TrendingDown, Leaf, AlertTriangle, CheckCircle } from "lucide-react";

import { useBillsHistory } from "@/hooks/useBillsHistory";
import { buildMonthlyMap } from "@/lib/carbon/aggregate";
import { CHART_AXIS_TICK, CHART_TOOLTIP_STYLE } from "@/lib/chart/config";
import { PageLayout } from "@/components/ui/PageLayout";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { HeroBanner } from "@/components/ui/HeroBanner";
import { RangeSlider } from "@/components/ui/RangeSlider";
import type { MonthStat } from "@/types";

export default function TargetsPage() {
  const { bills, loading } = useBillsHistory(2);

  const [monthlyData, setMonthlyData] = useState<MonthStat[]>([]);
  const [monthlyAvg,  setMonthlyAvg]  = useState(0);

  const [annualTarget, setAnnualTarget] = useState(5000);
  const [reductionPct, setReductionPct] = useState(7);

  useEffect(() => {
    if (loading) return;

    const map    = buildMonthlyMap(bills, 24);
    const total  = Object.values(map).reduce((s, v) => s + v, 0);
    const months = Object.keys(map).length;
    const avg    = months > 0 ? total / months : 0;

    setMonthlyAvg(avg);
    setAnnualTarget(Math.round(avg * 12 * 0.85));

    setMonthlyData(
      Object.entries(map).map(([ym, co2]) => ({
        month:  ym.slice(0, 7),
        co2:    Math.round(co2 * 10) / 10,
        target: 0,
      }))
    );
  }, [bills, loading]);

  const chartData = useMemo<MonthStat[]>(() => {
    return monthlyData.map((d, i) => ({
      ...d,
      target: Math.round((annualTarget / 12) * Math.pow(1 - reductionPct / 100, i / 12) * 10) / 10,
    }));
  }, [monthlyData, annualTarget, reductionPct]);

  const thisYear  = new Date().getFullYear().toString();
  const ytdCo2    = chartData.filter((d) => d.month.startsWith(thisYear)).reduce((s, d) => s + d.co2, 0);
  const ytdTarget = (annualTarget / 12) * (new Date().getMonth() + 1);
  const ytdPct    = ytdTarget > 0 ? (ytdCo2 / ytdTarget) * 100 : 0;
  const onTrack   = ytdCo2 <= ytdTarget;

  const netZeroYear = monthlyAvg > 0
    ? Math.ceil(new Date().getFullYear() + Math.log(10 / (monthlyAvg * 12)) / Math.log(1 - reductionPct / 100))
    : null;

  return (
    <PageLayout
      icon={<Target className="w-6 h-6" />}
      title="Reduction Strategy"
      subtitle="Science-based trajectories and climate action goals"
      loading={loading}
      loadingLabel="Calculating Pathways..."
    >
      <div className="grid grid-cols-4 gap-6">
        {[
          {
            label: "YTD Carbon",      value: `${(ytdCo2 / 1000).toFixed(2)} t`,
            sub: `Limit: ${(ytdTarget / 1000).toFixed(2)} t`,
            Icon: TrendingDown,
            color: onTrack ? "text-gt-green-600" : "text-brand-orange-dark",
            bg:    onTrack ? "bg-gt-green-500/10" : "bg-brand-orange/10",
            accent: onTrack ? "green" : "orange",
          },
          {
            label: "Budget Velocity", value: `${ytdPct.toFixed(0)}%`,
            sub: onTrack ? "Operational Efficiency" : "Correction Needed",
            Icon: onTrack ? CheckCircle : AlertTriangle,
            color: onTrack ? "text-gt-green-600" : "text-brand-orange-dark",
            bg:    onTrack ? "bg-gt-green-500/10" : "bg-brand-orange/10",
            accent: onTrack ? "green" : "orange",
          },
          {
            label: "Average Stream",  value: `${monthlyAvg.toFixed(0)} kg`,
            sub: "24-Month Average",
            Icon: Leaf,
            color: "text-gt-green-700", bg: "bg-gt-green-500/10", accent: "green",
          },
          {
            label: "Net Zero Hub",    value: netZeroYear ? String(netZeroYear) : "—",
            sub: `Target: ${reductionPct}% / yr`,
            Icon: Target,
            color: "text-brand-orange-dark", bg: "bg-brand-orange/10", accent: "orange",
          },
        ].map(({ label, value, sub, Icon, color, bg, accent }) => (
          <StatCard
            key={label}
            label={label}
            value={value}
            sub={sub}
            icon={<Icon className={`w-5 h-5 ${color}`} />}
            iconBg={bg}
            valueColor={color}
            accent={accent as "green" | "orange"}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Target Controls */}
        <div className="col-span-1 premium-card p-8 space-y-10">
          <SectionHeader
            title="Scenario Parameters"
            subtitle="Fine-tune your reduction model"
          />

          <div className="space-y-10">
            <RangeSlider
              label="Annual Carbon Cap"
              value={annualTarget} min={500} max={50000} step={100}
              onChange={setAnnualTarget} unit="kg/yr" accent="var(--brand-green)"
            />
            <RangeSlider
              label="Yearly Reduction Rate"
              value={reductionPct} min={1} max={30} step={1}
              onChange={setReductionPct} unit="% / yr" accent="var(--brand-orange)"
            />
          </div>

          <div className="p-4 rounded-2xl text-[10px] font-bold text-text-muted leading-relaxed"
            style={{ background: "var(--neu-base)", boxShadow: "var(--shadow-inset)" }}>
            <span className="text-gt-green-600 font-black">ADVISORY:</span> SBTi mandates a minimum{" "}
            <span className="text-text-primary font-black">4.2% reduction</span> for 1.5°C Paris alignment.
          </div>
        </div>

        {/* Trajectory Chart */}
        <div className="col-span-2 premium-card p-8 relative overflow-hidden">
          <div className="flex items-center justify-between mb-10">
            <SectionHeader
              title="Trajectory Audit"
              subtitle="Actual Performance vs Theoretical Pathway"
            />
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gt-green-500" />
                <span className="text-[9px] font-black uppercase tracking-widest text-text-muted">Actual</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-brand-orange-dark border-2 border-dashed border-white" />
                <span className="text-[9px] font-black uppercase tracking-widest text-text-muted">Pathway</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl p-2" style={{ background: "var(--neu-base)", boxShadow: "var(--shadow-inset)" }}>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                  <XAxis
                    dataKey="month" axisLine={false} tickLine={false}
                    tick={CHART_AXIS_TICK} tickFormatter={(v) => v.slice(2)} dy={10}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={CHART_AXIS_TICK} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <ReferenceLine y={annualTarget / 12} stroke="var(--text-muted)" strokeDasharray="6 6" opacity={0.3} />
                  <Line
                    type="monotone" dataKey="co2" stroke="var(--brand-green)" strokeWidth={4}
                    dot={{ r: 4, fill: "var(--brand-green)", strokeWidth: 0 }}
                    activeDot={{ r: 8, strokeWidth: 0 }} name="Actual"
                  />
                  <Line
                    type="monotone" dataKey="target" stroke="var(--brand-orange-dark)" strokeWidth={2}
                    strokeDasharray="8 4" dot={false} name="Target"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <HeroBanner
        icon={<Target className="w-8 h-8 text-gt-green-400" />}
        bgIcon={<Leaf className="w-48 h-48" />}
        title="Science Based Targets Initiative (SBTi)"
        subtitle={`Your current trajectory projects Net Zero alignment around ${netZeroYear ?? "N/A"}. To accelerate your climate transition, consider aggressive efficiency upgrades or renewable energy sourcing to align with the global 1.5°C pathway. Every percentage point in your reduction rate compounds into years saved on your journey to decarbonization.`}
        action={
          <Button variant="primary" size="lg" className="bg-gt-green-500 hover:bg-white hover:text-black">
            Model 2030 Goals
          </Button>
        }
      />
    </PageLayout>
  );
}
