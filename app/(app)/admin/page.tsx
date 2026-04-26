"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2, Users, TrendingUp, FileText, Database,
  ArrowUpRight, UserPlus, Upload, Zap, Flame,
} from "lucide-react";
import type { AdminStats, AdminActivity } from "@/types";

/* ── Tier colors ────────────────────────────────────────────── */
const TIER_BAR_COLORS: Record<string, string> = {
  free: "var(--text-muted)",
  starter: "#3b82f6",
  business: "var(--brand-green)",
};

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [statsRes, activityRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/activity"),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (activityRes.ok) {
        const d = await activityRes.json();
        setActivities(d.activities ?? []);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="premium-card p-6 space-y-3">
              <div className="h-3 w-20 rounded" style={{ background: "var(--bg-inset)" }} />
              <div className="h-8 w-16 rounded" style={{ background: "var(--bg-inset)" }} />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="premium-card p-6 h-48" />
          ))}
        </div>
      </div>
    );
  }

  const kpis = [
    {
      label: "Total Organisations",
      value: stats?.total_orgs ?? 0,
      icon: <Building2 className="w-4 h-4" />,
      accent: "orange" as const,
      href: "/admin/organisations",
    },
    {
      label: "Total Users",
      value: stats?.total_users ?? 0,
      icon: <Users className="w-4 h-4" />,
      accent: "green" as const,
      href: "/admin/users",
    },
    {
      label: "Monthly MRR",
      value: `£${(stats?.mrr ?? 0).toLocaleString()}`,
      icon: <TrendingUp className="w-4 h-4" />,
      accent: "green" as const,
    },
    {
      label: "Bills Today",
      value: stats?.bills_today ?? 0,
      icon: <FileText className="w-4 h-4" />,
      accent: "orange" as const,
    },
    {
      label: "Total Bills",
      value: (stats?.total_bills ?? 0).toLocaleString(),
      icon: <Database className="w-4 h-4" />,
      accent: "green" as const,
    },
  ];

  return (
    <div className="space-y-6 animate-scale-in">
      {/* ── KPI Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-5 gap-4">
        {kpis.map(({ label, value, icon, accent, href }) => {
          const accentColor = accent === "green" ? "var(--brand-green)" : "var(--brand-orange)";
          const iconColor = accent === "green" ? "var(--brand-green-dark)" : "var(--brand-orange-dark)";

          const card = (
            <div
              className="premium-card p-6 group relative overflow-hidden transition-all duration-500 hover:-translate-y-1"
              style={{ borderTop: `3px solid ${accentColor}` }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted opacity-50">
                  {label}
                </span>
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{
                    background: "var(--neu-base)",
                    boxShadow: "var(--shadow-inset-sm)",
                    color: iconColor,
                  }}
                >
                  {icon}
                </div>
              </div>
              <span className="text-2xl font-black tracking-tighter" style={{ color: "var(--text-primary)" }}>
                {value}
              </span>
              {href && (
                <div className="flex items-center gap-1 mt-3 text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: "var(--text-muted)" }}>
                  View All <ArrowUpRight className="w-3 h-3" />
                </div>
              )}
              <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ background: `${accentColor}10` }} />
            </div>
          );

          return href ? (
            <Link key={label} href={href} className="block">
              {card}
            </Link>
          ) : (
            <div key={label}>{card}</div>
          );
        })}
      </div>

      {/* ── Row: Plan Distribution + Revenue Breakdown ───── */}
      <div className="grid grid-cols-2 gap-4">
        {/* Plan Distribution */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: "var(--neu-base)",
            boxShadow: "var(--shadow-raised)",
            border: "var(--card-border)",
          }}
        >
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted opacity-50 mb-5">
            Plan Distribution
          </p>
          <div className="space-y-4">
            {(["free", "starter", "business"] as const).map((tier) => {
              const count = stats?.tier_counts?.[tier] ?? 0;
              const total = stats?.total_orgs ?? 1;
              const pct = total > 0 ? (count / total) * 100 : 0;
              const color = TIER_BAR_COLORS[tier];
              return (
                <div key={tier}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                      <span className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
                        {tier}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
                        {count}
                      </span>
                      <span className="text-[9px] font-bold text-text-muted opacity-40">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div
                    className="w-full h-2.5 rounded-full overflow-hidden"
                    style={{
                      background: "var(--neu-base)",
                      boxShadow: "var(--shadow-inset-xs)",
                    }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: "var(--neu-base)",
            boxShadow: "var(--shadow-raised)",
            border: "var(--card-border)",
          }}
        >
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted opacity-50 mb-5">
            Revenue Breakdown
          </p>
          <div className="space-y-4">
            {[
              { tier: "Starter", count: stats?.tier_counts?.starter ?? 0, price: 24, color: "#3b82f6" },
              { tier: "Business", count: stats?.tier_counts?.business ?? 0, price: 99, color: "var(--brand-green)" },
            ].map(({ tier, count, price, color }) => (
              <div
                key={tier}
                className="flex items-center justify-between p-4 rounded-xl"
                style={{
                  background: "var(--bg-inset)",
                  border: "var(--card-border)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 rounded-full" style={{ background: color }} />
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--text-primary)" }}>
                      {count} × {tier}
                    </p>
                    <p className="text-[9px] font-bold text-text-muted opacity-40 uppercase tracking-widest">
                      £{price} / mo each
                    </p>
                  </div>
                </div>
                <span className="text-lg font-black tracking-tighter" style={{ color: "var(--text-primary)" }}>
                  £{(count * price).toLocaleString()}
                </span>
              </div>
            ))}

            <div
              className="flex items-center justify-between p-4 rounded-xl"
              style={{
                background: "rgba(249,115,22,0.06)",
                border: "1px solid rgba(249,115,22,0.15)",
              }}
            >
              <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "var(--brand-orange)" }}>
                Total MRR (ex VAT)
              </span>
              <span className="text-2xl font-black tracking-tighter" style={{ color: "var(--brand-orange)" }}>
                £{(stats?.mrr ?? 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent Activity Feed ───────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "var(--neu-base)",
          boxShadow: "var(--shadow-raised)",
          border: "var(--card-border)",
        }}
      >
        <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--brand-orange)" }} />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">
              Platform Activity
            </p>
          </div>
          <Link
            href="/admin/activity"
            className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 hover:shadow-lg"
            style={{
              background: "var(--bg-inset)",
              color: "var(--text-muted)",
            }}
          >
            Full Log <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="p-4">
          {activities.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm font-bold text-text-muted opacity-40">No activity recorded yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {activities.slice(0, 8).map((a) => (
                <ActivityRow key={a.id} activity={a} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Activity Row ──────────────────────────────────────────── */
function ActivityRow({ activity }: { activity: AdminActivity }) {
  const cfg = {
    signup: { Icon: UserPlus, color: "var(--brand-green)", bg: "rgba(34,197,94,0.10)" },
    bill_upload: { Icon: Upload, color: "var(--brand-orange)", bg: "rgba(249,115,22,0.10)" },
    tier_change: { Icon: TrendingUp, color: "#3b82f6", bg: "rgba(59,130,246,0.10)" },
    factor_edit: { Icon: Zap, color: "#a855f7", bg: "rgba(168,85,247,0.10)" },
  }[activity.type] ?? { Icon: Flame, color: "var(--text-muted)", bg: "var(--bg-inset)" };

  const timeAgo = getTimeAgo(activity.created_at);

  return (
    <div
      className="flex items-center gap-4 px-4 py-3.5 rounded-xl group transition-all duration-300 hover:bg-white/5"
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
        style={{ background: cfg.bg }}
      >
        <cfg.Icon className="w-4 h-4" style={{ color: cfg.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold truncate" style={{ color: "var(--text-primary)" }}>
          {activity.description}
        </p>
        {activity.org_name && (
          <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted opacity-40 truncate">
            {activity.org_name}
          </p>
        )}
      </div>
      <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted opacity-40 shrink-0">
        {timeAgo}
      </span>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
