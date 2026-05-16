"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Building2, Users, FileText, ArrowLeft, Leaf,
  ChevronDown, Pause, Play, Settings, BarChart3,
  UserMinus, ShieldAlert, Mail, Calendar, Shield, MapPin, Activity, X,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/utils/format";

const TIER_STYLES: Record<string, { bg: string; text: string; ring: string }> = {
  free: { bg: "rgba(120,120,120,0.10)", text: "var(--text-muted)", ring: "rgba(120,120,120,0.20)" },
  starter: { bg: "rgba(59,130,246,0.10)", text: "#3b82f6", ring: "rgba(59,130,246,0.25)" },
  business: { bg: "rgba(34,197,94,0.10)", text: "var(--brand-green-dark)", ring: "rgba(34,197,94,0.25)" },
};

const TABS = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "members", label: "Members", icon: Users },
  { key: "bills", label: "Bills", icon: FileText },
  { key: "settings", label: "Settings", icon: Settings },
];

interface OrgDetail {
  id: string; name: string; tier: string; status?: string; created_at: string;
  stripe_customer_id?: string; seats_limit?: number;
  user_count: number; bill_count: number; total_co2_kg: number;
  members: { id: string; full_name: string; email: string; role: string; created_at: string }[];
  bills: { id: string; bill_type: string; bill_date: string; co2_kg: number; cost_gbp: number | null; usage_amount: number; usage_unit: string }[];
}

export default function OrgDetailPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [changingTier, setChangingTier] = useState(false);
  const [suspendConfirm, setSuspendConfirm] = useState(false);
  const [suspendLoading, setSuspendLoading] = useState(false);
  
  const [removeMemberTarget, setRemoveMemberTarget] = useState<OrgDetail["members"][0] | null>(null);
  const [removeMemberLoading, setRemoveMemberLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userModalLoading, setUserModalLoading] = useState(false);
  const [selectedBill, setSelectedBill] = useState<OrgDetail["bills"][0] | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch(`/api/admin/orgs?detail=${id}`);
      if (res.ok) { const d = await res.json(); setOrg(d.org ?? null); }
      setLoading(false);
    }
    if (id) load();
  }, [id]);

  async function handleTierChange(newTier: string) {
    if (!org) return;
    setChangingTier(true);
    const res = await fetch("/api/admin/orgs", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: org.id, tier: newTier }),
    });
    if (res.ok) { setOrg({ ...org, tier: newTier }); toast.success(`Tier updated to ${newTier}`); }
    else toast.error("Failed to update tier");
    setChangingTier(false);
  }

  async function handleSuspendToggle() {
    if (!org) return;
    const newStatus = org.status === "suspended" ? "active" : "suspended";
    setSuspendLoading(true);
    const res = await fetch("/api/admin/orgs", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: org.id, status: newStatus }),
    });
    if (res.ok) { setOrg({ ...org, status: newStatus }); toast.success(`Organisation ${newStatus}`); }
    else toast.error("Failed to update status");
    setSuspendLoading(false);
    setSuspendConfirm(false);
  }

  async function handleUserClick(userId: string) {
    setUserModalLoading(true);
    const res = await fetch(`/api/admin/users?detail=${userId}`);
    if (res.ok) {
      const d = await res.json();
      setSelectedUser(d.user);
    } else {
      toast.error("Failed to load user details");
    }
    setUserModalLoading(false);
  }

  async function handleRemoveMember() {
    if (!org || !removeMemberTarget) return;
    setRemoveMemberLoading(true);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: removeMemberTarget.id, action: "remove_from_org" }),
    });
    if (res.ok) {
      setOrg({
        ...org,
        members: org.members.filter((m) => m.id !== removeMemberTarget.id),
        user_count: org.user_count - 1,
      });
      toast.success(`${removeMemberTarget.full_name} removed from organisation`);
    } else {
      toast.error("Failed to remove member");
    }
    setRemoveMemberLoading(false);
    setRemoveMemberTarget(null);
  }

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 w-40 rounded-xl" style={{ background: "var(--bg-inset)" }} />
      <div className="premium-card p-8 h-48" />
      <div className="premium-card p-8 h-64" />
    </div>
  );

  if (!org) return (
    <div className="text-center py-20">
      <Building2 className="w-12 h-12 mx-auto mb-4 text-text-muted opacity-30" />
      <p className="text-lg font-black" style={{ color: "var(--text-primary)" }}>Organisation not found</p>
      <Link href="/admin/organisations" className="text-sm font-bold mt-2 inline-block" style={{ color: "var(--brand-orange)" }}>← Back to list</Link>
    </div>
  );

  const isSuspended = org.status === "suspended";
  const tierStyle = TIER_STYLES[org.tier] ?? TIER_STYLES.free;

  return (
    <div className="space-y-4 lg:space-y-6 animate-scale-in">
      {/* Back link */}
      <Link href="/admin/organisations" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all hover:gap-3"
        style={{ color: "var(--text-muted)" }}>
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Organisations
      </Link>

      {/* ── Header Card ────────────────────────────────────────── */}
      <div className="premium-card p-5 lg:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl flex items-center justify-center text-xl font-black uppercase shrink-0"
            style={{ background: "linear-gradient(145deg, var(--brand-green-dark), var(--brand-green))", color: "#fff", boxShadow: "var(--shadow-raised)" }}>
            {org.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl lg:text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>{org.name}</h1>
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest"
                style={{ background: tierStyle.bg, color: tierStyle.text, border: `1px solid ${tierStyle.ring}` }}>{org.tier}</span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest"
                style={{
                  background: isSuspended ? "rgba(239,68,68,0.10)" : "rgba(34,197,94,0.10)",
                  color: isSuspended ? "#ef4444" : "var(--brand-green-dark)",
                  border: `1px solid ${isSuspended ? "rgba(239,68,68,0.20)" : "rgba(34,197,94,0.20)"}`,
                }}>{isSuspended ? "Suspended" : "Active"}</span>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted opacity-60">
              Created {formatDate(org.created_at)} {org.stripe_customer_id && `· Stripe: ${org.stripe_customer_id}`}
            </p>
          </div>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 p-1 rounded-xl overflow-x-auto"
        style={{ background: "var(--neu-base)", boxShadow: "var(--shadow-inset-xs)", border: "var(--card-border)", scrollbarWidth: "none" } as React.CSSProperties}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} type="button" onClick={() => setTab(key)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap"
            style={tab === key
              ? { background: "var(--bg-surface)", color: "var(--brand-orange)", boxShadow: "var(--shadow-raised)" }
              : { color: "var(--text-muted)" }}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ────────────────────────────────────────── */}
      {tab === "overview" && (
        <div className="space-y-4 lg:space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
            {[
              { label: "Members", value: org.user_count, icon: <Users className="w-4 h-4" />, accent: "orange" },
              { label: "Bills", value: org.bill_count, icon: <FileText className="w-4 h-4" />, accent: "green" },
              { label: "Total CO₂", value: `${(org.total_co2_kg ?? 0).toLocaleString()} kg`, icon: <Leaf className="w-4 h-4" />, accent: "green" },
            ].map(({ label, value, icon, accent }) => (
              <div key={label} className="premium-card p-4 lg:p-5" style={{ borderTop: `3px solid ${accent === "green" ? "var(--brand-green)" : "var(--brand-orange)"}` }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted opacity-50">{label}</span>
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                    style={{ background: "var(--neu-base)", boxShadow: "var(--shadow-inset-sm)", color: accent === "green" ? "var(--brand-green-dark)" : "var(--brand-orange-dark)" }}>{icon}</div>
                </div>
                <span className="text-xl font-black tracking-tighter" style={{ color: "var(--text-primary)" }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Detailed Info Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Column 1: Core Details */}
            <div className="premium-card p-5 lg:p-6 space-y-5">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted opacity-50 mb-4">Organisational Details</h3>
                <div className="space-y-4">
                  <DetailItem label="Organisation ID" value={org.id} isCode />
                  <DetailItem label="Date Created" value={formatDate(org.created_at)} />
                  <DetailItem label="Full Name" value={org.name} />
                  <DetailItem
                    label="Current Status"
                    value={org.status === "suspended" ? "Suspended" : "Active"}
                    valueColor={org.status === "suspended" ? "#ef4444" : "var(--brand-green-dark)"}
                  />
                </div>
              </div>
            </div>

            {/* Column 2: Subscription & Limits */}
            <div className="premium-card p-5 lg:p-6 space-y-5">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted opacity-50 mb-4">Subscription & Limits</h3>
                <div className="space-y-4">
                  <DetailItem label="Service Tier" value={org.tier.toUpperCase()} />
                  <DetailItem label="Stripe Customer" value={org.stripe_customer_id || "None (Internal)"} />
                  <div className="pt-2">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-text-muted">Seats Usage</span>
                      <span className="text-[10px] font-bold" style={{ color: "var(--text-primary)" }}>
                        {org.user_count} / {org.seats_limit ?? "∞"}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full" style={{ background: "var(--bg-inset)", boxShadow: "var(--shadow-inset-xs)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: org.seats_limit ? `${Math.min(100, (org.user_count / org.seats_limit) * 100)}%` : "0%",
                          background: "var(--brand-green)"
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "members" && (
        <div className="premium-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bg-inset/20 border-b border-border-subtle">
                {["Member", "Role", "Joined", "Actions"].map((h) => (
                  <th key={h} className={`px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ${h === "Actions" ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/50">
              {(org.members ?? []).length === 0 ? (
                <tr><td colSpan={4} className="py-16 text-center text-sm font-bold text-text-muted opacity-40">No members found</td></tr>
              ) : (org.members ?? []).map((m) => {
                const rs = { owner: "var(--brand-orange-dark)", admin: "#3b82f6", member: "var(--text-muted)" }[m.role] || "var(--text-muted)";
                return (
                  <tr key={m.id} className="hover:bg-gt-green-50/30 transition-all group/row">
                    <td className="px-6 py-4">
                      <button 
                        type="button"
                        onClick={() => handleUserClick(m.id)}
                        className="group flex items-center gap-3 text-left focus:outline-none"
                      >
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black uppercase shrink-0"
                          style={{ background: "var(--bg-inset)", color: "var(--text-muted)", boxShadow: "var(--shadow-inset-xs)" }}>
                          {m.full_name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black tracking-tight truncate group-hover:text-brand-orange transition-colors" style={{ color: "var(--text-primary)" }}>{m.full_name}</p>
                          <p className="text-[9px] font-bold text-text-muted opacity-50 truncate">{m.email}</p>
                        </div>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest"
                        style={{ background: `${rs}15`, color: rs, border: `1px solid ${rs}30` }}>{m.role}</span>
                    </td>
                    <td className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">{formatDate(m.created_at)}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        type="button" 
                        onClick={() => setRemoveMemberTarget(m)}
                        className="p-2 rounded-xl text-red-500 opacity-0 group-hover/row:opacity-100 hover:bg-red-50 transition-all active:scale-90"
                        title="Remove member">
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === "bills" && (
        <div className="premium-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bg-inset/20 border-b border-border-subtle">
                {["Type", "Date", "Usage", "CO₂ (kg)", "Cost"].map((h) => (
                  <th key={h} className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/50">
              {(org.bills ?? []).length === 0 ? (
                <tr><td colSpan={5} className="py-16 text-center text-sm font-bold text-text-muted opacity-40">No bills found</td></tr>
              ) : (org.bills ?? []).map((b) => (
                <tr 
                  key={b.id} 
                  className="hover:bg-gt-green-50/30 transition-all cursor-pointer group/row"
                  onClick={() => setSelectedBill(b)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-bg-inset text-text-muted group-hover/row:text-brand-orange transition-colors">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg" style={{ background: "var(--bg-inset)", color: "var(--text-secondary)" }}>
                        {b.bill_type.replace("_", " ")}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">{formatDate(b.bill_date)}</td>
                  <td className="px-6 py-4 text-xs font-black" style={{ color: "var(--text-primary)" }}>{b.usage_amount.toLocaleString()} {b.usage_unit}</td>
                  <td className="px-6 py-4 text-xs font-black" style={{ color: "var(--brand-green-dark)" }}>{b.co2_kg.toFixed(1)}</td>
                  <td className="px-6 py-4 text-xs font-bold text-text-muted">{b.cost_gbp != null ? `£${b.cost_gbp.toFixed(2)}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "settings" && (
        <div className="space-y-4">
          {/* Tier control */}
          <div className="premium-card p-5 lg:p-6">
            <h3 className="text-sm font-black tracking-tight mb-4" style={{ color: "var(--text-primary)" }}>Plan & Tier</h3>
            <div className="flex items-center gap-3">
              <div className="relative">
                <select value={org.tier} disabled={changingTier} onChange={(e) => handleTierChange(e.target.value)}
                  className="appearance-none pr-8 pl-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer focus:outline-none"
                  style={{ background: "var(--bg-inset)", color: "var(--text-primary)", border: "var(--card-border)", opacity: changingTier ? 0.5 : 1 }}>
                  <option value="free">Free</option><option value="starter">Starter</option><option value="business">Business</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted" />
              </div>
              {org.seats_limit && <span className="text-[10px] font-bold text-text-muted">Seats limit: {org.seats_limit}</span>}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="premium-card p-5 lg:p-6" style={{ borderTop: "3px solid #ef4444" }}>
            <h3 className="text-sm font-black tracking-tight mb-1" style={{ color: "#ef4444" }}>Danger Zone</h3>
            <p className="text-[10px] font-bold text-text-muted mb-4">These actions have significant consequences.</p>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => setSuspendConfirm(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:brightness-110 active:scale-95"
                style={{
                  background: isSuspended ? "rgba(34,197,94,0.10)" : "rgba(239,68,68,0.08)",
                  color: isSuspended ? "var(--brand-green-dark)" : "#ef4444",
                  border: `1px solid ${isSuspended ? "rgba(34,197,94,0.20)" : "rgba(239,68,68,0.15)"}`,
                }}>
                {isSuspended ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                {isSuspended ? "Reactivate Organisation" : "Suspend Organisation"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={suspendConfirm}
        title={isSuspended ? "Reactivate Organisation" : "Suspend Organisation"}
        description={isSuspended
          ? `Reactivate "${org.name}"? All members will regain access.`
          : `Suspend "${org.name}"? All members will see a suspension notice.`}
        confirmLabel={isSuspended ? "Reactivate" : "Suspend"}
        variant={isSuspended ? "info" : "danger"}
        loading={suspendLoading}
        onConfirm={handleSuspendToggle}
        onCancel={() => setSuspendConfirm(false)}
      />

      <ConfirmDialog
        open={!!removeMemberTarget}
        title="Remove Member"
        description={`Are you sure you want to remove "${removeMemberTarget?.full_name}" from this organisation? They will lose all access to organisation data.`}
        confirmLabel="Remove Member"
        variant="danger"
        loading={removeMemberLoading}
        onConfirm={handleRemoveMember}
        onCancel={() => setRemoveMemberTarget(null)}
      />

      {/* User Detail Modal */}
      <UserDetailModal 
        user={selectedUser} 
        isOpen={!!selectedUser} 
        onClose={() => setSelectedUser(null)} 
      />

      <BillDetailModal 
        bill={selectedBill} 
        isOpen={!!selectedBill} 
        onClose={() => setSelectedBill(null)} 
      />
    </div>
  );
}

/* ── Helper: User Detail Modal ──────────────────────────────── */
function UserDetailModal({ user, isOpen, onClose }: { user: any; isOpen: boolean; onClose: () => void }) {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={onClose} />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-2xl max-h-full overflow-hidden premium-card flex flex-col animate-scale-in"
        style={{ background: "var(--neu-base)", border: "1px solid rgba(255,255,255,0.1)" }}>
        
        {/* Modal Header */}
        <div className="p-5 lg:p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black uppercase"
              style={{ background: "linear-gradient(145deg, var(--brand-green-dark), var(--brand-green))", color: "#fff", boxShadow: "var(--shadow-raised)" }}>
              {user.full_name.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg lg:text-xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>{user.full_name}</h2>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-text-muted opacity-60 uppercase tracking-widest">
                User Profile Details
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 transition-colors text-text-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 lg:p-8 space-y-8 scrollbar-thin">
          
          {/* Section: Overview Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <ModalDetailRow icon={<Mail className="w-3.5 h-3.5" />} label="Email Address" value={user.email} />
              <ModalDetailRow icon={<Shield className="w-3.5 h-3.5" />} label="Platform Role" value={user.role} isBadge />
              <ModalDetailRow icon={<Calendar className="w-3.5 h-3.5" />} label="Joined Date" value={formatDate(user.created_at)} />
            </div>
            <div className="space-y-4">
              <ModalDetailRow icon={<MapPin className="w-3.5 h-3.5" />} label="Organisation" value={user.org_name} />
              <ModalDetailRow icon={<Activity className="w-3.5 h-3.5" />} label="Status" value={user.is_disabled ? "Disabled" : "Active"} 
                valueColor={user.is_disabled ? "#ef4444" : "var(--brand-green-dark)"} />
              <ModalDetailRow icon={<Leaf className="w-3.5 h-3.5" />} label="ID" value={user.id} isCode />
            </div>
          </div>

          {/* Section: Activity / Bills */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-4 rounded-full bg-brand-orange" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Recent Billing Activity</h3>
            </div>
            
            <div className="space-y-2">
              {(!user.bills || user.bills.length === 0) ? (
                <div className="p-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                  <p className="text-xs font-bold text-text-muted opacity-40 uppercase tracking-widest">No activity recorded</p>
                </div>
              ) : (
                user.bills.slice(0, 5).map((bill: any) => (
                  <BillActivityRow key={bill.id} bill={bill} />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-white/5 flex justify-end gap-3 bg-white/2">
          <button onClick={onClose} 
            className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/5 text-text-muted hover:bg-white/10 transition-all active:scale-95">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalDetailRow({ icon, label, value, isBadge, isCode, valueColor }: { icon: React.ReactNode; label: string; value: string; isBadge?: boolean; isCode?: boolean; valueColor?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-text-muted shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest text-text-muted opacity-40 mb-0.5">{label}</p>
        {isBadge ? (
          <span className="inline-flex px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter"
            style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.2)" }}>
            {value}
          </span>
        ) : (
          <p className={`text-xs font-bold ${isCode ? "font-mono opacity-80" : ""}`} style={{ color: valueColor || "var(--text-primary)" }}>
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

function BillActivityRow({ bill }: { bill: any }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gt-green-500/10 flex items-center justify-center text-brand-green">
          <FileText className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs font-black capitalize" style={{ color: "var(--text-primary)" }}>{bill.bill_type.replace("_", " ")} Bill</p>
          <p className="text-[9px] font-bold text-text-muted opacity-50">{formatDate(bill.bill_date)}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs font-black" style={{ color: "var(--brand-green-dark)" }}>{bill.co2_kg.toFixed(1)} kg</p>
        <p className="text-[9px] font-bold text-text-muted opacity-40 uppercase tracking-widest">Estimated CO₂e</p>
      </div>
    </div>
  );
}

/* ── Helper: Bill Detail Modal ──────────────────────────────── */
function BillDetailModal({ bill, isOpen, onClose }: { bill: any; isOpen: boolean; onClose: () => void }) {
  if (!isOpen || !bill) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={onClose} />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-xl max-h-full overflow-hidden premium-card flex flex-col animate-scale-in"
        style={{ background: "var(--neu-base)", border: "1px solid rgba(255,255,255,0.1)" }}>
        
        {/* Modal Header */}
        <div className="p-5 lg:p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-brand-orange"
              style={{ background: "var(--bg-inset)", boxShadow: "var(--shadow-raised)" }}>
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg lg:text-xl font-black tracking-tight capitalize" style={{ color: "var(--text-primary)" }}>{bill.bill_type.replace("_", " ")} Record</h2>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-text-muted opacity-60 uppercase tracking-widest">
                Carbon Footprint Details
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 transition-colors text-text-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 lg:p-8 space-y-8 scrollbar-thin">
          
          {/* Main KPI Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="premium-card p-4 bg-gt-green-500/5 border-gt-green-500/20">
              <p className="text-[9px] font-black uppercase tracking-widest text-brand-green-dark opacity-70 mb-1">Total CO₂e</p>
              <p className="text-xl font-black text-brand-green-dark">{bill.co2_kg.toLocaleString()} <span className="text-xs">kg</span></p>
            </div>
            <div className="premium-card p-4 bg-brand-orange/5 border-brand-orange/20">
              <p className="text-[9px] font-black uppercase tracking-widest text-brand-orange-dark opacity-70 mb-1">Resource Usage</p>
              <p className="text-xl font-black text-brand-orange-dark">{bill.usage_amount.toLocaleString()} <span className="text-xs">{bill.usage_unit}</span></p>
            </div>
          </div>

          {/* Details List */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <ModalDetailRow icon={<Calendar className="w-3.5 h-3.5" />} label="Record Date" value={formatDate(bill.bill_date)} />
              <ModalDetailRow icon={<BarChart3 className="w-3.5 h-3.5" />} label="Type" value={bill.bill_type.toUpperCase()} isBadge />
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <ModalDetailRow 
                icon={<ShieldAlert className="w-3.5 h-3.5" />} 
                label="Financial Cost" 
                value={bill.cost_gbp != null ? `£${bill.cost_gbp.toLocaleString()}` : "Not recorded"} 
                valueColor={bill.cost_gbp != null ? "var(--text-primary)" : "var(--text-muted)"}
              />
              <ModalDetailRow icon={<Leaf className="w-3.5 h-3.5" />} label="Record ID" value={bill.id} isCode />
            </div>
          </div>

          {/* Audit Information */}
          <div className="p-4 rounded-2xl bg-white/2 border border-white/5">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-3 h-3 text-text-muted opacity-40" />
              <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted opacity-60">Audit Information</h3>
            </div>
            <p className="text-[10px] leading-relaxed text-text-muted opacity-80">
              This record represents the calculated carbon emissions for {bill.bill_type.replace("_", " ")} consumption. 
              The calculation uses industry-standard emission factors verified for the GreenTrack AI platform.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-white/5 flex justify-end gap-3 bg-white/2">
          <button onClick={onClose} 
            className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/5 text-text-muted hover:bg-white/10 transition-all active:scale-95">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Helper: Detail Item ─────────────────────────────────────── */
function DetailItem({ label, value, isCode, valueColor }: { label: string; value: string | number; isCode?: boolean; valueColor?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[9px] font-black uppercase tracking-widest text-text-muted opacity-40">{label}</span>
      <span className={`text-xs font-bold ${isCode ? "font-mono opacity-80" : ""}`} style={{ color: valueColor || "var(--text-primary)" }}>
        {value}
      </span>
    </div>
  );
}
