"use client";
import { useEffect, useState, useMemo } from "react";
import {
  Building2, Search, ChevronDown, Clock, Zap, FileText,
  Users as UsersIcon, AlertCircle,
} from "lucide-react";
import type { SubscriberRow } from "@/types";
import { DataTable, type ColumnDef } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Input";
import { formatDate } from "@/lib/utils/format";

const STATUS_STYLES: Record<string, { bg: string; text: string; ring: string; label: string }> = {
  active:       { bg: "rgba(34,197,94,0.12)",  text: "#22c55e", ring: "rgba(34,197,94,0.3)",  label: "Active" },
  trial:        { bg: "rgba(234,179,8,0.12)",   text: "#eab308", ring: "rgba(234,179,8,0.3)",  label: "Trial" },
  past_due:     { bg: "rgba(239,68,68,0.12)",   text: "#ef4444", ring: "rgba(239,68,68,0.3)",  label: "Past Due" },
  canceled:     { bg: "rgba(120,120,120,0.12)", text: "#6b7280", ring: "rgba(120,120,120,0.3)", label: "Canceled" },
  grace_period: { bg: "rgba(249,115,22,0.12)", text: "#f97316", ring: "rgba(249,115,22,0.3)", label: "Grace Period" },
};

const PLAN_STYLES: Record<string, { bg: string; text: string; ring: string }> = {
  free:     { bg: "rgba(120,120,120,0.10)", text: "var(--text-muted)",        ring: "rgba(120,120,120,0.20)" },
  starter:  { bg: "rgba(59,130,246,0.10)",  text: "#3b82f6",                 ring: "rgba(59,130,246,0.25)" },
  business: { bg: "rgba(34,197,94,0.10)",   text: "var(--brand-green-dark)", ring: "rgba(34,197,94,0.25)" },
};

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "trial", label: "Trial" },
  { key: "past_due", label: "Past Due" },
  { key: "canceled", label: "Canceled" },
];

export default function SubscribersTab() {
  const [subs, setSubs] = useState<SubscriberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState<{ type: string; sub: SubscriberRow } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { fetchSubs(); }, []);

  async function fetchSubs() {
    setLoading(true);
    const res = await fetch("/api/admin/subscriptions?view=subscribers");
    if (res.ok) { const d = await res.json(); setSubs(d.subscribers ?? []); }
    setLoading(false);
  }

  async function extendTrial(orgId: string, days: number) {
    setActionLoading(true);
    const res = await fetch("/api/admin/subscriptions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "extend_trial", org_id: orgId, days }),
    });
    if (res.ok) await fetchSubs();
    setActionLoading(false);
    setModal(null);
  }

  async function manualOverride(orgId: string, newPlan: string) {
    setActionLoading(true);
    const res = await fetch("/api/admin/subscriptions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "manual_override", org_id: orgId, new_plan: newPlan }),
    });
    if (res.ok) await fetchSubs();
    setActionLoading(false);
    setModal(null);
  }

  const filtered = useMemo(() => {
    let r = subs;
    if (statusFilter !== "all") r = r.filter((s) => s.status === statusFilter);
    if (search.trim()) { const q = search.toLowerCase(); r = r.filter((s) => s.org_name.toLowerCase().includes(q)); }
    return r;
  }, [subs, statusFilter, search]);

  const columns: ColumnDef<SubscriberRow>[] = [
    {
      key: "org", header: "Organisation",
      render: (s) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black uppercase shrink-0"
            style={{ background: "var(--bg-inset)", color: "var(--text-muted)", boxShadow: "var(--shadow-inset-xs)" }}>
            {s.org_name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black tracking-tight truncate" style={{ color: "var(--text-primary)" }}>{s.org_name}</p>
            <p className="text-[9px] text-text-muted opacity-50">{s.user_count} users · {s.bill_count} bills</p>
          </div>
        </div>
      ),
    },
    {
      key: "plan", header: "Plan",
      render: (s) => {
        const ps = PLAN_STYLES[s.plan] ?? PLAN_STYLES.free;
        return <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest"
          style={{ background: ps.bg, color: ps.text, border: `1px solid ${ps.ring}` }}>{s.plan}</span>;
      },
    },
    {
      key: "status", header: "Status",
      render: (s) => {
        const ss = STATUS_STYLES[s.status] ?? STATUS_STYLES.active;
        return (
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest"
              style={{ background: ss.bg, color: ss.text, border: `1px solid ${ss.ring}` }}>
              {s.status === "past_due" && <AlertCircle className="w-3 h-3" />}
              {ss.label}
            </span>
            {s.status === "grace_period" && (
              <span className="relative flex h-2 w-2" title="Grace period — access still active">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "renewal", header: "Renewal",
      render: (s) => (
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
          {s.renewal_date ? formatDate(s.renewal_date) : "—"}
        </span>
      ),
    },
    {
      key: "credits", header: "AI Credits", align: "center",
      render: (s) => {
        const pct = s.ai_credits_limit > 0 ? (s.ai_credits_used / s.ai_credits_limit) * 100 : 0;
        const isOver = pct > 100;
        const barColor = isOver ? "#ef4444" : pct > 80 ? "#eab308" : "var(--brand-green)";
        return (
          <div className="min-w-[80px]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-black" style={{ color: isOver ? "#ef4444" : "var(--text-primary)" }}>
                {s.ai_credits_used}/{s.ai_credits_limit}
              </span>
              {isOver && <AlertCircle className="w-3 h-3 text-red-500" />}
            </div>
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-inset)", boxShadow: "var(--shadow-inset-xs)" }}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(pct, 100)}%`, background: barColor }} />
            </div>
          </div>
        );
      },
    },
    {
      key: "actions", header: "Actions", align: "right",
      render: (s) => (
        <div className="flex items-center gap-1 justify-end">
          <button onClick={() => setModal({ type: "extend", sub: s })} title="Extend Trial"
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110"
            style={{ background: "rgba(234,179,8,0.1)", color: "#eab308" }}>
            <Clock className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setModal({ type: "override", sub: s })} title="Manual Override"
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110"
            style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}>
            <Zap className="w-3.5 h-3.5" />
          </button>
          {s.stripe_customer_id && (
            <a href={`https://dashboard.stripe.com/customers/${s.stripe_customer_id}`} target="_blank" rel="noopener noreferrer"
              title="View Invoices in Stripe"
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110"
              style={{ background: "rgba(168,85,247,0.1)", color: "#a855f7" }}>
              <FileText className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 lg:gap-4">
        <div className="flex-1">
          <Input icon={<Search className="w-4 h-4" />} placeholder="Search subscribers..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl overflow-x-auto shrink-0"
          style={{ background: "var(--neu-base)", boxShadow: "var(--shadow-inset-xs)", border: "var(--card-border)", scrollbarWidth: "none" } as React.CSSProperties}>
          {STATUS_FILTERS.map(({ key, label }) => (
            <button key={key} type="button" onClick={() => setStatusFilter(key)}
              className="px-3 lg:px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap"
              style={statusFilter === key ? { background: "var(--bg-surface)", color: "var(--brand-orange)", boxShadow: "var(--shadow-raised)" } : { color: "var(--text-muted)" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <DataTable columns={columns} data={filtered} rowKey={(s) => s.id} loading={loading}
        loadingLabel="Loading subscribers..." emptyIcon={<Building2 className="w-10 h-10" />}
        emptyTitle="No Subscribers Found" emptyMessage="Try adjusting your search or filters." />

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative rounded-2xl p-6 w-full max-w-md animate-scale-in"
            style={{ background: "var(--bg-surface)", border: "var(--card-border)", boxShadow: "var(--shadow-premium)" }}
            onClick={(e) => e.stopPropagation()}>
            {modal.type === "extend" && (
              <>
                <p className="text-sm font-black mb-1" style={{ color: "var(--text-primary)" }}>Extend Trial</p>
                <p className="text-[10px] font-bold text-text-muted mb-5">{modal.sub.org_name}</p>
                <div className="flex gap-3">
                  {[7, 14, 30].map((d) => (
                    <button key={d} disabled={actionLoading} onClick={() => extendTrial(modal.sub.id, d)}
                      className="flex-1 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                      style={{ background: "rgba(234,179,8,0.1)", color: "#eab308", border: "1px solid rgba(234,179,8,0.25)" }}>
                      +{d} Days
                    </button>
                  ))}
                </div>
              </>
            )}
            {modal.type === "override" && (
              <>
                <p className="text-sm font-black mb-1" style={{ color: "var(--text-primary)" }}>Manual Plan Override</p>
                <p className="text-[10px] font-bold text-text-muted mb-1">{modal.sub.org_name}</p>
                <p className="text-[9px] font-bold text-text-muted opacity-50 mb-5">Current: {modal.sub.plan}</p>
                <div className="flex gap-3">
                  {["free", "starter", "business"].map((p) => (
                    <button key={p} disabled={actionLoading || p === modal.sub.plan}
                      onClick={() => manualOverride(modal.sub.id, p)}
                      className="flex-1 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-30"
                      style={{ background: PLAN_STYLES[p].bg, color: PLAN_STYLES[p].text, border: `1px solid ${PLAN_STYLES[p].ring}` }}>
                      {p}
                    </button>
                  ))}
                </div>
              </>
            )}
            <button onClick={() => setModal(null)}
              className="mt-4 w-full px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
              style={{ background: "var(--bg-inset)", color: "var(--text-muted)" }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
