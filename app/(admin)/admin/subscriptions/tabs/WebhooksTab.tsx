"use client";
import { useEffect, useState } from "react";
import { Webhook, CheckCircle, XCircle, Clock } from "lucide-react";
import type { WebhookLogRow } from "@/types";

const STATUS_ICONS: Record<string, { Icon: typeof CheckCircle; color: string; bg: string }> = {
  success: { Icon: CheckCircle, color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
  failed:  { Icon: XCircle,    color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  pending: { Icon: Clock,      color: "#eab308", bg: "rgba(234,179,8,0.1)" },
};

export default function WebhooksTab() {
  const [logs, setLogs] = useState<WebhookLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/subscriptions?view=webhooks")
      .then((r) => r.json())
      .then((d) => { setLogs(d.logs ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="space-y-4 animate-pulse"><div className="premium-card p-6 h-64" /></div>;
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 rounded-2xl"
        style={{ background: "var(--neu-base)", boxShadow: "var(--shadow-raised)", border: "var(--card-border)" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(168,85,247,0.1)", boxShadow: "var(--shadow-inset-xs)" }}>
          <Webhook className="w-4 h-4 text-purple-500" />
        </div>
        <div>
          <p className="text-sm font-black" style={{ color: "var(--text-primary)" }}>Stripe Webhook Log</p>
          <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">
            Monitoring payment events to keep DB in sync
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: "var(--brand-green)" }}>Live</span>
        </div>
      </div>

      {/* Webhook Events */}
      <div className="premium-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bg-inset/20 border-b border-border-subtle">
                {["Status", "Event Type", "Stripe ID", "Summary", "Timestamp"].map((h) => (
                  <th key={h} className="px-6 first:px-8 last:px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/50">
              {logs.map((log) => {
                const s = STATUS_ICONS[log.status] ?? STATUS_ICONS.pending;
                return (
                  <tr key={log.id} className="group hover:bg-white/5 transition-all duration-300">
                    <td className="px-6 first:px-8 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: s.bg }}>
                          <s.Icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: s.color }}>
                          {log.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest"
                        style={{ background: "var(--bg-inset)", color: "var(--text-primary)" }}>
                        {log.event_type}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[10px] font-mono font-bold text-text-muted">{log.stripe_event_id}</span>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs font-bold max-w-xs truncate" style={{ color: "var(--text-primary)" }}>{log.payload_summary}</p>
                    </td>
                    <td className="px-6 last:px-8 py-5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{timeAgo(log.created_at)}</span>
                    </td>
                  </tr>
                );
              })}
              {logs.length === 0 && (
                <tr><td colSpan={5} className="py-16 text-center">
                  <Webhook className="w-10 h-10 mx-auto mb-3 text-text-muted opacity-30" />
                  <p className="text-sm font-bold text-text-muted opacity-50">No webhook events recorded</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
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
