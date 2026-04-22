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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage who has access to {org?.name ?? "your organisation"}
          </p>
        </div>
        {org && (
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-700">
              {members.length} / {org.seats_limit} seats used
            </p>
            <div className="flex gap-1 mt-1">
              {Array.from({ length: Math.min(org.seats_limit, 10) }, (_, i) => (
                <div
                  key={i}
                  className={`w-6 h-2 rounded-full ${i < members.length ? "bg-green-500" : "bg-gray-200"}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Invite */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Invite Team Member</h2>
        {seatsFull ? (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-sm text-orange-700">
            All {org?.seats_limit} seats are used.{" "}
            <a href="/billing" className="underline font-medium">Upgrade your plan</a> to add more members.
          </div>
        ) : (
          <>
            <div className="flex gap-3">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                placeholder="colleague@company.co.uk"
                className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="button"
                disabled={inviting || !inviteEmail}
                onClick={handleInvite}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                {inviting ? "Sending…" : inviteStatus === "success" ? "Sent!" : "Send Invite"}
              </button>
            </div>
            {inviteStatus === "success" && (
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Invite email sent. They'll receive a link to join your organisation.
              </p>
            )}
            {inviteStatus === "error" && (
              <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {inviteError}
              </p>
            )}
          </>
        )}
      </div>

      {/* Members List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Current Members</h2>
        </div>
        {loading ? (
          <div className="px-6 py-8 text-center text-sm text-gray-400">Loading…</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {members.map((member) => {
              const initials = member.full_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
              return (
                <div key={member.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-sm font-bold text-green-700">
                      {initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">{member.full_name}</p>
                        {member.role === "owner" && <Crown className="w-3.5 h-3.5 text-yellow-500" />}
                      </div>
                      <p className="text-xs text-gray-400">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      {member.role === "owner" ? (
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ROLE_COLORS.owner}`}>
                          Owner
                        </span>
                      ) : (
                        <div className="relative inline-block">
                          <select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member.id, e.target.value)}
                            className={`text-xs px-2.5 py-1 rounded-full font-medium appearance-none pr-6 cursor-pointer border-0 focus:outline-none ${ROLE_COLORS[member.role] ?? ROLE_COLORS.member}`}
                          >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                          </select>
                          <ChevronDown className="w-3 h-3 absolute right-1.5 top-1.5 pointer-events-none opacity-60" />
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Joined {new Date(member.created_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                      </p>
                    </div>
                    {member.role !== "owner" && (
                      <button
                        type="button"
                        disabled={deletingId === member.id}
                        onClick={() => handleRemove(member.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-40"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Role permissions */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <User className="w-4 h-4" /> Role Permissions
        </h2>
        <div className="grid grid-cols-3 gap-3 text-xs">
          {[
            {
              role: "Owner",
              color: "text-yellow-700",
              perms: ["Upload bills", "View dashboard", "Manage team", "Billing & subscription", "Download reports", "Admin panel"],
            },
            {
              role: "Admin",
              color: "text-blue-700",
              perms: ["Upload bills", "View dashboard", "Manage team", "Download reports", "—", "—"],
            },
            {
              role: "Member",
              color: "text-gray-600",
              perms: ["Upload bills", "View dashboard", "—", "Download reports", "—", "—"],
            },
          ].map(({ role, color, perms }) => (
            <div key={role} className="bg-white rounded-lg p-4 border border-gray-100">
              <p className={`font-semibold mb-2 ${color}`}>{role}</p>
              <ul className="space-y-1">
                {perms.map((p, i) => (
                  <li key={i} className={p === "—" ? "text-gray-300" : "text-gray-600"}>
                    {p !== "—" ? "✓ " : ""}{p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
