"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { useTheme } from "next-themes";
import { Target, TrendingDown, Leaf, AlertTriangle, CheckCircle } from "lucide-react";

type MonthStat = { month: string; co2: number; target: number };

export default function TargetsPage() {
  const { resolvedTheme } = useTheme();
  const [mounted,     setMounted]     = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [monthlyData, setMonthlyData] = useState<MonthStat[]>([]);
  const [totalCo2,    setTotalCo2]    = useState(0);
  const [monthlyAvg,  setMonthlyAvg]  = useState(0);

  /* User-configurable targets */
  const [annualTarget,    setAnnualTarget]    = useState(5000);   /* kg/year */
  const [reductionPct,    setReductionPct]    = useState(7);      /* % per year (SBTi ~1.5°C pathway) */
  const [baselineYear,    setBaselineYear]    = useState(2023);

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
      const { data: bills } = await supabase
        .from("bills")
        .select("bill_date,co2_kg")
        .eq("org_id", profile.org_id)
        .gte("bill_date", twoYearsAgo.toISOString().slice(0, 10))
        .order("bill_date", { ascending: true });

      if (!bills) return setLoading(false);

      /* Build 24-month map */
      const now    = new Date();
      const map: Record<string, number> = {};
      for (let i = 23; i >= 0; i--) {
        const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        map[key]  = 0;
      }
      for (const b of bills) {
        const p = b.bill_date?.slice(0, 7);
        if (p && map[p] !== undefined) map[p] += b.co2_kg ?? 0;
      }

      const total   = Object.values(map).reduce((s, v) => s + v, 0);
      const months  = Object.keys(map).length;
      const avg     = months > 0 ? total / months : 0;

      setTotalCo2(total);
      setMonthlyAvg(avg);
      setAnnualTarget(Math.round(avg * 12 * 0.85)); /* default: 15% below current rate */

      setMonthlyData(
        Object.entries(map).map(([ym, co2]) => ({
          month:  ym.slice(0, 7),
          co2:    Math.round(co2 * 10) / 10,
          target: 0, /* filled below */
        }))
      );
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

  /* Monthly target line: annualTarget / 12, declining at reductionPct%/yr */
  const chartData = useMemo<MonthStat[]>(() => {
    return monthlyData.map((d, i) => ({
      ...d,
      target: Math.round((annualTarget / 12) * Math.pow(1 - reductionPct / 100, i / 12) * 10) / 10,
    }));
  }, [monthlyData, annualTarget, reductionPct]);

  /* YTD progress */
  const thisYear    = new Date().getFullYear().toString();
  const ytdCo2      = chartData.filter((d) => d.month.startsWith(thisYear)).reduce((s, d) => s + d.co2, 0);
  const ytdTarget   = (annualTarget / 12) * (new Date().getMonth() + 1);
  const ytdPct      = ytdTarget > 0 ? (ytdCo2 / ytdTarget) * 100 : 0;
  const onTrack     = ytdCo2 <= ytdTarget;

  /* Net zero projection at current rate */
  const netZeroYear = monthlyAvg > 0
    ? Math.ceil(new Date().getFullYear() + Math.log(10 / (monthlyAvg * 12)) / Math.log(1 - reductionPct / 100))
    : null;

  const tooltipStyle = {
    background: isDark ? "#1c1c1c" : "#f5f0e8",
    border:     `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
    borderRadius: 8, color: text, fontSize: 11, fontWeight: 600,
  };

  function Slider({ label, value, min, max, step, onChange, unit }: {
    label: string; value: number; min: number; max: number;
    step: number; onChange: (v: number) => void; unit: string;
  }) {
    return (
      <div>
        <div className="flex justify-between mb-2">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: muted }}>{label}</p>
          <p className="text-xs font-black" style={{ color: text }}>{value.toLocaleString()} {unit}</p>
        </div>
        <div className="relative h-6 flex items-center">
          <div className="w-full h-2 rounded-full"
               style={{ background: base, boxShadow: inset }}>
            <div className="h-full rounded-full transition-all"
                 style={{
                   width: `${((value - min) / (max - min)) * 100}%`,
                   background: "var(--brand-green)",
                 }} />
          </div>
          <input
            type="range" min={min} max={max} step={step} value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer h-6"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" style={{ color: text }}>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
             style={{ background: base, boxShadow: raised }}>
          <Target className="w-5 h-5" style={{ color: "var(--brand-orange)" }} />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Reduction Targets</h1>
          <p className="text-sm" style={{ color: muted }}>
            Track your Net Zero trajectory and science-based targets
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16" style={{ color: muted }}>Loading data…</div>
      ) : (
        <>
          {/* YTD status + key metrics */}
          <div className="grid grid-cols-4 gap-4">
            {[
              {
                label: "YTD Emissions",
                value: `${(ytdCo2 / 1000).toFixed(2)} t`,
                sub:   `Target: ${(ytdTarget / 1000).toFixed(2)} t`,
                Icon: TrendingDown,
                color: onTrack ? "#22c55e" : "#f97316",
              },
              {
                label: "Budget Used",
                value: `${ytdPct.toFixed(0)}%`,
                sub:   onTrack ? "On track ✓" : "Over budget",
                Icon: onTrack ? CheckCircle : AlertTriangle,
                color: onTrack ? "#22c55e" : "#f97316",
              },
              {
                label: "Monthly Avg",
                value: `${monthlyAvg.toFixed(0)} kg`,
                sub:   "Last 24 months",
                Icon: Leaf,
                color: "var(--brand-green-dark)",
              },
              {
                label: "Net Zero ETA",
                value: netZeroYear ? String(netZeroYear) : "—",
                sub:   `At ${reductionPct}% annual reduction`,
                Icon: Target,
                color: "var(--brand-orange)",
              },
            ].map(({ label, value, sub, Icon, color }) => (
              <div key={label} className="rounded-2xl p-5"
                   style={{ background: base, boxShadow: raised }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: muted }}>{label}</p>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                       style={{ background: base, boxShadow: inset }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                </div>
                <p className="text-2xl font-black leading-none" style={{ color }}>{value}</p>
                <p className="text-[11px] mt-2" style={{ color: muted }}>{sub}</p>
              </div>
            ))}
          </div>

          {/* Target controls */}
          <div className="rounded-2xl p-6" style={{ background: base, boxShadow: raised }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: muted }}>
              Configure Targets
            </p>
            <div className="grid grid-cols-2 gap-6">
              <Slider
                label="Annual CO₂ Target"
                value={annualTarget} min={500} max={50000} step={100}
                onChange={setAnnualTarget} unit="kg/yr"
              />
              <Slider
                label="Annual Reduction Rate"
                value={reductionPct} min={1} max={30} step={1}
                onChange={setReductionPct} unit="% / yr"
              />
            </div>
            <p className="text-[11px] mt-4 leading-relaxed" style={{ color: muted }}>
              💡 The Science Based Targets initiative (SBTi) recommends at least{" "}
              <strong style={{ color: "var(--brand-green)" }}>4.2% annual reduction</strong>{" "}
              for a 1.5°C-aligned pathway.
            </p>
          </div>

          {/* Trajectory chart */}
          <div className="rounded-2xl p-6" style={{ background: base, boxShadow: inset }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: muted }}>
              Actual CO₂ vs Target Trajectory (24 months)
            </p>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false}
                               stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: muted }} axisLine={false} tickLine={false}
                       tickFormatter={(v) => v.slice(2)} />
                <YAxis tick={{ fontSize: 10, fill: muted }} axisLine={false} tickLine={false} width={40} />
                <Tooltip contentStyle={tooltipStyle}
                         formatter={(v: unknown, name: string) => [`${v} kg`, name === "co2" ? "Actual" : "Target"]} />
                <ReferenceLine y={annualTarget / 12} stroke={muted} strokeDasharray="4 4"
                               label={{ value: "Avg target/mo", fill: muted, fontSize: 10 }} />
                <Line type="monotone" dataKey="co2" stroke="#22c55e" strokeWidth={2.5}
                      dot={{ r: 2, fill: "#22c55e", strokeWidth: 0 }}
                      activeDot={{ r: 5 }} name="Actual" />
                <Line type="monotone" dataKey="target" stroke="#f97316" strokeWidth={2}
                      strokeDasharray="5 3" dot={false} name="Target" />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-5 mt-3 justify-center">
              {[["Actual emissions", "#22c55e"], ["Target trajectory", "#f97316"]].map(([lbl, clr]) => (
                <div key={lbl} className="flex items-center gap-1.5">
                  <div className="w-6 h-0.5 rounded" style={{ background: clr }} />
                  <span className="text-[11px]" style={{ color: muted }}>{lbl}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SBTi info card */}
          <div className="rounded-2xl p-5 flex gap-4"
               style={{
                 background: "rgba(34,197,94,0.08)",
                 border:     "1px solid rgba(34,197,94,0.20)",
               }}>
            <Leaf className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "var(--brand-green)" }} />
            <div>
              <p className="text-sm font-bold mb-1" style={{ color: "var(--brand-green-dark)" }}>
                Science Based Targets (SBTi)
              </p>
              <p className="text-xs leading-relaxed" style={{ color: muted }}>
                SBTi requires companies to reduce Scope 1 + 2 emissions by 4.2% per year to align with a 1.5°C
                global warming pathway. Your current trajectory projects Net Zero around{" "}
                <strong style={{ color: text }}>{netZeroYear ?? "N/A"}</strong>.
                Upload more bills and set a steeper reduction rate to accelerate your path.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
