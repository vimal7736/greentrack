"use client";
import { useState, useEffect, useMemo } from "react";
import {
  Building2, Search, Users, FileText, ChevronDown,
} from "lucide-react";
import type { AdminOrg } from "@/types";
import { DataTable, type ColumnDef } from "@/components/ui/DataTable";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils/format";

/* ── Constants ──────────────────────────────────────────────── */
const TIER_STYLES: Record<string, { bg: string; text: string; ring: string }> = {
  free:     { bg: "rgba(120,120,120,0.10)", text: "var(--text-muted)",         ring: "rgba(120,120,120,0.20)" },
  starter:  { bg: "rgba(59,130,246,0.10)",  text: "#3b82f6",                  ring: "rgba(59,130,246,0.25)" },
  business: { bg: "rgba(34,197,94,0.10)",   text: "var(--brand-green-dark)",  ring: "rgba(34,197,94,0.25)" },
};

const TIER_FILTERS = [
  { key: "all",      label: "All" },
  { key: "free",     label: "Free" },
  { key: "starter",  label: "Starter" },
  { key: "business", label: "Business" },
];

export default function AdminOrganisationsPage() {
  const [orgs, setOrgs] = useState<AdminOrg[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [changingTier, setChangingTier] = useState<string | null>(null);

  useEffect(() => {
    fetchOrgs();
  }, []);

  async function fetchOrgs() {
    setLoading(true);
    const res = await fetch("/api/admin/orgs");
    if (res.ok) {
      const d = await res.json();
      setOrgs(d.orgs ?? []);
    }
    setLoading(false);
  }

  async function handleTierChange(orgId: string, newTier: string) {
    setChangingTier(orgId);
    const res = await fetch("/api/admin/orgs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: orgId, tier: newTier }),
    });
    if (res.ok) {
      setOrgs((prev) => prev.map((o) => o.id === orgId ? { ...o, tier: newTier } : o));
    }
    setChangingTier(null);
  }

  const filtered = useMemo(() => {
    let result = orgs;
    if (tierFilter !== "all") {
      result = result.filter((o) => o.tier === tierFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((o) => o.name.toLowerCase().includes(q));
    }
    return result;
  }, [orgs, tierFilter, search]);

  /* ── Stats ──────────────────────────────────────────────── */
  const totalOrgs = orgs.length;
  const totalUsers = orgs.reduce((s, o) => s + o.user_count, 0);
  const totalBills = orgs.reduce((s, o) => s + o.bill_count, 0);

  /* ── Columns ────────────────────────────────────────────── */
  const columns: ColumnDef<AdminOrg>[] = [
    {
      key: "name",
      header: "Organisation",
      render: (org) => (
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-black uppercase shrink-0"
            style={{
              background: "var(--bg-inset)",
              color: "var(--text-muted)",
              boxShadow: "var(--shadow-inset-xs)",
            }}
          >
            {org.name.charAt(0)}
          </div>
          <span className="text-xs font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
            {org.name}
          </span>
        </div>
      ),
    },
    {
      key: "tier",
      header: "Plan",
      render: (org) => {
        const style = TIER_STYLES[org.tier] ?? TIER_STYLES.free;
        return (
          <span
            className="inline-flex items-center px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest"
            style={{
              background: style.bg,
              color: style.text,
              border: `1px solid ${style.ring}`,
            }}
          >
            {org.tier}
          </span>
        );
      },
    },
    {
      key: "users",
      header: "Users",
      align: "center",
      render: (org) => (
        <div className="flex items-center justify-center gap-1.5">
          <Users className="w-3 h-3 text-text-muted opacity-40" />
          <span className="text-xs font-black" style={{ color: "var(--text-primary)" }}>
            {org.user_count}
          </span>
        </div>
      ),
    },
    {
      key: "bills",
      header: "Bills",
      align: "center",
      render: (org) => (
        <div className="flex items-center justify-center gap-1.5">
          <FileText className="w-3 h-3 text-text-muted opacity-40" />
          <span className="text-xs font-black" style={{ color: "var(--text-primary)" }}>
            {org.bill_count}
          </span>
        </div>
      ),
    },
    {
      key: "created",
      header: "Joined",
      render: (org) => (
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
          {formatDate(org.created_at)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Tier Control",
      align: "right",
      render: (org) => (
        <div className="relative inline-block">
          <select
            value={org.tier}
            disabled={changingTier === org.id}
            onChange={(e) => handleTierChange(org.id, e.target.value)}
            className="appearance-none pr-7 pl-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest cursor-pointer transition-all focus:outline-none"
            style={{
              background: "var(--bg-inset)",
              color: "var(--text-primary)",
              border: "var(--card-border)",
              opacity: changingTier === org.id ? 0.5 : 1,
            }}
          >
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="business">Business</option>
          </select>
          <ChevronDown
            className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-scale-in">
      {/* ── Stat row ───────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Organisations", value: totalOrgs, icon: <Building2 className="w-4 h-4" />, accent: "orange" },
          { label: "Total Users",         value: totalUsers, icon: <Users className="w-4 h-4" />,    accent: "green" },
          { label: "Total Bills",         value: totalBills, icon: <FileText className="w-4 h-4" />, accent: "green" },
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
              {value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      {/* ── Search + Filter ────────────────────────────────── */}
      <div className="flex items-end gap-4">
        <div className="flex-1">
          <Input
            icon={<Search className="w-4 h-4" />}
            placeholder="Search organisations..."
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
          {TIER_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTierFilter(key)}
              className="px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
              style={
                tierFilter === key
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
        rowKey={(o) => o.id}
        loading={loading}
        loadingLabel="Loading organisations..."
        emptyIcon={<Building2 className="w-10 h-10" />}
        emptyTitle="No Organisations Found"
        emptyMessage="Try adjusting your search or filters."
      />
    </div>
  );
}
