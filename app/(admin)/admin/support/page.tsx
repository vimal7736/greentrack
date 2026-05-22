"use client";
import { useState, useEffect } from "react";
import {
  LifeBuoy, Search, Filter, Clock, CheckCircle2, AlertTriangle,
  MessageSquare, ChevronRight, X, Send, User, Building2,
  Mail, Tag, Calendar, ArrowUpRight, Inbox, XCircle, RefreshCw
} from "lucide-react";

interface TicketReply {
  id: string;
  admin_name: string;
  message: string;
  emailed: boolean;
  created_at: string;
}

interface Ticket {
  id: string;
  user_name: string;
  user_email: string;
  org_name: string;
  org_tier: string;
  topic: string;
  message: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  created_at: string;
  updated_at: string;
  ticket_replies?: TicketReply[];
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; Icon: typeof CheckCircle2 }> = {
  open:        { label: "Open",        color: "#f97316", bg: "rgba(249,115,22,0.10)", Icon: Inbox },
  in_progress: { label: "In Progress", color: "#3b82f6", bg: "rgba(59,130,246,0.10)", Icon: Clock },
  resolved:    { label: "Resolved",    color: "#22c55e", bg: "rgba(34,197,94,0.10)",  Icon: CheckCircle2 },
  closed:      { label: "Closed",      color: "var(--text-muted)", bg: "var(--bg-inset)", Icon: XCircle },
};

const PRIORITY_CFG: Record<string, { label: string; color: string; bg: string }> = {
  low:    { label: "Low",    color: "var(--text-muted)", bg: "var(--bg-inset)" },
  medium: { label: "Medium", color: "#3b82f6",           bg: "rgba(59,130,246,0.08)" },
  high:   { label: "High",   color: "#f97316",           bg: "rgba(249,115,22,0.08)" },
  urgent: { label: "Urgent", color: "#ef4444",           bg: "rgba(239,68,68,0.08)" },
};

function timeAgo(dateStr: string): string {
  const d = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(d / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [reply, setReply] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/support");
      if (res.ok) {
        const d = await res.json();
        setTickets(d.tickets ?? []);
        // update selected if it's currently open
        if (selected) {
          const updatedSelected = (d.tickets ?? []).find((t: Ticket) => t.id === selected.id);
          if (updatedSelected) setSelected(updatedSelected);
        }
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = tickets.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        t.user_name.toLowerCase().includes(q) ||
        t.user_email.toLowerCase().includes(q) ||
        t.org_name.toLowerCase().includes(q) ||
        t.topic.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const counts = {
    all: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
    closed: tickets.filter((t) => t.status === "closed").length,
  };

  const handleSendReply = async () => {
    if (!selected || !reply.trim() || sendingReply) return;
    setSendingReply(true);
    try {
      const res = await fetch("/api/admin/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: selected.id, message: reply }),
      });
      if (res.ok) {
        const data = await res.json();
        setReply("");
        
        // Update local state without full reload
        setTickets((prev) => prev.map(t => {
          if (t.id === selected.id) {
            const newReplies = [...(t.ticket_replies || []), data.reply];
            const newStatus = t.status === "open" ? "in_progress" : t.status;
            const updatedTicket = { ...t, ticket_replies: newReplies, status: newStatus } as Ticket;
            if (selected.id === updatedTicket.id) setSelected(updatedTicket);
            return updatedTicket;
          }
          return t;
        }));
      } else {
        alert("Failed to send reply");
      }
    } catch (err) {
      alert("Error sending reply");
    }
    setSendingReply(false);
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selected || updating) return;
    setUpdating(true);
    try {
      const res = await fetch("/api/admin/support", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: selected.id, status }),
      });
      if (res.ok) {
        setTickets((prev) => prev.map(t => {
          if (t.id === selected.id) {
            const updated = { ...t, status } as Ticket;
            if (selected.id === updated.id) setSelected(updated);
            return updated;
          }
          return t;
        }));
      }
    } catch (err) {
      alert("Error updating status");
    }
    setUpdating(false);
  };

  const handleUpdatePriority = async (priority: string) => {
    if (!selected || updating) return;
    setUpdating(true);
    try {
      const res = await fetch("/api/admin/support", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: selected.id, priority }),
      });
      if (res.ok) {
        setTickets((prev) => prev.map(t => {
          if (t.id === selected.id) {
            const updated = { ...t, priority } as Ticket;
            if (selected.id === updated.id) setSelected(updated);
            return updated;
          }
          return t;
        }));
      }
    } catch (err) {
      alert("Error updating priority");
    }
    setUpdating(false);
  };

  if (loading && tickets.length === 0) {
    return (
      <div className="space-y-4 lg:space-y-6 animate-pulse">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="premium-card p-4 lg:p-6 space-y-3">
              <div className="h-3 w-20 rounded" style={{ background: "var(--bg-inset)" }} />
              <div className="h-8 w-12 rounded" style={{ background: "var(--bg-inset)" }} />
            </div>
          ))}
        </div>
        <div className="premium-card p-4 lg:p-6 h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6 animate-scale-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(249,115,22,0.12)", boxShadow: "var(--shadow-inset-sm)" }}
          >
            <LifeBuoy className="w-5 h-5" style={{ color: "#f97316" }} />
          </div>
          <div>
            <h1 className="text-lg lg:text-xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
              Support Tickets
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              User requests &amp; issues
            </p>
          </div>
        </div>
        <button
          onClick={load}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
          style={{ background: "var(--bg-inset)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
        {([
          { label: "Open", value: counts.open, accent: "#f97316", Icon: Inbox },
          { label: "In Progress", value: counts.in_progress, accent: "#3b82f6", Icon: Clock },
          { label: "Resolved", value: counts.resolved, accent: "#22c55e", Icon: CheckCircle2 },
          { label: "Total", value: counts.all, accent: "var(--text-muted)", Icon: MessageSquare },
        ] as const).map(({ label, value, accent, Icon }) => (
          <div
            key={label}
            className="premium-card p-4 lg:p-5 group relative overflow-hidden transition-all duration-500 hover:-translate-y-0.5"
            style={{ borderTop: `3px solid ${accent}` }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted opacity-50">{label}</span>
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "var(--neu-base)", boxShadow: "var(--shadow-inset-sm)", color: accent }}
              >
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <span className="text-2xl font-black tracking-tighter" style={{ color: "var(--text-primary)" }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none transition-all"
            style={{
              background: "var(--bg-inset)",
              border: "1px solid var(--border-default)",
              color: "var(--text-primary)",
            }}
            onFocus={(e) => { e.target.style.borderColor = "rgba(249,115,22,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.08)"; }}
            onBlur={(e) => { e.target.style.borderColor = "var(--border-default)"; e.target.style.boxShadow = "none"; }}
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {(["all", "open", "in_progress", "resolved", "closed"] as const).map((s) => {
            const active = statusFilter === s;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all"
                style={{
                  background: active ? "rgba(249,115,22,0.12)" : "var(--bg-inset)",
                  color: active ? "#f97316" : "var(--text-muted)",
                  border: active ? "1px solid rgba(249,115,22,0.25)" : "1px solid var(--border-default)",
                  cursor: "pointer",
                }}
              >
                {s === "in_progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1)} ({counts[s]})
              </button>
            );
          })}
        </div>
      </div>

      {/* Tickets List + Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Ticket List */}
        <div className="lg:col-span-3 rounded-2xl overflow-hidden flex flex-col" style={{ background: "var(--neu-base)", boxShadow: "var(--shadow-raised)", border: "var(--card-border)", maxHeight: 800 }}>
          <div className="px-4 lg:px-5 py-3 flex items-center justify-between shrink-0" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "var(--text-muted)" }}>
                {filtered.length} ticket{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <div className="divide-y overflow-y-auto" style={{ borderColor: "var(--border-subtle)" }}>
            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <AlertTriangle className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--text-muted)", opacity: 0.4 }} />
                <p className="text-sm font-bold" style={{ color: "var(--text-muted)", opacity: 0.5 }}>No tickets found</p>
              </div>
            ) : (
              filtered.map((t) => {
                const sc = STATUS_CFG[t.status];
                const pc = PRIORITY_CFG[t.priority];
                const isSelected = selected?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelected(t)}
                    className="w-full text-left px-4 lg:px-5 py-3.5 flex items-start gap-3 transition-all duration-200 group"
                    style={{
                      background: isSelected ? "rgba(249,115,22,0.06)" : "transparent",
                      borderLeft: isSelected ? "3px solid #f97316" : "3px solid transparent",
                      cursor: "pointer",
                      border: "none",
                      borderBottom: "1px solid var(--border-subtle)",
                    }}
                    onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
                    onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: sc.bg }}>
                      <sc.Icon className="w-4 h-4" style={{ color: sc.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-black truncate" style={{ color: "var(--text-primary)" }}>{t.user_name}</span>
                        <span className="text-[9px] font-bold" style={{ color: "var(--text-muted)", opacity: 0.5 }}>#{t.id.slice(0,8)}</span>
                      </div>
                      <p className="text-[11px] font-bold truncate mb-1.5" style={{ color: "var(--text-secondary)" }}>{t.topic}</p>
                      <p className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>{t.message}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                        <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: pc.bg, color: pc.color }}>{pc.label}</span>
                        {(t.ticket_replies?.length ?? 0) > 0 && (
                          <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}>
                            {t.ticket_replies?.length} Repl{(t.ticket_replies?.length ?? 0) > 1 ? "ies" : "y"}
                          </span>
                        )}
                        <span className="text-[9px] font-bold ml-auto" style={{ color: "var(--text-muted)", opacity: 0.5 }}>{timeAgo(t.created_at)}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 shrink-0 mt-1 opacity-30 group-hover:opacity-60 transition-opacity" style={{ color: "var(--text-muted)" }} />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-2 rounded-2xl overflow-hidden flex flex-col" style={{ background: "var(--neu-base)", boxShadow: "var(--shadow-raised)", border: "var(--card-border)", minHeight: 600, maxHeight: 800 }}>
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "var(--bg-inset)", boxShadow: "var(--shadow-inset-sm)" }}>
                <MessageSquare className="w-6 h-6" style={{ color: "var(--text-muted)", opacity: 0.4 }} />
              </div>
              <p className="text-sm font-bold text-center" style={{ color: "var(--text-muted)", opacity: 0.5 }}>Select a ticket to view details</p>
            </div>
          ) : (
            <>
              {/* Detail Header */}
              <div className="px-5 py-4 flex items-center justify-between shrink-0" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <div>
                  <p className="text-sm font-black" style={{ color: "var(--text-primary)" }}>#{selected.id.slice(0,8).toUpperCase()}</p>
                  <p className="text-[10px] font-bold" style={{ color: "var(--text-muted)" }}>{timeAgo(selected.created_at)}</p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--bg-inset)] transition-colors"
                  style={{ color: "var(--text-muted)", border: "none", cursor: "pointer", background: "transparent" }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Detail Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* User Info */}
                <div className="rounded-xl p-3.5" style={{ background: "var(--bg-inset)", border: "var(--card-border)" }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-black text-white" style={{ background: "linear-gradient(145deg,#ea580c,#f97316)" }}>
                      {selected.user_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black truncate" style={{ color: "var(--text-primary)" }}>{selected.user_name}</p>
                      <a href={`mailto:${selected.user_email}`} className="text-[10px] truncate hover:underline" style={{ color: "var(--text-muted)" }}>{selected.user_email}</a>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: Building2, label: selected.org_name },
                      { icon: Tag, label: selected.org_tier.charAt(0).toUpperCase() + selected.org_tier.slice(1) },
                    ].map(({ icon: Ic, label }) => (
                      <div key={label} className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: "var(--text-secondary)" }}>
                        <Ic className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
                        <span className="truncate">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status & Priority Management */}
                <div className="flex flex-col gap-2">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: "var(--text-muted)" }}>Management</p>
                  <div className="flex items-center gap-2">
                    <select
                      value={selected.status}
                      onChange={(e) => handleUpdateStatus(e.target.value)}
                      disabled={updating}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold outline-none"
                      style={{ background: "var(--bg-inset)", color: STATUS_CFG[selected.status].color, border: "1px solid var(--border-default)" }}
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>

                    <select
                      value={selected.priority}
                      onChange={(e) => handleUpdatePriority(e.target.value)}
                      disabled={updating}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold outline-none"
                      style={{ background: "var(--bg-inset)", color: PRIORITY_CFG[selected.priority].color, border: "1px solid var(--border-default)" }}
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                      <option value="urgent">Urgent Priority</option>
                    </select>
                  </div>
                </div>

                {/* Conversation History */}
                <div className="space-y-4">
                  {/* Original Message */}
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-1.5" style={{ color: "var(--text-muted)" }}>Original Request</p>
                    <div className="rounded-xl p-3.5" style={{ background: "var(--bg-inset)", border: "1px solid var(--border-default)" }}>
                      <p className="text-xs font-bold mb-2" style={{ color: "var(--text-primary)" }}>{selected.topic}</p>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>{selected.message}</p>
                    </div>
                  </div>

                  {/* Replies */}
                  {selected.ticket_replies && selected.ticket_replies.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: "var(--text-muted)" }}>Replies</p>
                      {selected.ticket_replies.map((r) => (
                        <div key={r.id} className="rounded-xl p-3.5 relative" style={{ background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.15)" }}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black" style={{ color: "#3b82f6" }}>{r.admin_name}</span>
                            <span className="text-[9px] font-bold opacity-50" style={{ color: "var(--text-muted)" }}>{timeAgo(r.created_at)}</span>
                          </div>
                          <p className="text-xs leading-relaxed" style={{ color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>{r.message}</p>
                          {r.emailed && (
                            <div className="mt-2 flex items-center gap-1 text-[8px] font-bold uppercase" style={{ color: "#22c55e" }}>
                              <CheckCircle2 className="w-3 h-3" /> Emailed to user
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Reply Area */}
              <div className="p-4 shrink-0" style={{ borderTop: "1px solid var(--border-subtle)", background: "var(--neu-base)" }}>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-2" style={{ color: "var(--text-muted)" }}>Send Reply</p>
                <textarea
                  rows={3}
                  placeholder="Type your reply. This will be emailed to the user..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-xs resize-none focus:outline-none transition-all"
                  style={{ background: "var(--bg-inset)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
                  onFocus={(e) => { e.target.style.borderColor = "rgba(249,115,22,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(249,115,22,0.08)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "var(--border-default)"; e.target.style.boxShadow = "none"; }}
                />
                <button
                  className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all hover:scale-[1.02] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100"
                  style={{ background: "linear-gradient(135deg,#ea580c 0%,#f97316 100%)", boxShadow: "0 0 22px rgba(249,115,22,0.15)", cursor: (reply && !sendingReply) ? "pointer" : "not-allowed", border: "none" }}
                  disabled={!reply || sendingReply}
                  onClick={handleSendReply}
                >
                  <Send className={`w-3.5 h-3.5 ${sendingReply ? 'animate-pulse' : ''}`} />
                  {sendingReply ? "Sending..." : "Send Reply & Email"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
