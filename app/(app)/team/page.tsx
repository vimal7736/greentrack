"use client";
import { useState } from "react";
import { UserPlus, Trash2, Crown, User, ChevronDown, Clock, Check, X, ShieldAlert, Building2 } from "lucide-react";

import type { TeamMember, TeamApiResponse } from "@/types";
import { formatDate } from "@/lib/utils/format";
import { PageLayout } from "@/components/ui/PageLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DataTable, type ColumnDef } from "@/components/ui/DataTable";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useApi } from "@/hooks/useApi";
import { useFetch } from "@/hooks/useFetch";
import { useEffect } from "react";

export default function TeamPage() {
  const { data: teamData, loading, error: fetchError, refetch: fetchTeam } = useFetch<any>("/api/team");
  const members = teamData?.members ?? [];
  const org = teamData?.org ?? null;
  const myRole = teamData?.myRole ?? "member";
  const isAdmin = myRole === "admin" || myRole === "owner";

  useEffect(() => {
    if (org) {
      setDomain(org.discovery_domain || "");
      setAllowDiscovery(org.allow_discovery);
    }
  }, [org]);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [invitePass, setInvitePass] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<"idle" | "success" | "error">("idle");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openRoleDropdown, setOpenRoleDropdown] = useState<string | null>(null);

  // Discovery Settings State
  const [domain, setDomain] = useState("");
  const [allowDiscovery, setAllowDiscovery] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Join Requests State
  const [activeTab, setActiveTab] = useState<"members" | "requests">("members");
  const { data: requestData, loading: loadingReq, refetch: fetchRequests } = useFetch<{ requests: any[] }>("/api/team/requests");
  const requests = requestData?.requests ?? [];

  const { call, error: actionError } = useApi();
  const { call: inviteCall, error: inviteError } = useApi();
  const { call: resolveCall } = useApi();

  async function handleInvite() {
    if (!inviteEmail) return;
    setInviting(true);
    const { ok } = await inviteCall("/api/team", {
      method: "POST",
      body: JSON.stringify({ 
        email: inviteEmail,
        fullName: inviteName,
        password: invitePass 
      }),
    });
    setInviting(false);
    if (ok) {
      setInviteStatus("success");
      setInviteEmail("");
      setInviteName("");
      setInvitePass("");
      fetchTeam(); // Refresh the list to show the new member
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

  async function resolveRequest(requestId: string, action: "approve" | "reject") {
    const { ok } = await resolveCall("/api/team/requests/resolve", {
      method: "POST",
      body: JSON.stringify({ requestId, action }),
    });
    if (ok) {
      fetchRequests();
      if (action === "approve") fetchTeam();
    }
  }

  async function handleSaveSettings() {
    setSavingSettings(true);
    const { ok } = await call("/api/org/settings", {
      method: "PATCH",
      body: JSON.stringify({
        discovery_domain: domain.toLowerCase().trim(),
        allow_discovery: allowDiscovery,
      }),
    });
    setSavingSettings(false);
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
                {isAdmin ? (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setOpenRoleDropdown(openRoleDropdown === member.id ? null : member.id)}
                      className="text-[10px] font-black uppercase tracking-[0.1em] pl-4 pr-10 py-2.5 rounded-xl bg-white border border-gray-100 text-gray-900 flex items-center gap-2 hover:border-gt-green-400 shadow-sm transition-all outline-none"
                    >
                      {member.role}
                      <ChevronDown className={`w-3.5 h-3.5 text-gt-green-600 transition-transform duration-300 ${openRoleDropdown === member.id ? "rotate-180" : ""}`} />
                    </button>

                    {openRoleDropdown === member.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpenRoleDropdown(null)} />
                        <div className="absolute top-full left-0 mt-2 w-40 z-50 animate-scale-in bg-white border border-gray-100 shadow-2xl p-2 rounded-2xl">
                          {["member", "admin"].map((r) => (
                            <button
                              key={r}
                              onClick={() => {
                                handleRoleChange(member.id, r);
                                setOpenRoleDropdown(null);
                              }}
                              className={`w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                member.role === r
                                  ? "bg-gt-green-600 text-white shadow-lg"
                                  : "text-text-muted hover:text-text-primary hover:bg-gray-50"
                              }`}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <span className="text-[10px] px-4 py-2.5 rounded-xl font-black uppercase tracking-[0.1em] bg-gray-50 text-gray-400 border border-gray-100 shadow-inner">
                    {member.role}
                  </span>
                )}
              </div>
            )}
            <p className="text-[9px] font-bold text-text-muted mt-2 opacity-30 uppercase tracking-widest">
              Registered {formatDate(member.created_at)}
            </p>
          </div>

          {isAdmin && member.role !== "owner" && (
            <Button
              variant="danger"
              size="sm"
              disabled={deletingId === member.id}
              onClick={() => handleRemove(member.id)}
              className="w-9 h-9 !p-0 shadow-sm border border-red-100 hover:scale-105 active:scale-95 transition-all"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  /* ── Seat utilization widget (header right slot) ──────────────── */
  const seatWidget = org ? (
    <div className="premium-card px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 sm:gap-6">
      <div className="text-right">
        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted opacity-40 mb-1 hidden sm:block">
          Seat Utilization
        </p>
        <p className="text-base sm:text-lg font-black text-text-primary tracking-tighter">
          {members.length}<span className="text-xs opacity-20">/</span>{org.seats_limit}
        </p>
      </div>
      <div className="flex gap-1 sm:gap-1.5">
        {Array.from({ length: Math.min(org.seats_limit, 6) }, (_, i) => (
          <div
            key={i}
            className={`w-1.5 sm:w-2 h-6 sm:h-8 rounded-full transition-all duration-500 ${
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
    >
      
      <div className="flex gap-2 p-1 bg-bg-inset rounded-2xl border border-border-subtle/30 w-fit mb-8">
        <button
          onClick={() => setActiveTab("members")}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
            activeTab === "members" 
              ? "text-gt-green-600" 
              : "text-text-muted hover:text-text-primary"
          }`}
        >
          Active Members ({members.length})
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "requests" 
                ? "text-gt-green-600" 
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            Join Requests {requests.length > 0 && (
              <span className="w-4 h-4 bg-gt-green-500 text-white rounded-full flex items-center justify-center text-[8px] animate-pulse">
                {requests.length}
              </span>
            )}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
        {/* Management Sidebar - Only for Admins/Owners */}
        {isAdmin && (
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            <div className="premium-card p-5 sm:p-8 space-y-5 sm:space-y-6">
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
                    label="Full Name"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="James Mitchell"
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                  />
                  <Input
                    label="Password"
                    type="password"
                    value={invitePass}
                    onChange={(e) => setInvitePass(e.target.value)}
                    placeholder="Min. 8 characters"
                  />
                  <p className="text-[9px] text-text-muted italic opacity-60">
                    Tip: If you leave password empty, an invite email will be sent for them to set it themselves.
                  </p>
                  <Button
                    variant="primary"
                    fullWidth
                    size="lg"
                    icon={<UserPlus className="w-4 h-4" />}
                    disabled={inviting || !inviteEmail}
                    onClick={handleInvite}
                  >
                    {inviting ? "Processing..." : inviteStatus === "success" ? "Access Provisioned" : "Create & Provision Access"}
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

            {/* Discovery Settings */}
            <div className="premium-card p-6 space-y-5">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                 <Building2 className="w-4 h-4" /> Discovery Settings
              </h3>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-10 h-5 rounded-full relative transition-all ${allowDiscovery ? "bg-gt-green-500" : "bg-bg-inset"}`}>
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={allowDiscovery} 
                      onChange={e => setAllowDiscovery(e.target.checked)} 
                    />
                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${allowDiscovery ? "left-6" : "left-1"}`} />
                  </div>
                  <span className="text-[11px] font-bold text-text-primary group-hover:text-gt-green-600 transition-colors">
                    Enable Domain Discovery
                  </span>
                </label>

                <div className="space-y-2">
                  <p className="text-[9px] font-black text-text-muted uppercase tracking-widest opacity-40">Organisation Domain</p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted opacity-40 text-xs">@</span>
                      <input
                        className="w-full bg-bg-inset border border-border-subtle/50 rounded-xl pl-7 pr-3 py-2 text-xs text-text-primary focus:border-gt-green-500 outline-none transition-all"
                        placeholder="company.com"
                        value={domain}
                        onChange={e => setDomain(e.target.value)}
                      />
                    </div>
                    <Button 
                      size="sm" 
                      disabled={savingSettings || (domain === org?.discovery_domain && allowDiscovery === org?.allow_discovery)}
                      onClick={handleSaveSettings}
                    >
                      {savingSettings ? "..." : "Save"}
                    </Button>
                  </div>
                  <p className="text-[8px] text-text-muted leading-relaxed opacity-60">
                    Allows users with this email domain to find and request to join your organisation automatically during signup.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area - Expands to full width if sidebar is hidden */}
        <div className={isAdmin ? "lg:col-span-2" : "lg:col-span-3"}>
          {activeTab === "members" ? (
            <DataTable<TeamMember>
              columns={columns}
              data={members}
              rowKey={(m) => m.id}
              loading={loading}
              loadingLabel="Querying team registry..."
              emptyIcon={<UserPlus className="w-10 h-10 text-gt-green-500" />}
              emptyTitle="No Team Members"
              emptyMessage="Invite your first collaborator to get started."
              mobileRender={(member) => {
                const initials = member.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
                return (
                  <div className="flex items-center gap-3 px-4 py-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gt-green-500 to-gt-green-700 flex items-center justify-center text-xs font-black text-white shadow shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="text-sm font-black text-text-primary truncate">{member.full_name}</p>
                        {member.role === "owner" && <Crown className="w-3 h-3 text-yellow-500 shrink-0" />}
                      </div>
                      <p className="text-[10px] text-text-muted truncate">{member.email}</p>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      {member.role === "owner" ? (
                        <span className="text-[9px] px-3 py-1 rounded-lg font-black uppercase tracking-widest bg-yellow-500/10 text-yellow-700">
                          Owner
                        </span>
                      ) : (
                        <div className="relative inline-block">
                          {isAdmin ? (
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setOpenRoleDropdown(openRoleDropdown === member.id ? null : member.id)}
                                className="text-[10px] font-black uppercase tracking-[0.1em] pl-3 pr-8 py-2 rounded-xl bg-white border border-gray-100 text-gray-900 flex items-center gap-1 hover:border-gt-green-400 shadow-sm transition-all outline-none"
                              >
                                {member.role}
                                <ChevronDown className={`w-3 h-3 text-gt-green-600 transition-transform duration-300 ${openRoleDropdown === member.id ? "rotate-180" : ""}`} />
                              </button>

                              {openRoleDropdown === member.id && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setOpenRoleDropdown(null)} />
                                  <div className="absolute bottom-full right-0 mb-2 w-32 z-50 animate-scale-in bg-white border border-gray-100 shadow-2xl p-1.5 rounded-2xl">
                                    {["member", "admin"].map((r) => (
                                      <button
                                        key={r}
                                        onClick={() => {
                                          handleRoleChange(member.id, r);
                                          setOpenRoleDropdown(null);
                                        }}
                                        className={`w-full text-left px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                          member.role === r
                                            ? "bg-gt-green-600 text-white shadow-lg"
                                            : "text-text-muted hover:text-text-primary hover:bg-gray-50"
                                        }`}
                                      >
                                        {r}
                                      </button>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          ) : (
                            <span className="text-[9px] px-3 py-2 rounded-xl font-black uppercase tracking-[0.1em] bg-gray-50 text-gray-400 border border-gray-100 shadow-inner">
                              {member.role}
                            </span>
                          )}
                        </div>
                      )}
                      {isAdmin && member.role !== "owner" && (
                        <button
                          type="button"
                          disabled={deletingId === member.id}
                          onClick={() => handleRemove(member.id)}
                          className="w-8 h-8 rounded-xl bg-white shadow-sm border border-red-50 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all disabled:opacity-40"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              }}
              footer={
                <div className="px-4 sm:px-8 py-4 border-t border-border-subtle/50 bg-bg-inset/10 flex items-center justify-between">
                  <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">
                    {members.length} Verified Accounts
                  </p>
                </div>
              }
            />
          ) : (
            <div className="space-y-4">
              {requests.length === 0 ? (
                <div className="premium-card p-12 text-center flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-3xl bg-bg-inset flex items-center justify-center text-text-muted/30">
                    <Clock className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-text-primary">No Pending Requests</h3>
                    <p className="text-[11px] text-text-muted mt-1">Users who find your organisation via domain discovery will appear here.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map((req) => (
                    <div key={req.id} className="premium-card p-5 flex items-center justify-between group hover:border-gt-green-500/30 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-bg-inset flex items-center justify-center text-text-muted">
                          <User className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-text-primary tracking-tight">{req.full_name}</p>
                          <p className="text-[10px] font-bold text-text-muted opacity-50 uppercase tracking-widest mt-0.5">{req.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="text-red-500 hover:bg-red-50 border-red-100"
                          onClick={() => resolveRequest(req.id, "reject")}
                        >
                          <X className="w-3.5 h-3.5 mr-1.5" /> Reject
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => resolveRequest(req.id, "approve")}
                        >
                          <Check className="w-3.5 h-3.5 mr-1.5" /> Approve Access
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-start gap-3">
                <ShieldAlert className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Security Note</p>
                  <p className="text-[9px] text-blue-600 leading-relaxed">
                    Approving a request grants the user "Member" access immediately. They will be able to view and contribute data for {org?.name}.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
