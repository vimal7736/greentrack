"use client";
import { useEffect, useState } from "react";
import { Cpu, AlertTriangle, Plus, Search } from "lucide-react";
import type { AiUsageRow } from "@/types";
import { Input } from "@/components/ui/Input";

export default function UsageTab() {
  const [usage, setUsage] = useState<AiUsageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [topupModal, setTopupModal] = useState<AiUsageRow | null>(null);
  const [topupAmount, setTopupAmount] = useState("50");

  useEffect(() => {
    fetch("/api/admin/subscriptions?view=usage")
      .then((r) => r.json())
      .then((d) => { setUsage(d.usage ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleTopup() {
    if (!topupModal) return;
    await fetch("/api/admin/subscriptions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "topup_credits", org_id: topupModal.org_id, credits: Number(topupAmount) }),
    });
    setUsage((prev) => prev.map((u) =>
      u.org_id === topupModal.org_id ? { ...u, credits_limit: u.credits_limit + Number(topupAmount), overage: false } : u
    ));
    setTopupModal(null);
    setTopupAmount("50");
  }

  const filtered = usage.filter((u) =>
    !search.trim() || u.org_name.toLowerCase().includes(search.toLowerCase())
  );

  const overageCount = usage.filter((u) => u.overage).length;

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="premium-card p-6 h-20" />
        <div className="premium-card p-6 h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Overage Warning Banner */}
      {overageCount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-2xl"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(239,68,68,0.15)" }}>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <p className="text-xs font-black" style={{ color: "#ef4444" }}>{overageCount} Organisation{overageCount > 1 ? "s" : ""} Over Limit</p>
            <p className="text-[9px] font-bold text-text-muted">These accounts have exceeded their AI processing credit allocation.</p>
          </div>
        </div>
      )}

      {/* Search */}
      <Input icon={<Search className="w-4 h-4" />} placeholder="Search organisations..." value={search} onChange={(e) => setSearch(e.target.value)} />

      {/* Usage Table */}
      <div className="premium-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bg-inset/20 border-b border-border-subtle">
                {["Organisation", "Plan", "Credits Used", "Usage Bar", "Last Activity", "Actions"].map((h) => (
                  <th key={h} className="px-6 first:px-8 last:px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/50">
              {filtered.map((u) => {
                const pct = u.credits_limit > 0 ? (u.credits_used / u.credits_limit) * 100 : 0;
                const barColor = u.overage ? "#ef4444" : pct > 80 ? "#eab308" : "var(--brand-green)";
                return (
                  <tr key={u.org_id} className={`group transition-all duration-300 ${u.overage ? "bg-red-500/5" : "hover:bg-white/5"}`}>
                    <td className="px-6 first:px-8 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black uppercase"
                          style={{ background: u.overage ? "rgba(239,68,68,0.1)" : "var(--bg-inset)", color: u.overage ? "#ef4444" : "var(--text-muted)", boxShadow: "var(--shadow-inset-xs)" }}>
                          {u.org_name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-black tracking-tight" style={{ color: "var(--text-primary)" }}>{u.org_name}</p>
                          {u.overage && <p className="text-[9px] font-bold text-red-500">⚠ OVERAGE</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg"
                        style={{ background: "var(--bg-inset)", color: "var(--text-muted)" }}>{u.plan}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-black" style={{ color: u.overage ? "#ef4444" : "var(--text-primary)" }}>
                        {u.credits_used} / {u.credits_limit}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="w-32">
                        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-inset)" }}>
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${Math.min(pct, 100)}%`, background: barColor }} />
                        </div>
                        <p className="text-[9px] font-bold text-text-muted mt-1">{pct.toFixed(0)}%</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                        {u.last_usage ? timeAgo(u.last_usage) : "Never"}
                      </span>
                    </td>
                    <td className="px-6 last:px-8 py-5">
                      <button onClick={() => setTopupModal(u)} title="Top-up Credits"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                        style={{ background: "rgba(34,197,94,0.1)", color: "var(--brand-green)", border: "1px solid rgba(34,197,94,0.2)" }}>
                        <Plus className="w-3 h-3" /> Top-up
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="py-16 text-center">
                  <Cpu className="w-10 h-10 mx-auto mb-3 text-text-muted opacity-30" />
                  <p className="text-sm font-bold text-text-muted opacity-50">No usage data found</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top-up Modal */}
      {topupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setTopupModal(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative rounded-2xl p-6 w-full max-w-sm animate-scale-in"
            style={{ background: "var(--bg-surface)", border: "var(--card-border)", boxShadow: "var(--shadow-premium)" }}
            onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-black mb-1" style={{ color: "var(--text-primary)" }}>Top-up AI Credits</p>
            <p className="text-[10px] font-bold text-text-muted mb-4">{topupModal.org_name} · Current: {topupModal.credits_used}/{topupModal.credits_limit}</p>
            <div className="flex gap-2 mb-4">
              {["25", "50", "100", "250"].map((v) => (
                <button key={v} onClick={() => setTopupAmount(v)}
                  className="flex-1 px-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  style={topupAmount === v
                    ? { background: "rgba(34,197,94,0.15)", color: "var(--brand-green)", border: "1px solid rgba(34,197,94,0.3)" }
                    : { background: "var(--bg-inset)", color: "var(--text-muted)", border: "var(--card-border)" }}>
                  +{v}
                </button>
              ))}
            </div>
            <button onClick={handleTopup}
              className="w-full px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95"
              style={{ background: "var(--brand-green)", color: "#fff" }}>
              Add {topupAmount} Credits
            </button>
            <button onClick={() => setTopupModal(null)}
              className="mt-2 w-full px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest"
              style={{ background: "var(--bg-inset)", color: "var(--text-muted)" }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
