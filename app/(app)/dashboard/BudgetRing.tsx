"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Tooltip } from "@/components/ui/Tooltip";
import { Lightbulb } from "lucide-react";

interface Props {
  thisMonthCo2: number;
  monthlyAvg:   number;
  distinctMonths?: number;
}

export function BudgetRing({ thisMonthCo2, monthlyAvg, distinctMonths }: Props) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  const isFirstMonth = !distinctMonths || distinctMonths <= 1;

  const pct = monthlyAvg > 0 ? Math.min((thisMonthCo2 / monthlyAvg) * 100, 100) : 0;
  
  const ringColor = isFirstMonth 
    ? "var(--brand-green)" 
    : (pct < 60 ? "#22c55e" : pct < 80 ? "#f59e0b" : pct < 95 ? "#f97316" : "#ef4444");
    
  const status = isFirstMonth 
    ? "Baseline" 
    : (pct < 60 ? "On Track" : pct < 80 ? "Moderate" : pct < 95 ? "High" : "Critical");

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

  const tooltipContent = isFirstMonth ? (
    <div className="space-y-1.5 text-left">
      <p style={{ color: "var(--brand-green)", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em" }}>
        System Baseline
      </p>
      <p className="text-text-secondary leading-normal font-semibold">
        This is your first month of tracking! GreenTrack is setting your carbon footprint baseline as <span className="text-gt-green-500 font-extrabold text-xs">{thisMonthCo2.toLocaleString("en-GB")} kg</span>. Next month, we will start comparing your savings trend!
      </p>
    </div>
  ) : (
    <div className="space-y-1.5 text-left">
      <p style={{ color: "var(--brand-green)", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em" }}>
        Historical Comparison
      </p>
      <p className="text-text-secondary leading-normal font-semibold">
        Compares your current carbon footprint of <span className="text-gt-green-500 font-extrabold text-xs">{thisMonthCo2.toLocaleString("en-GB")} kg</span> against your running historical monthly average of <span className="text-gt-green-500 font-extrabold text-xs">{monthlyAvg.toLocaleString("en-GB")} kg</span>.
      </p>
    </div>
  );

  return (
    <div className="flex flex-col h-full gap-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: muted }}>
          vs Monthly Avg
        </p>
        {isFirstMonth && (
          <span className="text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider text-gt-green-600 bg-gt-green-700/10 border border-gt-green-500/20">
            First Month
          </span>
        )}
      </div>

      {/* Ring — lives inside a deep inset well wrapped in a premium Tooltip */}
      <div className="flex justify-center">
        <Tooltip content={tooltipContent} position="top" align="center" className="cursor-help">
          <div
            className="relative flex items-center justify-center transition-transform duration-300 hover:scale-[1.03]"
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
            <div className="text-center z-10 text-text-primary">
              <p className="text-3xl font-black leading-none" style={{ color: ringColor }}>
                {Math.round(pct)}%
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color: muted }}>
                {status}
              </p>
            </div>
          </div>
        </Tooltip>
      </div>

      {/* Stats strip — two neu-inset tiles */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "This month", val: `${thisMonthCo2.toFixed(1)} kg`, accent: ringColor },
          { label: "Monthly avg", val: `${monthlyAvg.toFixed(1)} kg`,  accent: muted },
        ].map(({ label, val, accent }) => (
          <div
            key={label}
            className="rounded-xl p-3 text-center animate-pulse-once"
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

      {/* Mini progress bar or welcoming guide note */}
      {isFirstMonth ? (
        <div 
          className="rounded-xl p-2.5 text-[10px] font-semibold text-center leading-normal flex items-center justify-center gap-1.5"
          style={{
            background: "rgba(34, 197, 94, 0.05)",
            border: "1px dashed rgba(34, 197, 94, 0.25)",
            color: "var(--brand-green-dark)",
          }}
        >
          <Lightbulb className="w-3.5 h-3.5 shrink-0" />
          <span>
            <strong>Baseline Established</strong>: GreenTrack will begin tracking savings comparison next month once subsequent invoices are uploaded.
          </span>
        </div>
      ) : (
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
            <span className="text-[10px]" style={{ color: muted }}>{monthlyAvg.toFixed(1)} kg avg</span>
          </div>
        </div>
      )}
    </div>
  );
}
