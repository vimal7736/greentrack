"use client";
import { useState, useEffect } from "react";
import {
  UserCircle, Shield, Palette,
  Sun, Moon, Monitor,
  Lock, Trash2, Mail, Phone, Briefcase,
  Eye, EyeOff, CheckCircle, Save, Building2,
} from "lucide-react";
import { useTheme }      from "next-themes";
import { Input }         from "@/components/ui/Input";
import { Button }        from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast }      from "@/components/ui/Toast";
import { useFetch }      from "@/hooks/useFetch";

// ── Types ────────────────────────────────────────────────────────────────────

interface ProfileData {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  created_at: string;
  job_title: string | null;
  phone: string | null;
}

type TabId = "profile" | "account" | "appearance";

const TABS: { id: TabId; label: string; icon: typeof UserCircle }[] = [
  { id: "profile",    label: "Profile",    icon: UserCircle },
  { id: "account",    label: "Account",    icon: Shield     },
  { id: "appearance", label: "Appearance", icon: Palette    },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string | null, email: string) {
  if (name) return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  return email.slice(0, 2).toUpperCase();
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-text-muted mb-4">
      {children}
    </p>
  );
}

function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>;
}

function Divider() {
  return <hr className="border-none border-t" style={{ borderTopColor: "var(--border-subtle)" }} />;
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative shrink-0 w-11 h-6 rounded-full transition-all duration-300"
      style={{
        background: checked ? "var(--brand-orange)" : "var(--bg-inset)",
        boxShadow:  checked ? "0 0 12px rgba(249,115,22,0.35)" : "var(--shadow-inset-xs)",
      }}
    >
      <span
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-300"
        style={{
          left:      checked ? "calc(100% - 1.375rem)" : "0.125rem",
          boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
        }}
      />
    </button>
  );
}

// ── Card style ───────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background:   "var(--neu-base)",
  border:       "var(--card-border)",
  boxShadow:    "var(--shadow-raised)",
  borderRadius: "1rem",
};

// ── Component ────────────────────────────────────────────────────────────────

export default function AdminProfilePage() {
  const toast = useToast();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [activeTab,      setActiveTab]      = useState<TabId>("profile");
  const [showDelete,     setShowDelete]     = useState(false);
  const [showCurrentPw,  setShowCurrentPw]  = useState(false);
  const [showNewPw,      setShowNewPw]      = useState(false);

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: profile, loading: profileLoading, refetch: refetchProfile } =
    useFetch<ProfileData>("/api/profile");

  // ── Form state ─────────────────────────────────────────────────────────────
  const [pf, setPf] = useState({ full_name: "", job_title: "", phone: "" });
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });

  const [pfSaving, setPfSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  // ── Pre-populate ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (profile) {
      setPf({
        full_name: profile.full_name ?? "",
        job_title: profile.job_title ?? "",
        phone:     profile.phone     ?? "",
      });
    }
  }, [profile]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  async function saveProfile() {
    setPfSaving(true);
    try {
      const res  = await fetch("/api/profile", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(pf),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to save");
      toast.success("Profile updated");
      refetchProfile();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setPfSaving(false);
    }
  }

  async function savePassword() {
    if (pw.next !== pw.confirm) { toast.error("New passwords do not match"); return; }
    if (pw.next.length < 8)     { toast.error("New password must be at least 8 characters"); return; }
    setPwSaving(true);
    try {
      const res  = await fetch("/api/account/password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ current_password: pw.current, new_password: pw.next }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to update password");
      toast.success("Password changed successfully");
      setPw({ current: "", next: "", confirm: "" });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setPwSaving(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 lg:space-y-6 animate-scale-in">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 lg:gap-3">
        <div
          className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: "var(--neu-base)", boxShadow: "var(--shadow-inset-sm)" }}
        >
          <UserCircle className="w-4 h-4 lg:w-5 lg:h-5" style={{ color: "var(--brand-orange)" }} />
        </div>
        <div>
          <h1
            className="text-lg lg:text-2xl font-black tracking-tight leading-tight"
            style={{ color: "var(--text-primary)" }}
          >
            My Profile
          </h1>
          <p
            className="text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em]"
            style={{ color: "var(--brand-orange)", opacity: 0.7 }}
          >
            Super Admin · Personal details and account settings
          </p>
        </div>
      </div>

      {/* ── Admin identity card ───────────────────────────────────────────── */}
      <div style={card} className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black text-white shrink-0"
            style={{
              background: "linear-gradient(145deg, #ea580c, #f97316)",
              boxShadow:  "var(--shadow-raised)",
            }}
          >
            {profileLoading ? "—" : initials(profile?.full_name ?? null, profile?.email ?? "")}
          </div>

          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black text-text-primary tracking-tight">
                {profileLoading ? "Loading…" : (profile?.full_name ?? profile?.email ?? "—")}
              </h2>
              <span
                className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest"
                style={{ background: "rgba(249,115,22,0.12)", color: "#f97316" }}
              >
                Super Admin
              </span>
            </div>
            <p className="text-xs font-bold text-text-muted opacity-70 flex items-center gap-1.5">
              <Mail className="w-3 h-3 shrink-0" />
              {profile?.email ?? "—"}
            </p>
            {profile?.job_title && (
              <p className="text-xs font-bold text-text-muted opacity-60 flex items-center gap-1.5">
                <Briefcase className="w-3 h-3 shrink-0" />
                {profile.job_title}
              </p>
            )}
          </div>

          {profile?.created_at && (
            <div className="text-right shrink-0">
              <p className="text-[8px] font-black uppercase tracking-widest text-text-muted opacity-40">
                Admin since
              </p>
              <p className="text-xs font-black text-text-muted opacity-60">
                {new Date(profile.created_at).toLocaleDateString("en-GB", {
                  month: "short", year: "numeric",
                })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Tab Navigation ────────────────────────────────────────────────── */}
      <nav
        className="flex items-center gap-1 p-1 lg:p-1.5 rounded-xl lg:rounded-2xl overflow-x-auto no-scrollbar"
        style={{
          background: "var(--neu-base)",
          boxShadow:  "var(--shadow-inset)",
          border:     "var(--card-border)",
        }}
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className="flex items-center gap-1.5 lg:gap-2 px-3 lg:px-5 py-2 lg:py-2.5 rounded-lg lg:rounded-xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-all duration-200 whitespace-nowrap shrink-0"
              style={
                isActive
                  ? {
                      background: "var(--bg-surface)",
                      color:      "var(--brand-orange)",
                      boxShadow:  "var(--shadow-raised)",
                      border:     "var(--card-border)",
                    }
                  : { color: "var(--text-muted)" }
              }
            >
              <Icon className="w-3 h-3 lg:w-3.5 lg:h-3.5 shrink-0" />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* ── TAB: PROFILE ─────────────────────────────────────────────────── */}
      {activeTab === "profile" && (
        <div style={card} className="p-5 sm:p-8 space-y-8 animate-fade-in">
          <SectionLabel>Personal Information</SectionLabel>
          <FieldGroup>
            <Input
              label="Full Name"
              icon={<UserCircle className="w-4 h-4" />}
              placeholder="Admin Name"
              value={pf.full_name}
              onChange={(e) => setPf((f) => ({ ...f, full_name: e.target.value }))}
            />
            <Input
              label="Job Title"
              icon={<Briefcase className="w-4 h-4" />}
              placeholder="Platform Administrator"
              value={pf.job_title}
              onChange={(e) => setPf((f) => ({ ...f, job_title: e.target.value }))}
            />
            <Input
              label="Phone Number"
              icon={<Phone className="w-4 h-4" />}
              placeholder="+44 7700 900000"
              value={pf.phone}
              onChange={(e) => setPf((f) => ({ ...f, phone: e.target.value }))}
            />
          </FieldGroup>

          <Divider />
          <SectionLabel>Account Details</SectionLabel>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "Email Address", value: profile?.email ?? "—",  icon: <Mail      className="w-3.5 h-3.5" /> },
              { label: "Access Level",  value: "Super Admin",           icon: <Shield    className="w-3.5 h-3.5" /> },
            ].map(({ label, value, icon }) => (
              <div
                key={label}
                className="rounded-2xl p-4 space-y-1.5"
                style={{ background: "var(--bg-inset)", boxShadow: "var(--shadow-inset-xs)" }}
              >
                <p className="text-[8px] font-black uppercase tracking-widest text-text-muted opacity-50">
                  {label}
                </p>
                <div className="flex items-center gap-2">
                  <span style={{ color: "var(--brand-orange)" }}>{icon}</span>
                  <p className="text-sm font-black text-text-primary truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={pfSaving || profileLoading}
              onClick={saveProfile}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:brightness-110 active:scale-95 disabled:opacity-40"
              style={{
                background: "var(--brand-orange)",
                color:      "#fff",
                boxShadow:  "0 4px 14px rgba(249,115,22,0.35)",
              }}
            >
              <Save className="w-3.5 h-3.5" />
              {pfSaving ? "Saving…" : "Save Profile"}
            </button>
          </div>
        </div>
      )}

      {/* ── TAB: ACCOUNT ─────────────────────────────────────────────────── */}
      {activeTab === "account" && (
        <div className="space-y-4 animate-fade-in">
          {/* Change password */}
          <div style={card} className="p-5 sm:p-8 space-y-6">
            <SectionLabel>Change Password</SectionLabel>
            <FieldGroup>
              <div className="relative">
                <Input
                  label="Current Password"
                  icon={<Lock className="w-4 h-4" />}
                  type={showCurrentPw ? "text" : "password"}
                  placeholder="Your current password"
                  value={pw.current}
                  onChange={(e) => setPw((f) => ({ ...f, current: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw((v) => !v)}
                  className="absolute right-4 top-[2.6rem] transition-colors"
                  style={{ color: "var(--text-muted)" }}
                >
                  {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div />

              <div className="relative">
                <Input
                  label="New Password"
                  icon={<Lock className="w-4 h-4" />}
                  type={showNewPw ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={pw.next}
                  onChange={(e) => setPw((f) => ({ ...f, next: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw((v) => !v)}
                  className="absolute right-4 top-[2.6rem] transition-colors"
                  style={{ color: "var(--text-muted)" }}
                >
                  {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <Input
                label="Confirm New Password"
                icon={<Lock className="w-4 h-4" />}
                type="password"
                placeholder="Repeat new password"
                value={pw.confirm}
                onChange={(e) => setPw((f) => ({ ...f, confirm: e.target.value }))}
                error={pw.confirm && pw.next !== pw.confirm ? "Passwords do not match" : undefined}
              />
            </FieldGroup>

            <div className="flex justify-end">
              <button
                type="button"
                disabled={pwSaving || !pw.current || !pw.next || !pw.confirm}
                onClick={savePassword}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:brightness-110 active:scale-95 disabled:opacity-40"
                style={{
                  background: "var(--brand-orange)",
                  color:      "#fff",
                  boxShadow:  "0 4px 14px rgba(249,115,22,0.35)",
                }}
              >
                <Lock className="w-3.5 h-3.5" />
                {pwSaving ? "Updating…" : "Update Password"}
              </button>
            </div>
          </div>

          {/* Danger zone */}
          <div
            style={{ ...card, borderColor: "rgba(239,68,68,0.2)" }}
            className="p-5 sm:p-8 space-y-4"
          >
            <SectionLabel>Danger Zone</SectionLabel>
            <div
              className="rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              style={{
                background: "rgba(239,68,68,0.05)",
                border:     "1px solid rgba(239,68,68,0.15)",
              }}
            >
              <div className="space-y-1">
                <p className="text-sm font-black text-text-primary">Delete Admin Account</p>
                <p className="text-xs font-bold text-text-muted opacity-60 max-w-sm leading-relaxed">
                  Permanently removes this super admin account. All platform data
                  remains intact. This action is irreversible.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDelete(true)}
                className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-red-500 hover:text-white"
                style={{
                  background: "var(--neu-base)",
                  color:      "var(--text-muted)",
                  border:     "var(--card-border)",
                  boxShadow:  "var(--shadow-raised)",
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: APPEARANCE ───────────────────────────────────────────────── */}
      {activeTab === "appearance" && (
        <div style={card} className="p-5 sm:p-8 space-y-8 animate-fade-in">
          <SectionLabel>Theme Preference</SectionLabel>
          <p className="text-xs font-bold text-text-muted opacity-60 -mt-6">
            Choose how the admin portal looks. Changes apply instantly.
          </p>

          {mounted && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { id: "light",  label: "Light",  sub: "Clean & bright",    icon: Sun     },
                { id: "dark",   label: "Dark",   sub: "Easy on the eyes",  icon: Moon    },
                { id: "system", label: "System", sub: "Follows your OS",   icon: Monitor },
              ].map(({ id, label, sub, icon: Icon }) => {
                const active = theme === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTheme(id)}
                    className="group rounded-2xl p-6 text-left transition-all duration-200 active:scale-95 space-y-4"
                    style={{
                      background: active
                        ? "rgba(249,115,22,0.08)"
                        : "var(--bg-inset)",
                      boxShadow: active
                        ? "0 0 0 2px var(--brand-orange)"
                        : "var(--shadow-inset-xs)",
                      border: active
                        ? "1px solid rgba(249,115,22,0.3)"
                        : "1px solid var(--border-subtle)",
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        background: active ? "rgba(249,115,22,0.15)" : "var(--bg-elevated)",
                        color:      active ? "var(--brand-orange)"   : "var(--text-muted)",
                      }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p
                        className="text-sm font-black tracking-tight"
                        style={{ color: active ? "var(--brand-orange)" : "var(--text-primary)" }}
                      >
                        {label}
                      </p>
                      <p className="text-[10px] font-bold text-text-muted opacity-60 mt-0.5">{sub}</p>
                    </div>
                    {active && (
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" style={{ color: "var(--brand-orange)" }} />
                        <span
                          className="text-[9px] font-black uppercase tracking-widest"
                          style={{ color: "var(--brand-orange)" }}
                        >
                          Active
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Delete dialog ──────────────────────────────────────────────────── */}
      <ConfirmDialog
        open={showDelete}
        variant="danger"
        title="Delete Admin Account?"
        description="This will permanently remove your super admin account and sign you out. All platform data and organisations remain intact. This cannot be undone."
        confirmLabel="Yes, Delete Account"
        cancelLabel="Cancel"
        onConfirm={() => { window.location.href = "/api/account/delete"; }}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}
