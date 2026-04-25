"use client";
import { useState, useEffect } from "react";
import { UserPlus, Trash2, Crown, User, AlertCircle, ChevronDown } from "lucide-react";

import type { TeamMember, TeamApiResponse } from "@/types";
import { formatDate } from "@/lib/utils/format";
import { PageLayout } from "@/components/ui/PageLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DataTable, type ColumnDef } from "@/components/ui/DataTable";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useApi } from "@/hooks/useApi";
import { useFetch } from "@/hooks/useFetch";

export default function TeamPage() {
  const { data: teamData, loading, error: fetchError, refetch: fetchTeam } = useFetch<TeamApiResponse>("/api/team");
  const members = teamData?.members ?? [];
  const org = teamData?.org ?? null;

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<"idle" | "success" | "error">("idle");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { call, error: actionError } = useApi();
  const { call: inviteCall, error: inviteError } = useApi();

  async function handleInvite() {
    if (!inviteEmail) return;
    setInviting(true);
    const { ok } = await inviteCall("/api/team", {
      method: "POST",
      body: JSON.stringify({ email: inviteEmail }),
    });
    setInviting(false);
    if (ok) {
      setInviteStatus("success");
      setInviteEmail("");
      setTimeout(() => setInviteStatus("idle"), 3000);
    } else {
      setInviteStatus("error");
    }
  }

  async function handleRemove(userId: string) {
    if (!confirm("Remove this member from your organisation?")) return;
    setDeletingId(userId);
    const { ok } = await call(`/api/team/${userId}`, { method: "DELETE" });
    setDeletingId(null);
    if (ok) fetchTeam();
  }

  async function handleRoleChange(userId: string, role: string) {
    const { ok } = await call(`/api/team/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
    if (ok) fetchTeam();
  }

  const seatsFull = org ? members.length >= org.seats_limit : false;

  /* ── Column definitions for the DataTable ─────────────────────── */
  const columns: ColumnDef<TeamMember>[] = [
    {
      key: "member",
      header: "Member",
      render: (member) => {
        const initials = member.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
        return (
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gt-green-500 to-gt-green-700 flex items-center justify-center text-sm font-black text-white shadow-lg group-hover:scale-110 transition-transform">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-black text-text-primary tracking-tight">{member.full_name}</p>
                {member.role === "owner" && <Crown className="w-3.5 h-3.5 text-yellow-500" />}
              </div>
              <p className="text-[10px] font-bold text-text-muted opacity-50 uppercase tracking-widest mt-0.5">{member.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: "role",
      header: "Role & Actions",
      align: "right",
      render: (member) => (
        <div className="inline-flex items-center gap-6">
          <div className="text-right">
            {member.role === "owner" ? (
              <span className="text-[9px] px-3 py-1 rounded-lg font-black uppercase tracking-widest bg-yellow-500/10 text-yellow-700 border border-yellow-500/20">
                System Owner
              </span>
            ) : (
              <div className="relative inline-block">
                <select
                  value={member.role}
                  onChange={(e) => handleRoleChange(member.id, e.target.value)}
                  className="text-[9px] font-black uppercase tracking-widest pl-3 pr-8 py-1.5 rounded-lg bg-bg-inset border border-border-subtle/50 text-text-primary appearance-none cursor-pointer focus:border-gt-green-500 outline-none transition-all"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 text-text-primary" />
              </div>
            )}
            <p className="text-[9px] font-bold text-text-muted mt-2 opacity-30 uppercase tracking-widest">
              Registered {formatDate(member.created_at)}
            </p>
          </div>

          {member.role !== "owner" && (
            <Button
              variant="danger"
              size="sm"
              disabled={deletingId === member.id}
              onClick={() => handleRemove(member.id)}
              className="w-9 h-9 !p-0 opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  /* ── Seat utilization widget (header right slot) ──────────────── */
  const seatWidget = org ? (
    <div className="premium-card px-6 py-4 border-none shadow-xl flex items-center gap-6">
      <div className="text-right">
        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted opacity-40 mb-1">
          Seat Utilization
        </p>
        <p className="text-lg font-black text-text-primary tracking-tighter">
          {members.length} <span className="text-xs opacity-20">/</span> {org.seats_limit}
        </p>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: Math.min(org.seats_limit, 8) }, (_, i) => (
          <div
            key={i}
            className={`w-2 h-8 rounded-full transition-all duration-500 ${
              i < members.length
                ? "bg-gt-green-500 shadow-[0_0_12px_rgba(34,197,94,0.3)]"
                : "bg-bg-inset"
            }`}
          />
        ))}
      </div>
    </div>
  ) : undefined;

  return (
    <PageLayout
      icon={<UserPlus className="w-6 h-6" />}
      title="Collaborators"
      subtitle={`Managing governance and access for ${org?.name ?? "your organisation"}`}
      headerRight={seatWidget}
      error={fetchError || actionError}
    >

      <div className="grid grid-cols-3 gap-8">
        {/* Invite Section */}
        <div className="col-span-1 space-y-6">
          <div className="premium-card p-8 border-none space-y-6">
            <SectionHeader
              title="Provision Access"
              subtitle="Invite a new climate auditor"
            />

            {seatsFull ? (
              <div className="p-4 rounded-2xl bg-brand-orange/5 border border-brand-orange/20 space-y-3">
                <p className="text-[10px] font-bold text-brand-orange-dark leading-relaxed uppercase tracking-widest">
                  Capacity Limit Reached
                </p>
                <a href="/billing" className="inline-block px-4 py-2 rounded-lg bg-brand-orange-dark text-white text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-transform">
                  Expand Plan
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                />
                <Button
                  variant="primary"
                  fullWidth
                  size="lg"
                  icon={<UserPlus className="w-4 h-4" />}
                  disabled={inviting || !inviteEmail}
                  onClick={handleInvite}
                >
                  {inviting ? "Processing..." : inviteStatus === "success" ? "Invitation Dispatched" : "Dispatch Invite"}
                </Button>

                {inviteStatus === "success" && (
                  <p className="text-[9px] font-black text-gt-green-600 uppercase tracking-widest text-center animate-fade-in">
                    ✓ Audit link successfully transmitted
                  </p>
                )}
                {inviteStatus === "error" && (
                  <p className="text-[9px] font-black text-red-600 uppercase tracking-widest text-center animate-fade-in">
                    ⚠ {inviteError}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Role Specs */}
          <div className="premium-card p-6 border-none bg-bg-inset/30">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-6 flex items-center gap-2">
               <User className="w-4 h-4" /> Permission Matrix
            </h3>
            <div className="space-y-4">
              {[
                { role: "Owner", color: "text-yellow-600", bg: "bg-yellow-500/10", desc: "Full administrative & financial control" },
                { role: "Admin", color: "text-blue-600", bg: "bg-blue-500/10", desc: "Team management & data auditing" },
                { role: "Member", color: "text-text-muted", bg: "bg-bg-inset", desc: "Data entry & report visualization" },
              ].map(({ role, color, bg, desc }) => (
                <div key={role} className="flex gap-4">
                   <div className={`shrink-0 w-1 rounded-full ${bg} ${color === "text-text-muted" ? "bg-text-muted/20" : ""}`} />
                   <div>
                     <p className={`text-[10px] font-black uppercase tracking-widest ${color}`}>{role}</p>
                     <p className="text-[9px] font-bold text-text-muted opacity-60 mt-0.5">{desc}</p>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Members List — using DataTable */}
        <div className="col-span-2">
          <DataTable<TeamMember>
            columns={columns}
            data={members}
            rowKey={(m) => m.id}
            loading={loading}
            loadingLabel="Querying team registry..."
            emptyIcon={<UserPlus className="w-10 h-10 text-gt-green-500" />}
            emptyTitle="No Team Members"
            emptyMessage="Invite your first collaborator to get started."
            footer={
              <div className="px-8 py-4 border-t border-border-subtle/50 bg-bg-inset/10 flex items-center justify-between">
                <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">
                  {members.length} Verified Accounts
                </p>
              </div>
            }
          />
        </div>
      </div>
    </PageLayout>
  );
}
