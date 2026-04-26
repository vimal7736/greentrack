"use client";
import { useState, useEffect } from "react";
import {
  Activity, UserPlus, Upload, TrendingUp, Zap,
  Flame, Clock, Calendar,
} from "lucide-react";
import type { AdminActivity } from "@/types";

/* ── Event config ──────────────────────────────────────────── */
const EVENT_CONFIG: Record<string, { Icon: typeof UserPlus; color: string; bg: string; label: string }> = {
  signup:       { Icon: UserPlus,   color: "var(--brand-green)",      bg: "rgba(34,197,94,0.10)",   label: "New Signup" },
  bill_upload:  { Icon: Upload,     color: "var(--brand-orange)",     bg: "rgba(249,115,22,0.10)",  label: "Bill Upload" },
  tier_change:  { Icon: TrendingUp, color: "#3b82f6",                 bg: "rgba(59,130,246,0.10)",  label: "Tier Change" },
  factor_edit:  { Icon: Zap,        color: "#a855f7",                 bg: "rgba(168,85,247,0.10)",  label: "Factor Edit" },
};

const FILTERS = [
  { key: "all",         label: "All Events" },
  { key: "signup",      label: "Signups" },
  { key: "bill_upload", label: "Bills" },
];

export default function AdminActivityPage() {
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch("/api/admin/activity");
      if (res.ok) {
        const d = await res.json();
        setActivities(d.activities ?? []);
      }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = filter === "all"
    ? activities
    : activities.filter((a) => a.type === filter);

  /* ── Stats ──────────────────────────────────────────────── */
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCount = activities.filter((a) => a.created_at?.startsWith(todayStr)).length;
  const signupCount = activities.filter((a) => a.type === "signup").length;
  const billCount = activities.filter((a) => a.type === "bill_upload").length;

  /* ── Group by date ──────────────────────────────────────── */
  const grouped: Record<string, AdminActivity[]> = {};
  for (const a of filtered) {
    const dateKey = new Date(a.created_at).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(a);
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="premium-card p-6 space-y-3">
              <div className="h-3 w-20 rounded" style={{ background: "var(--bg-inset)" }} />
              <div className="h-8 w-16 rounded" style={{ background: "var(--bg-inset)" }} />
            </div>
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="premium-card p-4 flex gap-4">
            <div className="w-10 h-10 rounded-xl" style={{ background: "var(--bg-inset)" }} />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 rounded" style={{ background: "var(--bg-inset)" }} />
              <div className="h-3 w-32 rounded" style={{ background: "var(--bg-inset)" }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-scale-in">
      {/* ── Stats ──────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Today's Events", value: todayCount, icon: <Clock className="w-4 h-4" />, accent: "orange" },
          { label: "Recent Signups", value: signupCount, icon: <UserPlus className="w-4 h-4" />, accent: "green" },
          { label: "Recent Uploads", value: billCount, icon: <Upload className="w-4 h-4" />, accent: "orange" },
        ].map(({ label, value, icon, accent }) => (
          <div
            key={label}
            className="premium-card p-5"
            style={{ borderTop: `3px solid ${accent === "green" ? "var(--brand-green)" : "var(--brand-orange)"}` }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted opacity-50">{label}</span>
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{
                  background: "var(--neu-base)",
                  boxShadow: "var(--shadow-inset-sm)",
                  color: accent === "green" ? "var(--brand-green-dark)" : "var(--brand-orange-dark)",
                }}
              >
                {icon}
              </div>
            </div>
            <span className="text-2xl font-black tracking-tighter" style={{ color: "var(--text-primary)" }}>
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* ── Filters ────────────────────────────────────────── */}
      <div
        className="flex items-center gap-1 p-1.5 rounded-xl w-fit"
        style={{
          background: "var(--neu-base)",
          boxShadow: "var(--shadow-inset-xs)",
          border: "var(--card-border)",
        }}
      >
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className="px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap"
            style={
              filter === key
                ? {
                    background: "var(--bg-surface)",
                    color: "var(--brand-orange)",
                    boxShadow: "var(--shadow-raised)",
                  }
                : { color: "var(--text-muted)" }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Timeline ───────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div
          className="premium-card p-12 text-center"
          style={{ boxShadow: "var(--shadow-inset)" }}
        >
          <Activity className="w-10 h-10 mx-auto mb-4 text-text-muted opacity-20" />
          <p className="text-sm font-bold text-text-muted opacity-40">No activity recorded yet</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              {/* Date header */}
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-3.5 h-3.5" style={{ color: "var(--text-muted)", opacity: 0.4 }} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted opacity-40">
                  {date}
                </span>
                <div className="flex-1 h-[1px]" style={{ background: "var(--border-subtle)" }} />
              </div>

              {/* Events */}
              <div className="space-y-2 pl-2">
                {items.map((a) => {
                  const cfg = EVENT_CONFIG[a.type] ?? EVENT_CONFIG.signup;
                  const time = new Date(a.created_at).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  return (
                    <div
                      key={a.id}
                      className="flex items-center gap-4 p-4 rounded-xl group transition-all duration-300 relative"
                      style={{
                        background: "var(--neu-base)",
                        border: "var(--card-border)",
                      }}
                    >
                      {/* Timeline connector dot */}
                      <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2"
                        style={{
                          background: "var(--bg-base)",
                          borderColor: cfg.color,
                        }}
                      />

                      {/* Icon */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                        style={{ background: cfg.bg }}
                      >
                        <cfg.Icon className="w-4 h-4" style={{ color: cfg.color }} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span
                            className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded"
                            style={{ background: cfg.bg, color: cfg.color }}
                          >
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-xs font-bold truncate" style={{ color: "var(--text-primary)" }}>
                          {a.description}
                        </p>
                        {a.org_name && (
                          <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted opacity-40 truncate">
                            {a.org_name}
                          </p>
                        )}
                      </div>

                      {/* Time */}
                      <span className="text-[10px] font-bold text-text-muted opacity-30 shrink-0 tabular-nums">
                        {time}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
