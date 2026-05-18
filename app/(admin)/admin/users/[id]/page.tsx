"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  User as UserIcon, ArrowLeft, Shield, Building2, FileText,
  ChevronDown, Ban, CheckCircle2, Key, Activity,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/utils/format";

const ROLE_STYLES: Record<string, { bg: string; text: string; ring: string }> = {
  owner: { bg: "rgba(249,115,22,0.10)", text: "var(--brand-orange-dark)", ring: "rgba(249,115,22,0.20)" },
  admin: { bg: "rgba(59,130,246,0.10)", text: "#3b82f6", ring: "rgba(59,130,246,0.20)" },
  member: { bg: "rgba(120,120,120,0.08)", text: "var(--text-muted)", ring: "rgba(120,120,120,0.15)" },
  superadmin: { bg: "rgba(239,68,68,0.10)", text: "#ef4444", ring: "rgba(239,68,68,0.20)" },
  super_admin: { bg: "rgba(239,68,68,0.10)", text: "#ef4444", ring: "rgba(239,68,68,0.20)" },
};

const TABS = [
  { key: "profile", label: "Profile", icon: UserIcon },
  { key: "activity", label: "Activity", icon: Activity },
  { key: "danger", label: "Danger Zone", icon: Shield },
];

interface UserDetail {
  id: string; full_name: string; email: string; role: string;
  org_id: string; org_name: string; created_at: string; is_disabled?: boolean;
  bills: { id: string; bill_type: string; bill_date: string; co2_kg: number }[];
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("profile");
  const [disableConfirm, setDisableConfirm] = useState(false);
  const [disableLoading, setDisableLoading] = useState(false);
  const [roleConfirm, setRoleConfirm] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch(`/api/admin/users?detail=${id}`);
      if (res.ok) { const d = await res.json(); setUser(d.user ?? null); }
      setLoading(false);
    }
    if (id) load();
  }, [id]);

  const isSuperadmin = user?.role === "superadmin" || user?.role === "super_admin";

  async function handleRoleChange() {
    if (!user || !roleConfirm) return;
    setRoleLoading(true);
    const res = await fetch("/api/admin/users", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id, role: roleConfirm }),
    });
    if (res.ok) { setUser({ ...user, role: roleConfirm }); toast.success(`Role updated to ${roleConfirm}`); }
    else toast.error("Failed to change role");
    setRoleLoading(false); setRoleConfirm(null);
  }

  async function handleDisableToggle() {
    if (!user) return;
    setDisableLoading(true);
    const action = user.is_disabled ? "enable" : "disable";
    const res = await fetch("/api/admin/users", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id, action }),
    });
    if (res.ok) { setUser({ ...user, is_disabled: !user.is_disabled }); toast.success(`User ${action}d`); }
    else toast.error(`Failed to ${action} user`);
    setDisableLoading(false); setDisableConfirm(false);
  }

  async function handleResetPassword() {
    if (!user) return;
    setResetLoading(true);
    const res = await fetch(`/api/admin/users/${user.id}/reset-password`, { method: "POST" });
    if (res.ok) toast.success("Password reset email sent");
    else toast.error("Failed to send reset email");
    setResetLoading(false); setResetConfirm(false);
  }

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 w-40 rounded-xl" style={{ background: "var(--bg-inset)" }} />
      <div className="premium-card p-8 h-40" />
      <div className="premium-card p-8 h-64" />
    </div>
  );

  if (!user) return (
    <div className="text-center py-20">
      <UserIcon className="w-12 h-12 mx-auto mb-4 text-text-muted opacity-30" />
      <p className="text-lg font-black" style={{ color: "var(--text-primary)" }}>User not found</p>
      <Link href="/admin/users" className="text-sm font-bold mt-2 inline-block" style={{ color: "var(--brand-orange)" }}>← Back to list</Link>
    </div>
  );

  const initials = (user.full_name || "?").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const roleStyle = ROLE_STYLES[user.role] ?? ROLE_STYLES.member;

  return (
    <div className="space-y-4 lg:space-y-6 animate-scale-in">
      <Link href="/admin/users" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all hover:gap-3" style={{ color: "var(--text-muted)" }}>
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Users
      </Link>

      {/* Header */}
      <div className="premium-card p-5 lg:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center text-xl font-black shrink-0 relative"
            style={{ background: user.is_disabled ? "linear-gradient(145deg,#6b7280,#9ca3af)" : "linear-gradient(145deg,var(--brand-green-dark),var(--brand-green))", color: "#fff", boxShadow: "var(--shadow-raised)", opacity: user.is_disabled ? 0.7 : 1 }}>
            {initials}
            {user.is_disabled && <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-red-500 border-2 flex items-center justify-center" style={{ borderColor: "var(--neu-base)" }}><Ban className="w-3 h-3 text-white" /></div>}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl lg:text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>{user.full_name}</h1>
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest" style={{ background: roleStyle.bg, color: roleStyle.text, border: `1px solid ${roleStyle.ring}` }}>{user.role.replace("_", " ")}</span>
              {user.is_disabled && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest" style={{ background: "rgba(239,68,68,0.10)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.20)" }}><Ban className="w-3 h-3" />Disabled</span>}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted opacity-60">
              {user.email} ·{" "}
              {user.org_id
                ? <Link href={`/admin/organisations/${user.org_id}`} className="hover:underline" style={{ color: "var(--brand-green-dark)" }}>{user.org_name}</Link>
                : <span style={{ color: "#ef4444" }}>GreenTrack Platform</span>
              }
              {" "}· Joined {formatDate(user.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl overflow-x-auto" style={{ background: "var(--neu-base)", boxShadow: "var(--shadow-inset-xs)", border: "var(--card-border)", scrollbarWidth: "none" } as React.CSSProperties}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} type="button" onClick={() => setTab(key)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap"
            style={tab === key ? { background: "var(--bg-surface)", color: key === "danger" ? "#ef4444" : "var(--brand-orange)", boxShadow: "var(--shadow-raised)" } : { color: "var(--text-muted)" }}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === "profile" && (
        <div className="space-y-4">
          <div className="premium-card p-5 lg:p-6">
            <h3 className="text-sm font-black tracking-tight mb-4" style={{ color: "var(--text-primary)" }}>User Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Full Name", value: user.full_name },
                { label: "Email", value: user.email },
                { label: "Organisation", value: user.org_name, link: user.org_id ? `/admin/organisations/${user.org_id}` : undefined },
                { label: "Joined", value: formatDate(user.created_at) },
              ].map(({ label, value, link }) => (
                <div key={label} className="p-3 rounded-xl" style={{ background: "var(--bg-inset)", border: "var(--card-border)" }}>
                  <p className="text-[9px] font-black uppercase tracking-widest text-text-muted opacity-50 mb-1">{label}</p>
                  {link ? <Link href={link} className="text-xs font-black" style={{ color: "var(--brand-green-dark)" }}>{value}</Link>
                    : <p className="text-xs font-black" style={{ color: "var(--text-primary)" }}>{value}</p>}
                </div>
              ))}
            </div>
          </div>

          {!isSuperadmin && (
            <div className="premium-card p-5 lg:p-6">
              <h3 className="text-sm font-black tracking-tight mb-4" style={{ color: "var(--text-primary)" }}>Role Management</h3>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <select value={user.role} onChange={(e) => setRoleConfirm(e.target.value)}
                    className="appearance-none pr-8 pl-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer focus:outline-none"
                    style={{ background: "var(--bg-inset)", color: "var(--text-primary)", border: "var(--card-border)" }}>
                    <option value="owner">Owner</option><option value="admin">Admin</option><option value="member">Member</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted" />
                </div>
                <span className="text-[10px] font-bold text-text-muted">Current: {user.role}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Activity Tab */}
      {tab === "activity" && (
        <div className="premium-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border-subtle">
            <div className="flex items-center gap-2"><FileText className="w-4 h-4" style={{ color: "var(--brand-orange)" }} />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Bill Uploads ({(user.bills ?? []).length})</p></div>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="bg-bg-inset/20 border-b border-border-subtle">
              {["Type", "Date", "CO₂ (kg)"].map((h) => <th key={h} className="px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted text-left">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-border-subtle/50">
              {(user.bills ?? []).length === 0
                ? <tr><td colSpan={3} className="py-16 text-center text-sm font-bold text-text-muted opacity-40">No bill uploads found</td></tr>
                : (user.bills ?? []).map((b) => (
                  <tr key={b.id} className="hover:bg-gt-green-50/30 transition-all">
                    <td className="px-6 py-3"><span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg" style={{ background: "var(--bg-inset)", color: "var(--text-secondary)" }}>{b.bill_type.replace("_", " ")}</span></td>
                    <td className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-text-muted">{formatDate(b.bill_date)}</td>
                    <td className="px-6 py-3 text-xs font-black" style={{ color: "var(--brand-green-dark)" }}>{b.co2_kg.toFixed(1)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Danger Zone Tab */}
      {tab === "danger" && (
        <div className="premium-card p-5 lg:p-6" style={{ borderTop: "3px solid #ef4444" }}>
          <h3 className="text-sm font-black tracking-tight mb-1" style={{ color: "#ef4444" }}>Danger Zone</h3>
          <p className="text-[10px] font-bold text-text-muted mb-5">These actions have significant consequences for this user.</p>
          <div className="space-y-3">
            {!isSuperadmin && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl" style={{ background: "var(--bg-inset)", border: "var(--card-border)" }}>
                <div>
                  <p className="text-xs font-black" style={{ color: "var(--text-primary)" }}>{user.is_disabled ? "Enable Account" : "Disable Account"}</p>
                  <p className="text-[10px] font-bold text-text-muted">{user.is_disabled ? "Re-enable login access" : "Block user from logging in"}</p>
                </div>
                <button type="button" onClick={() => setDisableConfirm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:brightness-110 active:scale-95 shrink-0"
                  style={{ background: user.is_disabled ? "rgba(34,197,94,0.10)" : "rgba(239,68,68,0.08)", color: user.is_disabled ? "var(--brand-green-dark)" : "#ef4444", border: `1px solid ${user.is_disabled ? "rgba(34,197,94,0.20)" : "rgba(239,68,68,0.15)"}` }}>
                  {user.is_disabled ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                  {user.is_disabled ? "Enable" : "Disable"}
                </button>
              </div>
            )}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl" style={{ background: "var(--bg-inset)", border: "var(--card-border)" }}>
              <div>
                <p className="text-xs font-black" style={{ color: "var(--text-primary)" }}>Reset Password</p>
                <p className="text-[10px] font-bold text-text-muted">Send a password reset email to {user.email}</p>
              </div>
              <button type="button" onClick={() => setResetConfirm(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:brightness-110 active:scale-95 shrink-0"
                style={{ background: "rgba(249,115,22,0.08)", color: "var(--brand-orange-dark)", border: "1px solid rgba(249,115,22,0.15)" }}>
                <Key className="w-3.5 h-3.5" /> Reset Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <ConfirmDialog open={disableConfirm} title={user.is_disabled ? "Enable User" : "Disable User"}
        description={user.is_disabled ? `Re-enable "${user.full_name}"?` : `Disable "${user.full_name}"? They will be blocked from logging in.`}
        confirmLabel={user.is_disabled ? "Enable" : "Disable"} variant={user.is_disabled ? "info" : "danger"}
        loading={disableLoading} onConfirm={handleDisableToggle} onCancel={() => setDisableConfirm(false)} />

      <ConfirmDialog open={!!roleConfirm} title="Change User Role"
        description={`Change ${user.full_name}'s role from "${user.role}" to "${roleConfirm}"?`}
        confirmLabel="Change Role" variant="warning" loading={roleLoading}
        onConfirm={handleRoleChange} onCancel={() => setRoleConfirm(null)} />

      <ConfirmDialog open={resetConfirm} title="Reset Password"
        description={`Send a password reset email to ${user.email}?`}
        confirmLabel="Send Reset Email" variant="warning" loading={resetLoading}
        onConfirm={handleResetPassword} onCancel={() => setResetConfirm(false)} />
    </div>
  );
}
