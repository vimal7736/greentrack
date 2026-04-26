"use client";
import { useState, useEffect, useMemo } from "react";
import {
  Users, Search, Shield, UserCheck, User as UserIcon,
} from "lucide-react";
import type { AdminUser } from "@/types";
import { DataTable, type ColumnDef } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Input";
import { formatDate } from "@/lib/utils/format";

/* ── Role badge styles ─────────────────────────────────────── */
const ROLE_STYLES: Record<string, { bg: string; text: string; ring: string }> = {
  owner:      { bg: "rgba(249,115,22,0.10)", text: "var(--brand-orange-dark)", ring: "rgba(249,115,22,0.20)" },
  admin:      { bg: "rgba(59,130,246,0.10)", text: "#3b82f6",                 ring: "rgba(59,130,246,0.20)" },
  member:     { bg: "rgba(120,120,120,0.08)", text: "var(--text-muted)",       ring: "rgba(120,120,120,0.15)" },
  superadmin: { bg: "rgba(239,68,68,0.10)",  text: "#ef4444",                 ring: "rgba(239,68,68,0.20)" },
  super_admin: { bg: "rgba(239,68,68,0.10)", text: "#ef4444",                 ring: "rgba(239,68,68,0.20)" },
};

const ROLE_FILTERS = [
  { key: "all",        label: "All" },
  { key: "owner",      label: "Owners" },
  { key: "admin",      label: "Admins" },
  { key: "member",     label: "Members" },
  { key: "superadmin", label: "Super Admins" },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

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

  const filtered = useMemo(() => {
    let result = users;
    if (roleFilter !== "all") {
      result = result.filter((u) => u.role === roleFilter || u.role === roleFilter.replace("admin", "_admin"));
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
    return result;
  }, [users, roleFilter, search]);

  /* ── Stats ──────────────────────────────────────────────── */
  const totalUsers = users.length;
  const ownerCount = users.filter((u) => u.role === "owner").length;
  const adminCount = users.filter((u) => u.role === "admin").length;
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
        return (
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-black shrink-0"
              style={{
                background: "linear-gradient(145deg, var(--brand-green-dark), var(--brand-green))",
                color: "#fff",
                boxShadow: "var(--shadow-raised)",
              }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black tracking-tight truncate" style={{ color: "var(--text-primary)" }}>
                {u.full_name}
              </p>
              <p className="text-[9px] font-bold text-text-muted opacity-50 truncate">
                {u.email}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: "org",
      header: "Organisation",
      render: (u) => (
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
          {u.org_name}
        </span>
      ),
    },
    {
      key: "role",
      header: "Role",
      align: "center",
      render: (u) => {
        const style = ROLE_STYLES[u.role] ?? ROLE_STYLES.member;
        return (
          <span
            className="inline-flex items-center px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest"
            style={{
              background: style.bg,
              color: style.text,
              border: `1px solid ${style.ring}`,
            }}
          >
            {u.role.replace("_", " ")}
          </span>
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
  ];

  return (
    <div className="space-y-6 animate-scale-in">
      {/* ── Stats ──────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Users",  value: totalUsers,  icon: <Users className="w-4 h-4" />,     accent: "orange" },
          { label: "Owners",       value: ownerCount,  icon: <Shield className="w-4 h-4" />,    accent: "orange" },
          { label: "Admins",       value: adminCount,  icon: <UserCheck className="w-4 h-4" />, accent: "green" },
          { label: "Members",      value: memberCount, icon: <UserIcon className="w-4 h-4" />,  accent: "green" },
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

      {/* ── Search + Filter ────────────────────────────────── */}
      <div className="flex items-end gap-4">
        <div className="flex-1">
          <Input
            icon={<Search className="w-4 h-4" />}
            placeholder="Search by name, email, or organisation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div
          className="flex items-center gap-1 p-1 rounded-xl"
          style={{
            background: "var(--neu-base)",
            boxShadow: "var(--shadow-inset-xs)",
            border: "var(--card-border)",
          }}
        >
          {ROLE_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setRoleFilter(key)}
              className="px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap"
              style={
                roleFilter === key
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
    </div>
  );
}
