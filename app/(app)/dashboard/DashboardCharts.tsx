"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";

interface MonthlyPoint { month: string; co2: number; kwh: number }
interface ByType        { type: string; co2_kg: number }

interface Props {
  monthlyChart: MonthlyPoint[];
  byType:       ByType[];
  totalCo2:     number;
  /** "co2" renders only the area chart, "energy" only the bar chart, "interactive" renders tabbed toggler, omit for full 3-panel grid */
  chartOnly?:   "co2" | "energy" | "interactive";
}

const TYPE_LABELS: Record<string, string> = {
  electricity: "Electricity",
  gas:         "Gas",
  water:       "Water",
  fuel_diesel: "Diesel",
  fuel_petrol: "Petrol",
};

const TYPE_COLORS: Record<string, string> = {
  electricity: "#22c55e",
  gas:         "#3b82f6",
  water:       "#06b6d4",
  fuel_diesel: "#f59e0b",
  fuel_petrol: "#f97316",
};

export default function DashboardCharts({ monthlyChart, byType, totalCo2, chartOnly }: Props) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"co2" | "energy">("co2");
  
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";
  if (!mounted) return null;

  /* Theme-aware chart tokens */
  const grid    = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const tick    = isDark ? "#7a7570"               : "#9a9590";
  const ttBg    = isDark ? "#1c1c1c"               : "#f5f0e8";
  const ttBdr   = isDark ? "rgba(255,255,255,0.10)": "rgba(0,0,0,0.10)";
  const ttText  = isDark ? "#f5f0e8"               : "#0a0a0a";
  const cardBg  = isDark ? "rgba(255,255,255,0.05)": "rgba(255,255,255,0.22)";
  const cardBdr = isDark ? "rgba(255,255,255,0.10)": "rgba(255,255,255,0.40)";

  const cardStyle = {
    background:   cardBg,
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border:       `1px solid ${cardBdr}`,
    borderRadius: "16px",
  } as const;

  const tooltipStyle = {
    backgroundColor: ttBg,
    border:          `1px solid ${ttBdr}`,
    borderRadius:    "8px",
    color:           ttText,
    fontSize:        "12px",
    fontWeight:      600,
  };

  /* Scope totals */
  const scope1kg = byType
    .filter((b) => ["gas", "fuel_diesel", "fuel_petrol"].includes(b.type))
    .reduce((s, b) => s + b.co2_kg, 0);
  const scope2kg = byType
    .filter((b) => b.type === "electricity")
    .reduce((s, b) => s + b.co2_kg, 0);

  /* Smart data focus: filter out leading empty months to keep chart focused */
  const firstActiveIndex = monthlyChart.findIndex(pt => pt.co2 > 0 || pt.kwh > 0);
  let cleanChartData = monthlyChart;
  if (firstActiveIndex > 0) {
    const sliceStart = Math.max(0, firstActiveIndex - 1);
    cleanChartData = monthlyChart.slice(sliceStart);
  }

  /* ── chartOnly="interactive" — clean tabbed carbon & energy switch ── */
  if (chartOnly === "interactive") {
    return (
      <div className="flex flex-col h-full justify-between">
        {/* Header row with Title and Switcher */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            {activeTab === "co2" ? "Carbon Emissions (kg CO₂e)" : "Energy Consumption (kWh)"}
          </p>
          
          {/* Segmented Switcher Button Group (Rich Inset Neumorphic Pill Tray) */}
          <div
            className="flex items-center p-1 rounded-full shrink-0 transition-all duration-300"
            style={{
              background: "var(--bg-inset)",
              boxShadow: "var(--shadow-inset-sm)",
              border: "2px solid rgba(8, 139, 30, 0.93)",
            }}
          >
            <button
              onClick={() => setActiveTab("co2")}
              className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] rounded-full transition-all duration-500 cursor-pointer ${
                activeTab === "co2"
                  ? "text-white scale-100"
                  : "text-text-muted hover:text-text-primary scale-95"
              }`}
              style={
                activeTab === "co2"
                  ? {
                      background: "linear-gradient(135deg, var(--brand-green), var(--brand-green-dark))",
                      boxShadow: isDark
                        ? "1px 2px 4px rgba(0, 0, 0, 0.4), inset 1px 1px 2px rgba(255, 255, 255, 0.2)"
                        : "1px 2px 4px rgba(34, 197, 94, 0.3), inset 1px 1px 2px rgba(255, 255, 255, 0.4)",
                    }
                  : {}
              }
            >
              CO₂
            </button>
            <button
              onClick={() => setActiveTab("energy")}
              className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] rounded-full transition-all duration-500 cursor-pointer ${
                activeTab === "energy"
                  ? "text-white scale-100"
                  : "text-text-muted hover:text-text-primary scale-95"
              }`}
              style={
                activeTab === "energy"
                  ? {
                      background: "linear-gradient(135deg, var(--brand-green), var(--brand-green-dark))",
                      boxShadow: isDark
                        ? "1px 2px 4px rgba(0, 0, 0, 0.4), inset 1px 1px 2px rgba(255, 255, 255, 0.2)"
                        : "1px 2px 4px rgba(34, 197, 94, 0.3), inset 1px 1px 2px rgba(255, 255, 255, 0.4)",
                    }
                  : {}
              }
            >
              Energy
            </button>
          </div>
        </div>

        {/* Chart Render Canvas */}
        <div className="flex-1 min-h-[220px]">
          {activeTab === "co2" ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={cleanChartData}>
                <defs>
                  <linearGradient id="co2Grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#22c55e" stopOpacity={isDark ? 0.25 : 0.18} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: tick }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: tick }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: unknown) => [`${v} kg`, "CO₂e"]}
                  cursor={{ stroke: "#22c55e", strokeWidth: 1, strokeDasharray: "4 4" }}
                />
                <Area
                  type="monotone" dataKey="co2"
                  stroke="#22c55e" fill="url(#co2Grad)" strokeWidth={2.5}
                  dot={{ r: 3, fill: "#22c55e", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#22c55e", stroke: "none" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={cleanChartData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: tick }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: tick }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }}
                />
                <Bar dataKey="kwh" name="kWh" fill="#22c55e" radius={[4, 4, 0, 0]} opacity={0.9} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    );
  }

  /* ── chartOnly="co2" — just the area chart, no wrapper ── */
  if (chartOnly === "co2") {
    return (
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={cleanChartData}>
          <defs>
            <linearGradient id="co2Grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#22c55e" stopOpacity={isDark ? 0.25 : 0.18} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: tick }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: tick }} axisLine={false} tickLine={false} width={40} />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v: unknown) => [`${v} kg`, "CO₂e"]}
            cursor={{ stroke: "#22c55e", strokeWidth: 1, strokeDasharray: "4 4" }}
          />
          <Area
            type="monotone" dataKey="co2"
            stroke="#22c55e" fill="url(#co2Grad)" strokeWidth={2.5}
            dot={{ r: 3, fill: "#22c55e", strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "#22c55e", stroke: "none" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  /* ── chartOnly="energy" — just the bar chart, no wrapper ── */
  if (chartOnly === "energy") {
    return (
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={cleanChartData} barSize={28}>
          <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: tick }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: tick }} axisLine={false} tickLine={false} width={40} />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }}
          />
          <Bar dataKey="kwh" name="kWh" fill="#22c55e" radius={[4, 4, 0, 0]} opacity={0.9} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  /* ── Default: full 3-panel grid ─────────────────────────── */
  return (
    <div className="grid grid-cols-3 gap-4">

      {/* ── Area chart — CO₂ ────────────────────────────────── */}
      <div className="col-span-2 p-6" style={cardStyle}>
        <h2
          className="text-xs font-bold uppercase tracking-widest mb-5"
          style={{ color: isDark ? "#7a7570" : "#9a9590" }}
        >
          Monthly CO₂ Emissions (kg)
        </h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={cleanChartData}>
            <defs>
              <linearGradient id="co2Grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#22c55e" stopOpacity={isDark ? 0.25 : 0.18} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: tick }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: tick }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: unknown) => [`${v} kg`, "CO₂e"]}
              cursor={{ stroke: "#22c55e", strokeWidth: 1, strokeDasharray: "4 4" }}
            />
            <Area
              type="monotone"
              dataKey="co2"
              stroke="#22c55e"
              fill="url(#co2Grad)"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#22c55e", strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "#22c55e", stroke: "none" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── By-type panel ────────────────────────────────────── */}
      <div className="p-6 flex flex-col gap-5" style={cardStyle}>
        <h2
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: isDark ? "#7a7570" : "#9a9590" }}
        >
          Emissions by Type
        </h2>

        <div className="space-y-3 flex-1">
          {byType.map(({ type, co2_kg }) => {
            const pct   = totalCo2 > 0 ? (co2_kg / totalCo2) * 100 : 0;
            const label = TYPE_LABELS[type] ?? type;
            const color = TYPE_COLORS[type] ?? "#6b7280";
            return (
              <div key={type}>
                <div
                  className="flex justify-between text-xs mb-1.5 font-medium"
                  style={{ color: isDark ? "#c5c0b8" : "#555555" }}
                >
                  <span>{label}</span>
                  <span style={{ color: isDark ? "#7a7570" : "#9a9590" }}>
                    {co2_kg.toFixed(1)} kg · {pct.toFixed(0)}%
                  </span>
                </div>
                {/* Track */}
                <div
                  className="w-full h-1.5 rounded-full overflow-hidden"
                  style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* SECR Scope split — inset neumorphic tiles */}
        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-widest mb-2"
            style={{ color: isDark ? "#7a7570" : "#9a9590" }}
          >
            SECR Scope Split
          </p>
          <div className="grid grid-cols-2 gap-2">
            {/* Scope 1 — blue inset */}
            <div
              className="p-3 text-center rounded-xl"
              style={{
                background: isDark ? "#1c1c1c" : "#dddad1",
                boxShadow: isDark
                  ? "inset 3px 3px 7px rgba(0,10,30,0.60), inset -3px -3px 7px rgba(30,50,90,0.30)"
                  : "inset 3px 3px 7px rgba(20,50,120,0.18), inset -3px -3px 7px rgba(160,200,255,0.45)",
              }}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-500">Scope 1</p>
              <p className="text-sm font-bold mt-0.5" style={{ color: isDark ? "#f5f0e8" : "#0a0a0a" }}>
                {scope1kg.toFixed(0)} kg
              </p>
            </div>
            {/* Scope 2 — green inset */}
            <div
              className="p-3 text-center rounded-xl"
              style={{
                background: isDark ? "#1c1c1c" : "#dddad1",
                boxShadow: isDark
                  ? "inset 3px 3px 7px rgba(0,25,8,0.70), inset -3px -3px 7px rgba(30,90,50,0.40)"
                  : "inset 3px 3px 7px rgba(10,80,30,0.22), inset -3px -3px 7px rgba(150,240,170,0.50)",
              }}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#22c55e" }}>Scope 2</p>
              <p className="text-sm font-bold mt-0.5" style={{ color: isDark ? "#f5f0e8" : "#0a0a0a" }}>
                {scope2kg.toFixed(0)} kg
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bar chart — Energy ───────────────────────────────── */}
      <div className="col-span-3 p-6" style={cardStyle}>
        <h2
          className="text-xs font-bold uppercase tracking-widest mb-5"
          style={{ color: isDark ? "#7a7570" : "#9a9590" }}
        >
          Monthly Energy Consumption (kWh)
        </h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={cleanChartData} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: tick }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: tick }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }}
            />
            <Bar
              dataKey="kwh"
              name="kWh"
              fill="#22c55e"
              radius={[4, 4, 0, 0]}
              opacity={0.9}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
