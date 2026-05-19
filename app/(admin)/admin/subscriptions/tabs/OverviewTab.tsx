"use client";
import { useEffect, useState } from "react";
import {
  TrendingUp, Users, AlertTriangle, Cpu,
} from "lucide-react";
import type { SubscriptionDashboardStats } from "@/types";

export default function OverviewTab() {
  const [stats, setStats] = useState<SubscriptionDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/subscriptions?view=dashboard")
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="premium-card p-4 lg:p-6 space-y-3">
              <div className="h-3 w-20 rounded" style={{ background: "var(--bg-inset)" }} />
              <div className="h-8 w-16 rounded" style={{ background: "var(--bg-inset)" }} />
            </div>
          ))}
        </div>
        <div className="premium-card p-6 h-56" />
      </div>
    );
  }

  const kpis = [
    { label: "Monthly MRR", value: `£${(stats?.mrr ?? 0).toLocaleString("en-GB")}`, icon: <TrendingUp className="w-4 h-4" />, accent: "green" },
    { label: "Active Subscribers", value: stats?.active_subscribers ?? 0, icon: <Users className="w-4 h-4" />, accent: "green" },
    { label: "Churn Rate", value: `${stats?.churn_rate ?? 0}%`, icon: <AlertTriangle className="w-4 h-4" />, accent: "orange" },
    { label: "AI Credits Used", value: (stats?.total_ai_credits ?? 0).toLocaleString("en-GB"), icon: <Cpu className="w-4 h-4" />, accent: "orange" },
  ];

  const dist = stats?.plan_distribution ?? [];
  const totalOrgs = dist.reduce((s, d) => s + d.count, 0) || 1;

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {kpis.map(({ label, value, icon, accent }) => {
          const accentColor = accent === "green" ? "var(--brand-green)" : "var(--brand-orange)";
          const iconColor = accent === "green" ? "var(--brand-green-dark)" : "var(--brand-orange-dark)";
          return (
            <div key={label} className="premium-card p-4 lg:p-6 group relative overflow-hidden transition-all duration-500 hover:-translate-y-1"
              style={{ borderTop: `3px solid ${accentColor}` }}>
              <div className="flex items-center justify-between mb-3 lg:mb-4">
                <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] text-text-muted opacity-50">{label}</span>
                <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ background: "var(--neu-base)", boxShadow: "var(--shadow-inset-sm)", color: iconColor }}>
                  {icon}
                </div>
              </div>
              <span className="text-xl lg:text-2xl font-black tracking-tighter" style={{ color: "var(--text-primary)" }}>{value}</span>
              <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ background: `${accentColor}10` }} />
            </div>
          );
        })}
      </div>

      {/* Plan Distribution Pie Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
        <div className="rounded-2xl p-4 lg:p-6" style={{ background: "var(--neu-base)", boxShadow: "var(--shadow-raised)", border: "var(--card-border)" }}>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted opacity-50 mb-5">Plan Distribution</p>
          {/* SVG Pie Chart */}
          <div className="flex items-center justify-center gap-8">
            <svg viewBox="0 0 120 120" className="w-32 h-32 lg:w-40 lg:h-40">
              {(() => {
                let cumAngle = -90;
                return dist.map((d) => {
                  const pct = d.count / totalOrgs;
                  const angle = pct * 360;
                  const startAngle = cumAngle;
                  cumAngle += angle;
                  const endAngle = cumAngle;
                  const largeArc = angle > 180 ? 1 : 0;
                  const r = 50;
                  const cx = 60, cy = 60;
                  const x1 = cx + r * Math.cos((startAngle * Math.PI) / 180);
                  const y1 = cy + r * Math.sin((startAngle * Math.PI) / 180);
                  const x2 = cx + r * Math.cos((endAngle * Math.PI) / 180);
                  const y2 = cy + r * Math.sin((endAngle * Math.PI) / 180);
                  if (pct === 0) return null;
                  if (pct >= 1) return <circle key={d.plan} cx={cx} cy={cy} r={r} fill={d.color} opacity="0.85" />;
                  return (
                    <path key={d.plan}
                      d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`}
                      fill={d.color} opacity="0.85" className="transition-all duration-500 hover:opacity-100"
                      style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }} />
                  );
                });
              })()}
              <circle cx="60" cy="60" r="28" fill="var(--neu-base)" />
              <text x="60" y="57" textAnchor="middle" className="text-[10px] font-black" fill="var(--text-muted)" style={{ fontSize: "8px" }}>TOTAL</text>
              <text x="60" y="70" textAnchor="middle" className="text-xl font-black" fill="var(--text-primary)" style={{ fontSize: "16px" }}>{totalOrgs}</text>
            </svg>
            <div className="space-y-3">
              {dist.map((d) => (
                <div key={d.plan} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                  <div>
                    <p className="text-xs font-black tracking-tight" style={{ color: "var(--text-primary)" }}>{d.plan}</p>
                    <p className="text-[9px] font-bold text-text-muted">{d.count} orgs · {((d.count / totalOrgs) * 100).toFixed(0)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="rounded-2xl p-4 lg:p-6" style={{ background: "var(--neu-base)", boxShadow: "var(--shadow-raised)", border: "var(--card-border)" }}>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted opacity-50 mb-5">Revenue Breakdown</p>
          <div className="space-y-3 lg:space-y-4">
            {[
              { tier: "Starter", count: dist.find((d) => d.plan === "Starter")?.count ?? 0, price: 24, color: "#3b82f6" },
              { tier: "Business", count: dist.find((d) => d.plan === "Business")?.count ?? 0, price: 99, color: "var(--brand-green)" },
            ].map(({ tier, count, price, color }) => (
              <div key={tier} className="flex items-center justify-between p-3 lg:p-4 rounded-xl"
                style={{ background: "var(--bg-inset)", border: "var(--card-border)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 rounded-full" style={{ background: color }} />
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--text-primary)" }}>{count} × {tier}</p>
                    <p className="text-[9px] font-bold text-text-muted opacity-40 uppercase tracking-widest">£{price} / mo each</p>
                  </div>
                </div>
                <span className="text-base lg:text-lg font-black tracking-tighter" style={{ color: "var(--text-primary)" }}>£{(count * price).toLocaleString("en-GB")}</span>
              </div>
            ))}
            <div className="flex items-center justify-between p-3 lg:p-4 rounded-xl"
              style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.15)" }}>
              <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "var(--brand-orange)" }}>Total MRR</span>
              <span className="text-xl lg:text-2xl font-black tracking-tighter" style={{ color: "var(--brand-orange)" }}>£{(stats?.mrr ?? 0).toLocaleString("en-GB")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
