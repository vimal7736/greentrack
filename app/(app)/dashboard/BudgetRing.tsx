"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface Props {
  thisMonthCo2: number;
  monthlyAvg:   number;
}

export function BudgetRing({ thisMonthCo2, monthlyAvg }: Props) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  const pct       = monthlyAvg > 0 ? Math.min((thisMonthCo2 / monthlyAvg) * 100, 100) : 0;
  const ringColor = pct < 60 ? "#22c55e" : pct < 80 ? "#f59e0b" : pct < 95 ? "#f97316" : "#ef4444";
  const status    = pct < 60 ? "On Track" : pct < 80 ? "Moderate" : pct < 95 ? "High" : "Critical";

  const R            = 56;
  const circumference = 2 * Math.PI * R;
  const dashOffset   = circumference * (1 - pct / 100);

  const base    = isDark ? "#1c1c1c" : "#e4e0d6";
  const dark    = isDark ? "#0e0e0e" : "#b6b3aa";
  const light   = isDark ? "#2c2c2c" : "#ffffff";
  const muted   = isDark ? "#7a7570" : "#9a9590";
  const track   = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.07)";
  const border   = isDark ? "1px solid rgba(255,255,255,0.09)" : "none";
  const ringWell = `inset 8px 8px 16px ${dark}, inset -8px -8px 16px ${light}`;
  const insetSm  = `inset 3px 3px 7px ${dark}, inset -3px -3px 7px ${light}`;

  return (
    <div className="flex flex-col h-full gap-5">
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: muted }}>
        vs Monthly Avg
      </p>

      {/* Ring — lives inside a deep inset well */}
      <div className="flex justify-center">
        <div
          className="relative flex items-center justify-center"
          style={{
            width: 160, height: 160,
            borderRadius: "50%",
            background: base,
            boxShadow: ringWell,
          }}
        >
          <svg
            width="148"
            height="148"
            viewBox="0 0 160 160"
            className="absolute inset-1.5"
            style={{ transform: "rotate(-90deg)" }}
          >
            {/* Track */}
            <circle cx={80} cy={80} r={R} fill="none" strokeWidth={11} stroke={track} />
            {/* Progress */}
            <circle
              cx={80} cy={80} r={R}
              fill="none"
              strokeWidth={11}
              stroke={ringColor}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1), stroke 0.4s ease" }}
            />
          </svg>

          {/* Centre label */}
          <div className="text-center z-10">
            <p className="text-3xl font-black leading-none" style={{ color: ringColor }}>
              {Math.round(pct)}%
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color: muted }}>
              {status}
            </p>
          </div>
        </div>
      </div>

      {/* Stats strip — two neu-inset tiles */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "This month", val: `${thisMonthCo2.toFixed(0)} kg`, accent: ringColor },
          { label: "Monthly avg", val: `${monthlyAvg.toFixed(0)} kg`,  accent: muted },
        ].map(({ label, val, accent }) => (
          <div
            key={label}
            className="rounded-xl p-3 text-center"
            style={{
              background: base,
              boxShadow: insetSm,
              border,
            }}
          >
            <p className="text-[10px] font-bold uppercase tracking-wide mb-0.5" style={{ color: muted }}>
              {label}
            </p>
            <p className="text-sm font-bold" style={{ color: accent }}>{val}</p>
          </div>
        ))}
      </div>

      {/* Mini progress bar */}
      <div>
        <div
          className="w-full h-2 rounded-full overflow-hidden"
          style={{ background: `inset 2px 2px 4px ${dark}, inset -2px -2px 4px ${light}`, backgroundColor: track }}
        >
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${pct}%`, background: ringColor }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px]" style={{ color: muted }}>0 kg</span>
          <span className="text-[10px]" style={{ color: muted }}>{monthlyAvg.toFixed(0)} kg avg</span>
        </div>
      </div>
    </div>
  );
}
