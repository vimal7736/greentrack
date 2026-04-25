"use client";
import { useState, useEffect } from "react";
import { UserPlus, Trash2, Crown, User, CheckCircle, AlertCircle, ChevronDown } from "lucide-react";

interface Member {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

interface OrgInfo {
  name: string;
  tier: string;
  seats_limit: number;
}

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-yellow-100 text-yellow-700",
  admin: "bg-blue-100 text-blue-700",
  member: "bg-gray-100 text-gray-600",
};

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [org, setOrg] = useState<OrgInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<"idle" | "success" | "error">("idle");
  const [inviteError, setInviteError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchTeam() {
    setLoading(true);
    const res = await fetch("/api/team");
    if (res.ok) {
      const data = await res.json();
      setMembers(data.members);
      setOrg(data.org);
    } else {
      setError("Failed to load team");
    }
    setLoading(false);
  }

  useEffect(() => { fetchTeam(); }, []);

  async function handleInvite() {
    if (!inviteEmail) return;
    setInviting(true);
    setInviteError("");
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail }),
    });
    const data = await res.json();
    setInviting(false);
    if (res.ok) {
      setInviteStatus("success");
      setInviteEmail("");
      setTimeout(() => setInviteStatus("idle"), 3000);
    } else {
      setInviteStatus("error");
      setInviteError(data.error ?? "Failed to send invite");
    }
  }

  async function handleRemove(userId: string) {
    if (!confirm("Remove this member from your organisation?")) return;
    setDeletingId(userId);
    const res = await fetch(`/api/team/${userId}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) fetchTeam();
    else setError("Failed to remove member");
  }

  async function handleRoleChange(userId: string, role: string) {
    const res = await fetch(`/api/team/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) fetchTeam();
    else setError("Failed to update role");
  }

  const seatsFull = org ? members.length >= org.seats_limit : false;

  return (
    <div className="relative space-y-8 animate-fade-in pb-20">
      {/* Background Decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gt-green-500/5 rounded-full blur-[140px] -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-orange/5 rounded-full blur-[120px] translate-y-1/4 -translate-x-1/4" />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-bg-surface shadow-premium flex items-center justify-center">
            <UserPlus className="w-6 h-6 text-gt-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-text-primary">Collaborators</h1>
            <p className="text-sm font-bold text-text-muted opacity-60">
               Managing governance and access for {org?.name ?? "your organisation"}
            </p>
          </div>
        </div>

        {org && (
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
        )}
      </div>

      {error && (
        <div className="premium-card p-4 border-l-4 border-l-red-500 bg-red-500/5 flex items-center gap-3 animate-scale-in">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-xs font-black text-red-700 uppercase tracking-widest">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-8">
        {/* Invite Section */}
        <div className="col-span-1 space-y-6">
          <div className="premium-card p-8 border-none space-y-6">
            <div className="space-y-1">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-text-primary">Provision Access</h2>
              <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest opacity-40">Invite a new climate auditor</p>
            </div>

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
                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-text-muted opacity-50 ml-1">Email Address</p>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="w-full bg-bg-inset/50 border-2 border-transparent rounded-xl px-4 py-3.5 text-sm font-black text-text-primary focus:border-gt-green-500 focus:bg-white transition-all outline-none"
                  />
                </div>
                <button
                  disabled={inviting || !inviteEmail}
                  onClick={handleInvite}
                  className="w-full py-4 rounded-xl bg-gt-green-600 hover:bg-gt-green-700 disabled:opacity-30 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-gt-green-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  {inviting ? "Processing..." : inviteStatus === "success" ? "Invitation Dispatched" : "Dispatch Invite"}
                </button>
                
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

        {/* Members List */}
        <div className="col-span-2 premium-card border-none overflow-hidden shadow-2xl">
          <div className="px-8 py-6 border-b border-border-subtle/50 bg-bg-inset/10 flex items-center justify-between">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Active Directory</h2>
            <div className="px-3 py-1 rounded-full bg-bg-inset text-[9px] font-black text-text-muted uppercase tracking-widest">
              {members.length} Verified Accounts
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border-subtle/30">
                {loading ? (
                  <tr><td className="py-20 text-center animate-pulse text-[10px] font-black uppercase tracking-widest text-text-muted">Querying team registry...</td></tr>
                ) : (
                  members.map((member) => {
                    const initials = member.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
                    return (
                      <tr key={member.id} className="group hover:bg-bg-inset/20 transition-all duration-300">
                        <td className="px-8 py-5">
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
                        </td>
                        <td className="px-6 py-5 text-right">
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
                                Registered {new Date(member.created_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                              </p>
                            </div>
                            
                            {member.role !== "owner" && (
                              <button
                                disabled={deletingId === member.id}
                                onClick={() => handleRemove(member.id)}
                                className="w-9 h-9 rounded-xl flex items-center justify-center text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
