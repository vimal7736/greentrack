"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Users, Search, Shield, UserCheck, User as UserIcon,
  ChevronDown, ExternalLink, Ban, CheckCircle2,
  Mail, Calendar, MapPin, Activity, X, FileText, Leaf, ShieldAlert,
} from "lucide-react";
import type { AdminUser } from "@/types";
import { DataTable, type ColumnDef } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/utils/format";

/* ── Role badge styles ─────────────────────────────────────── */
const ROLE_STYLES: Record<string, { bg: string; text: string; ring: string }> = {
  owner:       { bg: "rgba(249,115,22,0.10)", text: "var(--brand-orange-dark)", ring: "rgba(249,115,22,0.20)" },
  admin:       { bg: "rgba(239,68,68,0.10)",  text: "#ef4444",                 ring: "rgba(239,68,68,0.20)" },
  member:      { bg: "rgba(120,120,120,0.08)", text: "var(--text-muted)",       ring: "rgba(120,120,120,0.15)" },
  superadmin:  { bg: "rgba(239,68,68,0.10)",  text: "#ef4444",                 ring: "rgba(239,68,68,0.20)" },
  super_admin: { bg: "rgba(239,68,68,0.10)",  text: "#ef4444",                 ring: "rgba(239,68,68,0.20)" },
};

function isPlatformAdmin(role: string) {
  return role === "admin" || role === "superadmin" || role === "super_admin";
}

const ROLE_FILTERS = [
  { key: "all",    label: "All" },
  { key: "owner",  label: "Owners" },
  { key: "member", label: "Members" },
  { key: "admin",  label: "Admins" },
];

const ASSIGNABLE_ROLES = ["owner", "member"];

export default function AdminUsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [changingRole, setChangingRole] = useState<string | null>(null);

  /* ── Disable confirmation ────────────────────────────────── */
  const [disableTarget, setDisableTarget] = useState<AdminUser | null>(null);
  const [disableLoading, setDisableLoading] = useState(false);

  /* ── Role change confirmation ────────────────────────────── */
  const [roleChangeTarget, setRoleChangeTarget] = useState<{ user: AdminUser; newRole: string } | null>(null);
  const [roleChangeLoading, setRoleChangeLoading] = useState(false);

  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userModalLoading, setUserModalLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const d = await res.json();
        setUsers(d.users ?? []);
      }
      setLoading(false);
    }
    load();
  }, []);

  /* ── Role change handler ──────────────────────────────────── */
  function initiateRoleChange(user: AdminUser, newRole: string) {
    if (user.role === "superadmin" || user.role === "super_admin") {
      toast.error("Cannot change a superadmin's role");
      return;
    }
    setRoleChangeTarget({ user, newRole });
  }

  async function confirmRoleChange() {
    if (!roleChangeTarget) return;
    const { user, newRole } = roleChangeTarget;
    setRoleChangeLoading(true);

    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id, role: newRole }),
    });

    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, role: newRole } : u));
      toast.success(`${user.full_name}'s role updated to ${newRole}`);
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Failed to change role");
    }

    setRoleChangeLoading(false);
    setRoleChangeTarget(null);
  }

  /* ── Disable/Enable handler ──────────────────────────────── */
  async function handleDisableToggle() {
    if (!disableTarget) return;
    const isCurrentlyDisabled = (disableTarget as AdminUser & { is_disabled?: boolean }).is_disabled;
    const action = isCurrentlyDisabled ? "enable" : "disable";
    setDisableLoading(true);

    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: disableTarget.id, action }),
    });

    if (res.ok) {
      setUsers((prev) => prev.map((u) =>
        u.id === disableTarget.id
          ? { ...u, is_disabled: !isCurrentlyDisabled } as AdminUser
          : u
      ));
      toast.success(`User ${action === "disable" ? "disabled" : "enabled"} successfully`);
    } else {
      toast.error(`Failed to ${action} user`);
    }

    setDisableLoading(false);
    setDisableTarget(null);
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

  const filtered = useMemo(() => {
    let result = users;
    if (roleFilter !== "all") {
      if (roleFilter === "admin") {
        result = result.filter((u) => u.role === "admin" || u.role === "superadmin" || u.role === "super_admin");
      } else {
        result = result.filter((u) => u.role === roleFilter);
      }
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.full_name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.org_name.toLowerCase().includes(q)
      );
    }
    // Platform admins always float to the top
    return [...result].sort((a, b) => {
      const aAdmin = isPlatformAdmin(a.role) ? 0 : 1;
      const bAdmin = isPlatformAdmin(b.role) ? 0 : 1;
      return aAdmin - bAdmin;
    });
  }, [users, roleFilter, search]);

  /* ── Stats ──────────────────────────────────────────────── */
  const totalUsers = users.length;
  const ownerCount = users.filter((u) => u.role === "owner").length;
  const adminCount = users.filter((u) => u.role === "admin" || u.role === "superadmin" || u.role === "super_admin").length;
  const memberCount = users.filter((u) => u.role === "member").length;

  /* ── Columns ────────────────────────────────────────────── */
  const columns: ColumnDef<AdminUser>[] = [
    {
      key: "user",
      header: "User",
      render: (u) => {
        const initials = (u.full_name || "?")
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);
        const isDisabled = (u as AdminUser & { is_disabled?: boolean }).is_disabled;
        return (
          <button 
            type="button" 
            onClick={() => handleUserClick(u.id)}
            className="flex items-center gap-2 lg:gap-3 group text-left focus:outline-none"
          >
            <div
              className="w-8 h-8 lg:w-9 lg:h-9 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 relative"
              style={{
                background: isDisabled
                  ? "linear-gradient(145deg, #6b7280, #9ca3af)"
                  : "linear-gradient(145deg, var(--brand-green-dark), var(--brand-green))",
                color: "#fff",
                boxShadow: "var(--shadow-raised)",
                opacity: isDisabled ? 0.6 : 1,
              }}
            >
              {initials}
              {isDisabled && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 border-2 flex items-center justify-center"
                  style={{ borderColor: "var(--neu-base)" }}>
                  <Ban className="w-2 h-2 text-white" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black tracking-tight truncate flex items-center gap-1.5 group-hover:text-brand-orange transition-colors" style={{ color: "var(--text-primary)" }}>
                {u.full_name}
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity shrink-0" />
              </p>
              <p className="text-[9px] font-bold text-text-muted opacity-50 truncate">
                {u.email}
              </p>
              {isDisabled && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest mt-0.5"
                  style={{ background: "rgba(239,68,68,0.10)", color: "#ef4444" }}>
                  <Ban className="w-2 h-2" /> Disabled
                </span>
              )}
            </div>
          </button>
        );
      },
    },
    {
      key: "org",
      header: "Organisation",
      render: (u) => {
        const platform = isPlatformAdmin(u.role);
        if (platform) {
          return (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest"
              style={{ color: "#ef4444" }}>
              <ShieldAlert className="w-3 h-3" />
              GreenTrack Platform
            </span>
          );
        }
        return (
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
            {u.org_name}
          </span>
        );
      },
    },
    {
      key: "role",
      header: "Role",
      align: "center",
      render: (u) => {
        const style = ROLE_STYLES[u.role] ?? ROLE_STYLES.member;
        const isSuperadmin = u.role === "superadmin" || u.role === "super_admin";
        const platform = isPlatformAdmin(u.role);
        return (
          <div className="flex flex-col items-center gap-1.5">
            <span
              className="inline-flex items-center gap-1 px-2 lg:px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest"
              style={{
                background: style.bg,
                color: style.text,
                border: `1px solid ${style.ring}`,
              }}
            >
              {platform && <ShieldAlert className="w-3 h-3" />}
              {platform ? "Platform Admin" : u.role.replace("_", " ")}
            </span>
            {/* Role change dropdown — not shown for platform admins */}
            {!isSuperadmin && !isPlatformAdmin(u.role) && (
              <div className="relative inline-block">
                <select
                  value={u.role}
                  disabled={changingRole === u.id}
                  onChange={(e) => initiateRoleChange(u, e.target.value)}
                  className="appearance-none pr-5 pl-2 py-1 rounded-lg text-[8px] font-bold uppercase tracking-widest cursor-pointer focus:outline-none"
                  style={{
                    background: "var(--bg-inset)",
                    color: "var(--text-muted)",
                    border: "var(--card-border)",
                    opacity: changingRole === u.id ? 0.5 : 0.7,
                  }}
                >
                  {ASSIGNABLE_ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <ChevronDown className="w-2.5 h-2.5 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted" />
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "joined",
      header: "Joined",
      render: (u) => (
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
          {formatDate(u.created_at)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (u) => {
        const isSuperadmin = u.role === "superadmin" || u.role === "super_admin";
        if (isSuperadmin || isPlatformAdmin(u.role)) return <span className="text-[9px] font-bold text-text-muted opacity-30">Protected</span>;

        const isDisabled = (u as AdminUser & { is_disabled?: boolean }).is_disabled;
        return (
          <button
            type="button"
            onClick={() => setDisableTarget(u)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all hover:brightness-110 active:scale-95"
            style={{
              background: isDisabled ? "rgba(34,197,94,0.10)" : "rgba(239,68,68,0.08)",
              color: isDisabled ? "var(--brand-green-dark)" : "#ef4444",
              border: `1px solid ${isDisabled ? "rgba(34,197,94,0.20)" : "rgba(239,68,68,0.15)"}`,
            }}
          >
            {isDisabled ? <CheckCircle2 className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
            {isDisabled ? "Enable" : "Disable"}
          </button>
        );
      },
    },
  ];

  return (
    <div className="space-y-4 lg:space-y-6 animate-scale-in">
      {/* ── Stats — 2 cols mobile → 4 desktop ───────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {[
          { label: "Total Users", value: totalUsers, icon: <Users className="w-4 h-4" />, accent: "orange" },
          { label: "Owners", value: ownerCount, icon: <Shield className="w-4 h-4" />, accent: "orange" },
          { label: "Admins", value: adminCount, icon: <UserCheck className="w-4 h-4" />, accent: "green" },
          { label: "Members", value: memberCount, icon: <UserIcon className="w-4 h-4" />, accent: "green" },
        ].map(({ label, value, icon, accent }) => (
          <div
            key={label}
            className="premium-card p-4 lg:p-5"
            style={{ borderTop: `3px solid ${accent === "green" ? "var(--brand-green)" : "var(--brand-orange)"}` }}
          >
            <div className="flex items-center justify-between mb-2 lg:mb-3">
              <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] text-text-muted opacity-50">{label}</span>
              <div
                className="w-7 h-7 lg:w-8 lg:h-8 rounded-xl flex items-center justify-center"
                style={{
                  background: "var(--neu-base)",
                  boxShadow: "var(--shadow-inset-sm)",
                  color: accent === "green" ? "var(--brand-green-dark)" : "var(--brand-orange-dark)",
                }}
              >
                {icon}
              </div>
            </div>
            <span className="text-xl lg:text-2xl font-black tracking-tighter" style={{ color: "var(--text-primary)" }}>
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* ── Search + Filter — stacks on mobile ───────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 lg:gap-4">
        <div className="flex-1">
          <Input
            icon={<Search className="w-4 h-4" />}
            placeholder="Search by name, email, or organisation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Role filter — horizontally scrollable on mobile */}
        <div
          className="flex items-center gap-1 p-1 rounded-xl overflow-x-auto shrink-0"
          style={{
            background: "var(--neu-base)",
            boxShadow: "var(--shadow-inset-xs)",
            border: "var(--card-border)",
            scrollbarWidth: "none",
          } as React.CSSProperties}
        >
          {ROLE_FILTERS.map(({ key, label }) => (
            <div key={key} className="flex items-center">
              {key === "admin" && (
                <div className="w-px h-5 mx-1 rounded-full" style={{ background: "var(--card-border-color, rgba(0,0,0,0.10))" }} />
              )}
              <button
                type="button"
                onClick={() => setRoleFilter(key)}
                className="px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap"
                style={
                  roleFilter === key
                    ? {
                      background: key === "admin" ? "rgba(239,68,68,0.10)" : "var(--bg-surface)",
                      color: key === "admin" ? "#ef4444" : "var(--brand-orange)",
                      boxShadow: "var(--shadow-raised)",
                    }
                    : {
                      color: key === "admin" ? "rgba(239,68,68,0.6)" : "var(--text-muted)",
                    }
                }
              >
                {label}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────── */}
      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(u) => u.id}
        loading={loading}
        loadingLabel="Loading users..."
        emptyIcon={<Users className="w-10 h-10" />}
        emptyTitle="No Users Found"
        emptyMessage="Try adjusting your search or filters."
      />

      {/* ── Disable / Enable Confirmation ──────────────────── */}
      <ConfirmDialog
        open={!!disableTarget}
        title={
          (disableTarget as AdminUser & { is_disabled?: boolean })?.is_disabled
            ? "Enable User Account"
            : "Disable User Account"
        }
        description={
          (disableTarget as AdminUser & { is_disabled?: boolean })?.is_disabled
            ? `Are you sure you want to re-enable "${disableTarget?.full_name}"? They will regain full access.`
            : `Are you sure you want to disable "${disableTarget?.full_name}"? They will be blocked from logging in.`
        }
        confirmLabel={
          (disableTarget as AdminUser & { is_disabled?: boolean })?.is_disabled ? "Enable" : "Disable"
        }
        variant={
          (disableTarget as AdminUser & { is_disabled?: boolean })?.is_disabled ? "info" : "danger"
        }
        loading={disableLoading}
        onConfirm={handleDisableToggle}
        onCancel={() => setDisableTarget(null)}
      />

      {/* ── Role Change Confirmation ───────────────────────── */}
      <ConfirmDialog
        open={!!roleChangeTarget}
        title="Change User Role"
        description={`Change ${roleChangeTarget?.user.full_name}'s role from "${roleChangeTarget?.user.role}" to "${roleChangeTarget?.newRole}"?`}
        confirmLabel="Change Role"
        variant="warning"
        loading={roleChangeLoading}
        onConfirm={confirmRoleChange}
        onCancel={() => setRoleChangeTarget(null)}
      />

      {/* User Detail Modal */}
      <UserDetailModal 
        user={selectedUser} 
        isOpen={!!selectedUser} 
        onClose={() => setSelectedUser(null)} 
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
