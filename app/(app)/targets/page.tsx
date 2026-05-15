"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  Target, TrendingDown, TrendingUp, Leaf, AlertTriangle, CheckCircle,
  Save, Clock, Award, BarChart2, Flame, ChevronRight, RefreshCw,
  Zap, ThermometerSun, Car,
} from "lucide-react";

import { useBillsHistory } from "@/hooks/useBillsHistory";
import { useTargets }      from "@/hooks/useTargets";
import { buildMonthlyMap, monthOffset } from "@/lib/carbon/aggregate";
import { CHART_AXIS_TICK, CHART_TOOLTIP_STYLE } from "@/lib/chart/config";
import { PageLayout }    from "@/components/ui/PageLayout";
import { Button }        from "@/components/ui/Button";
import { StatCard }      from "@/components/ui/StatCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { RangeSlider }   from "@/components/ui/RangeSlider";
import { AITipAdvisor } from "@/components/AITipAdvisor";

// ─── Local types ──────────────────────────────────────────────────────────────

interface ExtendedStat {
  month: string;
  actual:     number | null;
  target:     number;
  bau:        number;
  projection: number | null;
  projHigh:   number | null;
  isFuture:   boolean;
}

interface MilestoneItem {
  year:      number;
  label:     string;
  icon:      string;
  required:  number;
  projected: number;
  reduction: number;
  status:    "achieved" | "on-track" | "at-risk" | "missed";
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SBTI_MIN: Record<string, number> = { "1.5c": 4.2, "wbb2c": 2.5, "2c": 2.0 };
const SBTI_LABEL: Record<string, string> = { "1.5c": "1.5°C", "wbb2c": "WBB 2°C", "2c": "2°C" };

const STATUS_COLOR = {
  achieved:   { bar: "var(--brand-green)", badge: "rgba(34,197,94,.15)",  text: "#22c55e", label: "Achieved"  },
  "on-track": { bar: "#60a5fa",            badge: "rgba(96,165,250,.15)", text: "#60a5fa", label: "On Track"  },
  "at-risk":  { bar: "#f59e0b",            badge: "rgba(245,158,11,.15)", text: "#f59e0b", label: "At Risk"   },
  missed:     { bar: "#ef4444",            badge: "rgba(239,68,68,.15)",  text: "#ef4444", label: "Off Track" },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function BudgetRing({ used, total }: { used: number; total: number }) {
  const pct   = total > 0 ? Math.min(130, (used / total) * 100) : 0;
  const capped = Math.min(100, pct);
  const r     = 36;
  const circ  = 2 * Math.PI * r;
  const color = pct > 100 ? "#ef4444" : pct > 80 ? "#f59e0b" : "var(--brand-green)";
  return (
    <svg viewBox="0 0 90 90" className="w-20 h-20 flex-shrink-0">
      <circle cx="45" cy="45" r={r} fill="none" stroke="var(--border-subtle)" strokeWidth="9" />
      <circle cx="45" cy="45" r={r} fill="none" stroke={color} strokeWidth="9"
        strokeDasharray={`${circ * capped / 100} ${circ}`}
        strokeLinecap="round" transform="rotate(-90 45 45)"
        style={{ transition: "stroke-dasharray 0.8s ease" }}
      />
      <text x="45" y="43" textAnchor="middle" fontSize="13" fontWeight="900" fill={color}>
        {Math.round(pct)}%
      </text>
      <text x="45" y="57" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="var(--text-muted)">
        OF BUDGET
      </text>
    </svg>
  );
}

function SBTiGauge({ score, pathway }: { score: number; pathway: string }) {
  const r     = 52;
  const circ  = Math.PI * r;
  const filled = circ * Math.min(100, score) / 100;
  const color  = score >= 100 ? "var(--brand-green)" : score >= 70 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <svg viewBox="0 0 124 70" className="w-full max-w-[180px]">
        <path d="M 10 64 A 52 52 0 0 1 114 64" fill="none"
          stroke="var(--border-subtle)" strokeWidth="12" strokeLinecap="round" />
        <path d="M 10 64 A 52 52 0 0 1 114 64" fill="none"
          stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={`${filled} ${circ}`}
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
        <text x="62" y="56" textAnchor="middle" fontSize="20" fontWeight="900" fill={color}>
          {Math.round(score)}%
        </text>
        <text x="62" y="68" textAnchor="middle" fontSize="7" fontWeight="700" fill="var(--text-muted)">
          SBTi ALIGNMENT
        </text>
      </svg>
      <span className="text-[10px] font-black uppercase tracking-widest" style={{ color }}>
        {score >= 100 ? `✓ ${SBTI_LABEL[pathway]} Aligned` : `Below ${SBTI_LABEL[pathway]} Minimum`}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TargetsPage() {
  const { bills, loading: billsLoading }         = useBillsHistory(2);
  const { target: saved, loading: targetLoading, saving, saveTarget } = useTargets();

  const [monthlyData, setMonthlyData] = useState<{ month: string; co2: number }[]>([]);
  const [monthlyAvg,  setMonthlyAvg]  = useState(0);

  const [annualTarget,  setAnnualTarget]  = useState(5000);
  const [reductionPct,  setReductionPct]  = useState(7);
  const [sbtiPathway,   setSbtiPathway]   = useState<"1.5c" | "wbb2c" | "2c">("1.5c");
  const [notes,         setNotes]         = useState("");
  const [saveSuccess,   setSaveSuccess]   = useState(false);

  // ── Seed sliders from saved target ──────────────────────────────────────────
  useEffect(() => {
    if (!saved) return;
    setAnnualTarget(saved.annual_carbon_cap_kg);
    setReductionPct(saved.yearly_reduction_rate);
    setSbtiPathway((saved.sbti_pathway as "1.5c" | "wbb2c" | "2c") ?? "1.5c");
    setNotes(saved.notes ?? "");
  }, [saved]);

  // ── Build monthly data from bills ───────────────────────────────────────────
  useEffect(() => {
    if (billsLoading) return;
    const map    = buildMonthlyMap(bills, 24);
    const total  = Object.values(map).reduce((s, v) => s + v, 0);
    const cnt    = Object.keys(map).length;
    const avg    = cnt > 0 ? total / cnt : 0;
    setMonthlyAvg(avg);
    if (!saved) setAnnualTarget(Math.round(avg * 12 * 0.85));
    setMonthlyData(
      Object.entries(map).map(([ym, co2]) => ({
        month: ym.slice(0, 7),
        co2:   Math.round(co2 * 10) / 10,
      }))
    );
  }, [bills, billsLoading, saved]);

  // ── Extended chart: 24 past + 12 future ─────────────────────────────────────
  const chartData = useMemo<ExtendedStat[]>(() => {
    const now = new Date();
    const past: ExtendedStat[] = monthlyData.map((d, i) => {
      const isLast  = i === monthlyData.length - 1;
      const tgt     = Math.round((annualTarget / 12) * Math.pow(1 - reductionPct / 100, i / 12) * 10) / 10;
      const proj    = isLast ? d.co2 : null;
      return {
        month:      d.month,
        actual:     d.co2,
        target:     tgt,
        bau:        Math.round(monthlyAvg * 10) / 10,
        projection: proj,
        projHigh:   proj != null ? Math.round(proj * 1.15 * 10) / 10 : null,
        isFuture:   false,
      };
    });

    const future: ExtendedStat[] = Array.from({ length: 12 }, (_, i) => {
      const idx  = monthlyData.length + i;
      const tgt  = Math.round((annualTarget / 12) * Math.pow(1 - reductionPct / 100, idx / 12) * 10) / 10;
      const proj = Math.round(monthlyAvg * Math.pow(1 - (reductionPct / 100) * 0.55, (i + 1) / 12) * 10) / 10;
      return {
        month:      monthOffset(now, i + 1),
        actual:     null,
        target:     tgt,
        bau:        Math.round(monthlyAvg * 10) / 10,
        projection: proj,
        projHigh:   Math.round(proj * 1.15 * 10) / 10,
        isFuture:   true,
      };
    });

    return [...past, ...future];
  }, [monthlyData, annualTarget, reductionPct, monthlyAvg]);

  // ── KPIs ────────────────────────────────────────────────────────────────────
  const now         = new Date();
  const thisYear    = now.getFullYear().toString();
  const ytdCo2      = monthlyData.filter((d) => d.month.startsWith(thisYear)).reduce((s, d) => s + d.co2, 0);
  const ytdTarget   = (annualTarget / 12) * (now.getMonth() + 1);
  const ytdPct      = ytdTarget > 0 ? (ytdCo2 / ytdTarget) * 100 : 0;
  const onTrack     = ytdCo2 <= ytdTarget;

  const netZeroYear = monthlyAvg > 0
    ? Math.ceil(now.getFullYear() + Math.log(10 / (monthlyAvg * 12)) / Math.log(1 - reductionPct / 100))
    : null;

  const sbtiScore      = Math.min(100, (reductionPct / SBTI_MIN[sbtiPathway]) * 100);
  const totalCostGbp   = bills.reduce((s, b) => s + (b.cost_gbp ?? 0), 0);
  const totalCo2All    = bills.reduce((s, b) => s + b.co2_kg, 0);
  const co2Intensity   = totalCostGbp > 0 ? (totalCo2All / totalCostGbp) * 1000 : 0;
  const monthsLeft     = 12 - (now.getMonth() + 1);
  const yearEndForecast = ytdCo2 + monthlyAvg * monthsLeft;
  const yearEndGap      = yearEndForecast - annualTarget;

  // ── Milestones ──────────────────────────────────────────────────────────────
  const baselineAnnual = monthlyAvg * 12;
  const currentYear    = now.getFullYear();

  const milestones = useMemo<MilestoneItem[]>(() => [
    { year: 2025, label: "Initial Targets",        icon: "🌱", required: 0.10 },
    { year: 2027, label: "Interim Pathway",         icon: "📈", required: 0.25 },
    { year: 2030, label: "Paris Commitment",        icon: "🌍", required: 0.50 },
    { year: 2035, label: "Deep Decarbonization",    icon: "⚡", required: 0.75 },
    { year: 2050, label: "Net Zero",                icon: "🎯", required: 0.95 },
  ].map((m) => {
    const yrs       = m.year - currentYear;
    const projected = baselineAnnual * Math.pow(1 - reductionPct / 100, Math.max(0, yrs));
    const reduction = baselineAnnual > 0 ? 1 - projected / baselineAnnual : 0;
    const gap       = m.required - reduction;
    const isPast    = yrs <= 0;
    const status: MilestoneItem["status"] =
      isPast && reduction >= m.required ? "achieved"
      : gap <= 0                        ? "on-track"
      : gap <= 0.1                      ? "at-risk"
                                        : "missed";
    return { ...m, projected, reduction, status };
  }), [baselineAnnual, reductionPct, currentYear]);

  // ── Quick Wins ──────────────────────────────────────────────────────────────
  const quickWins = useMemo(() => {
    const byType = bills.reduce<Record<string, number>>((acc, b) => {
      acc[b.bill_type] = (acc[b.bill_type] ?? 0) + b.co2_kg;
      return acc;
    }, {});
    const wins: { title: string; saving: number; Icon: React.ElementType; type: string }[] = [];
    if ((byType.electricity ?? 0) > 0)
      wins.push({ title: "Switch to Renewables", saving: Math.round(byType.electricity * 0.40), Icon: Zap,            type: "Electricity" });
    if ((byType.gas ?? 0) > 0)
      wins.push({ title: "Heat Pump Upgrade",    saving: Math.round(byType.gas * 0.55),          Icon: ThermometerSun, type: "Gas" });
    if (((byType.fuel_diesel ?? 0) + (byType.fuel_petrol ?? 0)) > 0)
      wins.push({ title: "Fleet Electrification", saving: Math.round(((byType.fuel_diesel ?? 0) + (byType.fuel_petrol ?? 0)) * 0.70), Icon: Car, type: "Transport" });
    wins.push({ title: "LED Lighting Upgrade",  saving: Math.round(baselineAnnual * 0.04),       Icon: Zap,            type: "General" });
    return wins.slice(0, 3);
  }, [bills, baselineAnnual]);

  // ── Unsaved changes ─────────────────────────────────────────────────────────
  const hasUnsaved = Boolean(
    saved && (
      Math.abs(saved.annual_carbon_cap_kg - annualTarget) > 50 ||
      Math.abs(saved.yearly_reduction_rate - reductionPct) > 0.1
    )
  );

  // ── Save handler ─────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    const ok = await saveTarget({
      annual_carbon_cap_kg:  annualTarget,
      yearly_reduction_rate: reductionPct,
      net_zero_target_year:  netZeroYear ?? undefined,
      sbti_pathway:          sbtiPathway,
      notes,
    });
    if (ok) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  }, [annualTarget, reductionPct, netZeroYear, sbtiPathway, notes, saveTarget]);

  const loading = billsLoading || targetLoading;

  return (
    <PageLayout
      icon={<Target className="w-6 h-6" />}
      title="Reduction Strategy"
      subtitle="Science-based trajectories · Live scenario modelling · Team targets"
      loading={loading}
      loadingLabel="Calculating Pathways…"
    >
      {/* ── 6 Stat Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {[
          {
            label: "YTD Carbon",
            value: `${(ytdCo2 / 1000).toFixed(2)} t`,
            sub:   `Limit ${(ytdTarget / 1000).toFixed(2)} t`,
            Icon:  onTrack ? TrendingDown : TrendingUp,
            color: onTrack ? "text-gt-green-600" : "text-red-500",
            bg:    onTrack ? "bg-gt-green-500/10" : "bg-red-500/10",
            accent: (onTrack ? "green" : "orange") as "green" | "orange",
          },
          {
            label: "Budget Used",
            value: `${ytdPct.toFixed(0)}%`,
            sub:   onTrack ? "Under budget ✓" : "Over budget ✗",
            Icon:  onTrack ? CheckCircle : AlertTriangle,
            color: onTrack ? "text-gt-green-600" : "text-brand-orange-dark",
            bg:    onTrack ? "bg-gt-green-500/10" : "bg-brand-orange/10",
            accent: (onTrack ? "green" : "orange") as "green" | "orange",
          },
          {
            label: "Monthly Avg",
            value: `${monthlyAvg.toFixed(0)} kg`,
            sub:   "24-month stream",
            Icon:  BarChart2,
            color: "text-gt-green-700",
            bg:    "bg-gt-green-500/10",
            accent: "green" as "green",
          },
          {
            label: "Net Zero",
            value: netZeroYear ? String(netZeroYear) : "—",
            sub:   `At ${reductionPct}% / yr`,
            Icon:  Target,
            color: "text-brand-orange-dark",
            bg:    "bg-brand-orange/10",
            accent: "orange" as "orange",
          },
          {
            label: "SBTi Score",
            value: `${Math.round(sbtiScore)}%`,
            sub:   sbtiScore >= 100 ? "Fully Aligned ✓" : "Below Minimum",
            Icon:  Award,
            color: sbtiScore >= 100 ? "text-gt-green-600" : "text-amber-500",
            bg:    sbtiScore >= 100 ? "bg-gt-green-500/10" : "bg-amber-400/10",
            accent: (sbtiScore >= 100 ? "green" : "orange") as "green" | "orange",
          },
          {
            label: "CO₂ Intensity",
            value: co2Intensity.toFixed(1),
            sub:   "kg per £1,000 spend",
            Icon:  Flame,
            color: "text-text-primary",
            bg:    "bg-bg-inset",
            accent: "green" as "green",
          },
        ].map(({ label, value, sub, Icon, color, bg, accent }) => (
          <StatCard key={label} label={label} value={value} sub={sub}
            icon={<Icon className={`w-5 h-5 ${color}`} />}
            iconBg={bg} valueColor={color} accent={accent}
          />
        ))}
      </div>

      {/* ── Controls + Chart ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* Controls panel */}
        <div className="lg:col-span-1 premium-card p-4 sm:p-7 flex flex-col gap-5 sm:gap-6">
          <div className="flex items-center justify-between">
            <SectionHeader title="Scenario Parameters" subtitle="Model your reduction pathway" />
            {hasUnsaved && (
              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full"
                style={{ background: "rgba(245,158,11,.15)", color: "#f59e0b" }}>
                Unsaved
              </span>
            )}
          </div>

          {/* SBTi Pathway selector */}
          <div className="space-y-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-text-muted">SBTi Pathway</span>
            <div className="flex gap-1.5 sm:gap-2">
              {(["1.5c", "wbb2c", "2c"] as const).map((p) => (
                <button key={p}
                  onClick={() => {
                    setSbtiPathway(p);
                    if (reductionPct < SBTI_MIN[p]) setReductionPct(SBTI_MIN[p]);
                  }}
                  className="flex-1 py-2 px-1 rounded-xl text-[9px] font-black uppercase tracking-wide transition-all"
                  style={{
                    background:  sbtiPathway === p ? "var(--brand-green)" : "var(--bg-inset)",
                    color:       sbtiPathway === p ? "#fff" : "var(--text-muted)",
                    boxShadow:   sbtiPathway === p ? "0 4px 14px rgba(0,0,0,.25)" : undefined,
                  }}
                >
                  {SBTI_LABEL[p]}
                </button>
              ))}
            </div>
          </div>

          <RangeSlider label="Annual Carbon Cap" value={annualTarget} min={500} max={50000} step={100}
            onChange={setAnnualTarget} unit="kg / yr" accent="var(--brand-green)" />

          <RangeSlider label="Yearly Reduction Rate" value={reductionPct} min={1} max={30} step={1}
            onChange={setReductionPct} unit="% / yr" accent="var(--brand-orange)" />

          {/* Budget ring + year-end forecast */}
          <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl"
            style={{ background: "var(--neu-base)", boxShadow: "var(--shadow-inset)" }}>
            <BudgetRing used={ytdCo2} total={ytdTarget} />
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">Year-End Forecast</p>
              <p className={`text-lg font-black ${yearEndGap > 0 ? "text-red-500" : "text-gt-green-600"}`}>
                {yearEndGap > 0 ? "+" : ""}{(yearEndGap / 1000).toFixed(2)} t
              </p>
              <p className="text-[9px] font-bold text-text-muted">
                {yearEndGap > 0 ? "projected overshoot" : "projected saving"}
              </p>
            </div>
          </div>

          {/* Notes */}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add context or notes for this target…"
            rows={2}
            className="w-full rounded-xl p-3 text-[11px] text-text-primary resize-none focus:outline-none focus:ring-1 placeholder:text-text-muted"
            style={{ background: "var(--bg-inset)", border: "1px solid var(--border-subtle)" }}
          />

          {/* Save button */}
          <Button variant="primary" size="lg" onClick={handleSave} disabled={saving} className="w-full">
            {saving ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Saving…</>
            ) : saveSuccess ? (
              <><CheckCircle className="w-4 h-4" /> Saved!</>
            ) : (
              <><Save className="w-4 h-4" /> Save Target</>
            )}
          </Button>

          {saved && (
            <p className="text-center text-[9px] font-bold text-text-muted flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" />
              Last saved{" "}
              {new Date(saved.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          )}

          <div className="p-3 rounded-xl text-[9px] font-bold text-text-muted leading-relaxed text-center"
            style={{ background: "var(--neu-base)", boxShadow: "var(--shadow-inset)" }}>
            <span className="text-gt-green-600 font-black">SBTi</span> requires min{" "}
            <span className="text-text-primary font-black">{SBTI_MIN[sbtiPathway]}% / yr</span>{" "}
            for {SBTI_LABEL[sbtiPathway]} alignment.
          </div>
        </div>

        {/* Multi-scenario chart */}
        <div className="lg:col-span-2 premium-card p-4 sm:p-7 flex flex-col gap-5 sm:gap-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 justify-between">
            <SectionHeader
              title="Multi-Scenario Trajectory"
              subtitle="Historical · Target pathway · Business-as-usual · 12-month projection"
            />
            <div className="flex flex-wrap gap-2 sm:gap-4 items-center">
              {[
                { color: "var(--brand-green)",      label: "Actual",     dash: false },
                { color: "var(--brand-orange-dark)", label: "Target",     dash: true  },
                { color: "#6b7280",                  label: "BAU",        dash: true  },
                { color: "#60a5fa",                  label: "Projection", dash: true  },
              ].map(({ color, label, dash }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <svg width="18" height="4">
                    <line x1="0" y1="2" x2="18" y2="2"
                      stroke={color} strokeWidth="2"
                      strokeDasharray={dash ? "4 3" : undefined}
                    />
                  </svg>
                  <span className="text-[8px] font-black uppercase tracking-widest text-text-muted">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 rounded-xl p-3" style={{ background: "var(--neu-base)", boxShadow: "var(--shadow-inset)" }}>
            <div className="h-[240px] sm:h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false}
                    tick={CHART_AXIS_TICK} tickFormatter={(v) => v.slice(2)} dy={10}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={CHART_AXIS_TICK} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />

                  {/* Confidence band around projection */}
                  <Area dataKey="projHigh" fill="#60a5fa" fillOpacity={0.08} stroke="none" />

                  {/* BAU — flat line */}
                  <Line type="monotone" dataKey="bau" stroke="#6b7280" strokeWidth={1.5}
                    strokeDasharray="4 4" dot={false} name="BAU" connectNulls />

                  {/* Target pathway */}
                  <Line type="monotone" dataKey="target" stroke="var(--brand-orange-dark)" strokeWidth={2}
                    strokeDasharray="8 4" dot={false} name="Target" connectNulls />

                  {/* Future projection */}
                  <Line type="monotone" dataKey="projection" stroke="#60a5fa" strokeWidth={2}
                    strokeDasharray="5 3" dot={false} name="Projection" connectNulls />

                  {/* Actual historical */}
                  <Line type="monotone" dataKey="actual" stroke="var(--brand-green)" strokeWidth={3}
                    dot={{ r: 3, fill: "var(--brand-green)", strokeWidth: 0 }}
                    activeDot={{ r: 7, strokeWidth: 0 }} name="Actual"
                  />

                  <ReferenceLine y={annualTarget / 12}
                    stroke="var(--text-muted)" strokeDasharray="6 3" opacity={0.25}
                    label={{ value: "Cap", fill: "var(--text-muted)", fontSize: 9, position: "right" }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Insight strip */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              {
                label: "Current Trajectory",
                value: `${(yearEndForecast / 1000).toFixed(2)} t`,
                sub:   "projected year-end",
                color: yearEndGap > 0 ? "#ef4444" : "var(--brand-green)",
              },
              {
                label: "Annual Target",
                value: `${(annualTarget / 1000).toFixed(2)} t`,
                sub:   "set cap",
                color: "var(--brand-orange-dark)",
              },
              {
                label: "Gap",
                value: `${yearEndGap > 0 ? "+" : ""}${(yearEndGap / 1000).toFixed(2)} t`,
                sub:   yearEndGap > 0 ? "overshoot" : "under target",
                color: yearEndGap > 0 ? "#ef4444" : "var(--brand-green)",
              },
            ].map(({ label, value, sub, color }) => (
              <div key={label} className="rounded-xl p-3 text-center"
                style={{ background: "var(--bg-inset)", border: "1px solid var(--border-subtle)" }}>
                <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-1">{label}</p>
                <p className="text-base font-black" style={{ color }}>{value}</p>
                <p className="text-[9px] font-bold text-text-muted">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* Milestones */}
        <div className="premium-card p-4 sm:p-7 space-y-4 sm:space-y-5">
          <SectionHeader title="Reduction Milestones" subtitle="Your decarbonization roadmap" />
          <div className="space-y-3">
            {milestones.map((m) => {
              const s = STATUS_COLOR[m.status];
              return (
                <div key={m.year} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: "var(--neu-base)", boxShadow: "var(--shadow-inset)" }}>
                  <span className="text-base leading-none">{m.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-text-primary">{m.year}</span>
                      <span className="text-[9px] font-bold text-text-muted truncate">{m.label}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 rounded-full overflow-hidden"
                        style={{ background: "var(--border-subtle)" }}>
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{
                            width:      `${Math.min(100, m.reduction * 100).toFixed(1)}%`,
                            background: s.bar,
                          }} />
                      </div>
                      <span className="text-[9px] font-bold text-text-muted flex-shrink-0">
                        {(m.required * 100).toFixed(0)}% req
                      </span>
                    </div>
                  </div>
                  <span className="text-[8px] font-black uppercase px-2 py-1 rounded-full flex-shrink-0"
                    style={{ background: s.badge, color: s.text }}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* SBTi Gauge */}
        <div className="premium-card p-4 sm:p-7 flex flex-col items-center gap-5 sm:gap-6">
          <SectionHeader title="SBTi Alignment" subtitle="Science Based Targets initiative" />
          <SBTiGauge score={sbtiScore} pathway={sbtiPathway} />
          <div className="w-full space-y-3">
            {(["1.5c", "wbb2c", "2c"] as const).map((p) => {
              const pctFill = Math.min(100, (reductionPct / SBTI_MIN[p]) * 100);
              return (
                <div key={p} className="flex items-center gap-3">
                  <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider w-14 flex-shrink-0">
                    {SBTI_LABEL[p]}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden"
                    style={{ background: "var(--border-subtle)" }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pctFill}%`, background: "var(--brand-green)" }} />
                  </div>
                  <span className="text-[9px] font-black text-text-primary flex-shrink-0">
                    {SBTI_MIN[p]}% min
                  </span>
                </div>
              );
            })}
          </div>
          <div className="w-full p-3 rounded-xl text-[9px] font-bold text-text-muted text-center"
            style={{ background: "var(--neu-base)", boxShadow: "var(--shadow-inset)" }}>
            Your rate{" "}
            <span className="text-text-primary font-black">{reductionPct}% / yr</span>
            {" · "}Required{" "}
            <span className="font-black" style={{ color: "var(--brand-green)" }}>
              {SBTI_MIN[sbtiPathway]}% / yr
            </span>
          </div>
        </div>

        {/* Quick Wins & AI Advisor */}
        <div className="space-y-4 sm:space-y-6">
          <AITipAdvisor 
            ytdCo2={ytdCo2}
            annualTarget={annualTarget}
            reductionPct={reductionPct}
            billTypes={Array.from(new Set(bills.map(b => b.bill_type)))}
            sbtiPathway={sbtiPathway}
          />

          <div className="premium-card p-4 sm:p-7 space-y-4 sm:space-y-5">
            <SectionHeader title="Quick Wins" subtitle="Top actions to accelerate your trajectory" />
          <div className="space-y-3">
            {quickWins.map((w) => (
              <div key={w.title}
                className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:scale-[1.01] transition-transform"
                style={{ background: "var(--neu-base)", boxShadow: "var(--shadow-inset)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--bg-inset)" }}>
                  <w.Icon className="w-4 h-4 text-gt-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-text-primary truncate">{w.title}</p>
                  <p className="text-[9px] font-bold text-text-muted">{w.type}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[11px] font-black text-gt-green-600">
                    -{(w.saving / 1000).toFixed(1)} t
                  </p>
                  <p className="text-[8px] font-bold text-text-muted">CO₂ / yr</p>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between p-3 rounded-xl"
              style={{ background: "var(--brand-green)", boxShadow: "0 4px 15px rgba(0,0,0,.2)" }}>
              <span className="text-[10px] font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Leaf className="w-4 h-4" /> Total Potential
              </span>
              <span className="text-sm font-black text-white">
                -{(quickWins.reduce((s, w) => s + w.saving, 0) / 1000).toFixed(1)} t CO₂ / yr
              </span>
            </div>
          </div>
          <button className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wider text-text-muted hover:text-gt-green-600 transition-colors">
            View All Recommendations <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
    </PageLayout>
  );
}
