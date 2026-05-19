"use client";
import { useState, useEffect } from "react";
import {
  User, Shield, Building2, Globe, Palette,
  Sun, Moon, Monitor, Lock, Trash2,
  Mail, Phone, Briefcase, MapPin, Hash,
  FileText, Eye, EyeOff, CheckCircle, Save,
  Globe2,
} from "lucide-react";
import { useTheme } from "next-themes";
import { PageLayout }   from "@/components/ui/PageLayout";
import { Input }        from "@/components/ui/Input";
import { Button }       from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast }     from "@/components/ui/Toast";
import { useFetch }     from "@/hooks/useFetch";

// ── Types ────────────────────────────────────────────────────────────────────

interface ProfileData {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  created_at: string;
  org_id: string | null;
  org_name: string | null;
  org_tier: string | null;
  job_title: string | null;
  phone: string | null;
}

interface OrgData {
  id: string;
  name: string;
  logo_url: string | null;
  org_email: string | null;
  phone: string | null;
  website: string | null;
  company_number: string | null;
  vat_number: string | null;
  industry: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  county: string | null;
  postcode: string | null;
  country: string;
  tier: string;
  seats_limit: number;
  discovery_domain: string | null;
  allow_discovery: boolean;
  user_role: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

type TabId = "profile" | "account" | "organisation" | "discovery" | "appearance";

const ROLE_CFG: Record<string, { label: string; color: string; bg: string }> = {
  owner:       { label: "Owner",       color: "#22c55e", bg: "rgba(34,197,94,0.12)"  },
  admin:       { label: "Admin",       color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  member:      { label: "Member",      color: "#71717a", bg: "rgba(113,113,122,0.12)"},
  super_admin: { label: "Super Admin", color: "#f97316", bg: "rgba(249,115,22,0.12)" },
};

const TIER_CFG: Record<string, { label: string; color: string }> = {
  free:     { label: "Free",     color: "var(--text-muted)" },
  starter:  { label: "Starter",  color: "#f97316" },
  business: { label: "Business", color: "var(--brand-green)" },
};

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

// ── Toggle Switch ────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative shrink-0 w-11 h-6 rounded-full transition-all duration-300 focus-visible:outline-none"
      style={{
        background: checked ? "var(--brand-green)" : "var(--bg-inset)",
        boxShadow:  checked ? "0 0 12px rgba(34,197,94,0.35)" : "var(--shadow-inset-xs)",
      }}
    >
      <span
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-300"
        style={{
          left: checked ? "calc(100% - 1.375rem)" : "0.125rem",
          boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
        }}
      />
    </button>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function ProfilePage() {
  const toast = useToast();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [activeTab, setActiveTab]           = useState<TabId>("profile");
  const [showDelete, setShowDelete]         = useState(false);
  const [showCurrentPw, setShowCurrentPw]   = useState(false);
  const [showNewPw, setShowNewPw]           = useState(false);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: profile, loading: profileLoading, refetch: refetchProfile } =
    useFetch<ProfileData>("/api/profile");
  const { data: org, loading: orgLoading, refetch: refetchOrg } =
    useFetch<OrgData>("/api/org/profile");

  // ── Form state ─────────────────────────────────────────────────────────────
  const [pf, setPf] = useState({ full_name: "", job_title: "", phone: "" });
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [of, setOf] = useState({
    name: "", logo_url: "", org_email: "", phone: "", website: "",
    company_number: "", vat_number: "", industry: "",
    address_line1: "", address_line2: "", city: "", county: "", postcode: "", country: "GB",
  });
  const [disc, setDisc] = useState({ allow_discovery: false, discovery_domain: "" });

  // ── Saving flags ───────────────────────────────────────────────────────────
  const [pfSaving,   setPfSaving]   = useState(false);
  const [pwSaving,   setPwSaving]   = useState(false);
  const [ofSaving,   setOfSaving]   = useState(false);
  const [discSaving, setDiscSaving] = useState(false);

  // ── Pre-populate once data arrives ────────────────────────────────────────
  useEffect(() => {
    if (profile) {
      setPf({
        full_name: profile.full_name ?? "",
        job_title: profile.job_title ?? "",
        phone:     profile.phone     ?? "",
      });
    }
  }, [profile]);

  useEffect(() => {
    if (org) {
      setOf({
        name:           org.name             ?? "",
        logo_url:       org.logo_url         ?? "",
        org_email:      org.org_email        ?? "",
        phone:          org.phone            ?? "",
        website:        org.website          ?? "",
        company_number: org.company_number   ?? "",
        vat_number:     org.vat_number       ?? "",
        industry:       org.industry         ?? "",
        address_line1:  org.address_line1    ?? "",
        address_line2:  org.address_line2    ?? "",
        city:           org.city             ?? "",
        county:         org.county           ?? "",
        postcode:       org.postcode         ?? "",
        country:        org.country          ?? "GB",
      });
      setDisc({
        allow_discovery:  org.allow_discovery  ?? false,
        discovery_domain: org.discovery_domain ?? "",
      });
    }
  }, [org]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const role         = profile?.role ?? "member";
  const canSeeOrgTabs = role === "owner" || role === "admin";
  const roleCfg      = ROLE_CFG[role] ?? ROLE_CFG.member;
  const tierCfg      = TIER_CFG[profile?.org_tier ?? "free"] ?? TIER_CFG.free;

  const TABS = ([
    { id: "profile"      as const, label: "Profile",      icon: User      },
    { id: "account"      as const, label: "Account",      icon: Shield    },
    { id: "organisation" as const, label: "Organisation", icon: Building2, restricted: true },
    { id: "discovery"    as const, label: "Discovery",    icon: Globe,     restricted: true },
    { id: "appearance"   as const, label: "Appearance",   icon: Palette   },
  ] as { id: TabId; label: string; icon: typeof User; restricted?: boolean }[])
    .filter((t) => !t.restricted || canSeeOrgTabs);

  // ── Handlers ───────────────────────────────────────────────────────────────
  async function saveProfile() {
    setPfSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pf),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to save");
      toast.success("Profile updated successfully");
      refetchProfile();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setPfSaving(false);
    }
  }

  async function savePassword() {
    if (pw.next !== pw.confirm) {
      toast.error("New passwords do not match");
      return;
    }
    if (pw.next.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: pw.current, new_password: pw.next }),
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

  async function saveOrg() {
    setOfSaving(true);
    try {
      const res = await fetch("/api/org/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(of),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to save");
      toast.success("Organisation updated successfully");
      refetchOrg();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setOfSaving(false);
    }
  }

  async function saveDiscovery() {
    setDiscSaving(true);
    try {
      const res = await fetch("/api/org/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(disc),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to save");
      toast.success("Discovery settings saved");
      refetchOrg();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDiscSaving(false);
    }
  }

  // ── Shared card style ──────────────────────────────────────────────────────
  const cardStyle: React.CSSProperties = {
    background: "var(--bg-surface)",
    border:     "var(--card-border)",
    boxShadow:  "var(--shadow-raised)",
    borderRadius: "1rem",
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <PageLayout
      icon={<User className="w-5 h-5" />}
      title="My Profile"
      subtitle="Manage your personal details, security settings, and organisation"
    >
      {/* ── USER IDENTITY CARD ─────────────────────────────────────────────── */}
      <div className="premium-card p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Avatar */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black text-white shrink-0"
            style={{
              background: "linear-gradient(145deg, var(--brand-green), var(--brand-green-dark))",
              boxShadow:  "var(--shadow-raised)",
            }}
          >
            {profileLoading ? "—" : initials(profile?.full_name ?? null, profile?.email ?? "")}
          </div>

          {/* Identity info */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black text-text-primary tracking-tight">
                {profileLoading ? "Loading…" : (profile?.full_name ?? profile?.email ?? "—")}
              </h2>
              <span
                className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest"
                style={{ background: roleCfg.bg, color: roleCfg.color }}
              >
                {roleCfg.label}
              </span>
            </div>
            <p className="text-xs font-bold text-text-muted opacity-70 flex items-center gap-1.5">
              <Mail className="w-3 h-3 shrink-0" />
              {profile?.email ?? "—"}
            </p>
            {profile?.org_name && (
              <p className="text-xs font-bold text-text-muted opacity-70 flex items-center gap-1.5">
                <Building2 className="w-3 h-3 shrink-0" />
                {profile.org_name}
                <span
                  className="ml-1 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest"
                  style={{ background: "var(--bg-inset)", color: tierCfg.color }}
                >
                  {tierCfg.label}
                </span>
              </p>
            )}
          </div>

          {/* Member since */}
          {profile?.created_at && (
            <div className="text-right shrink-0">
              <p className="text-[8px] font-black uppercase tracking-widest text-text-muted opacity-40">
                Member since
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

      {/* ── TAB BAR ────────────────────────────────────────────────────────── */}
      <div className="premium-card p-1.5 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 min-w-max sm:min-w-0">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 whitespace-nowrap"
                style={{
                  background: active ? "var(--brand-green)" : "transparent",
                  color:      active ? "#fff"                : "var(--text-muted)",
                  boxShadow:  active ? "0 4px 12px rgba(34,197,94,0.3)" : "none",
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
                }}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TAB CONTENT ────────────────────────────────────────────────────── */}

      {/* ── TAB: PROFILE ───────────────────────────────────────────────────── */}
      {activeTab === "profile" && (
        <div className="premium-card p-5 sm:p-8 space-y-8 animate-fade-in">
          <SectionLabel>Personal Information</SectionLabel>
          <FieldGroup>
            <Input
              label="Full Name"
              icon={<User className="w-4 h-4" />}
              placeholder="Jane Smith"
              value={pf.full_name}
              onChange={(e) => setPf((f) => ({ ...f, full_name: e.target.value }))}
            />
            <Input
              label="Job Title"
              icon={<Briefcase className="w-4 h-4" />}
              placeholder="Sustainability Manager"
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Email Address", value: profile?.email ?? "—", icon: <Mail className="w-3.5 h-3.5" /> },
              { label: "Role",          value: roleCfg.label,          icon: <Shield className="w-3.5 h-3.5" /> },
              { label: "Organisation",  value: profile?.org_name ?? "—", icon: <Building2 className="w-3.5 h-3.5" /> },
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
                  <span style={{ color: "var(--text-muted)" }}>{icon}</span>
                  <p className="text-sm font-black text-text-primary truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button
              variant="primary"
              size="md"
              icon={<Save className="w-3.5 h-3.5" />}
              disabled={pfSaving || profileLoading}
              onClick={saveProfile}
            >
              {pfSaving ? "Saving…" : "Save Profile"}
            </Button>
          </div>
        </div>
      )}

      {/* ── TAB: ACCOUNT ───────────────────────────────────────────────────── */}
      {activeTab === "account" && (
        <div className="space-y-4 animate-fade-in">
          {/* Change password */}
          <div className="premium-card p-5 sm:p-8 space-y-6">
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
              <Button
                variant="primary"
                size="md"
                icon={<Lock className="w-3.5 h-3.5" />}
                disabled={pwSaving || !pw.current || !pw.next || !pw.confirm}
                onClick={savePassword}
              >
                {pwSaving ? "Updating…" : "Update Password"}
              </Button>
            </div>
          </div>

          {/* Danger zone */}
          <div
            className="premium-card p-5 sm:p-8 space-y-4"
            style={{ borderColor: "rgba(239,68,68,0.2)" }}
          >
            <SectionLabel>Danger Zone</SectionLabel>
            <div
              className="rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}
            >
              <div className="space-y-1">
                <p className="text-sm font-black text-text-primary">Delete Account</p>
                <p className="text-xs font-bold text-text-muted opacity-60 max-w-sm leading-relaxed">
                  Permanently remove your account and all personal data. This
                  action is irreversible and complies with GDPR Article 17.
                </p>
              </div>
              <Button
                variant="danger"
                size="md"
                icon={<Trash2 className="w-3.5 h-3.5" />}
                className="shrink-0"
                onClick={() => setShowDelete(true)}
              >
                Delete Account
              </Button>
            </div>

            <p className="text-[9px] font-bold text-text-muted opacity-40 leading-relaxed">
              Data stored in London · GDPR compliant · Your emissions data is anonymised,
              not deleted, to preserve your organisation&apos;s audit trail.
            </p>
          </div>
        </div>
      )}

      {/* ── TAB: ORGANISATION ──────────────────────────────────────────────── */}
      {activeTab === "organisation" && canSeeOrgTabs && (
        <div className="premium-card p-5 sm:p-8 space-y-8 animate-fade-in">
          {/* Identity */}
          <SectionLabel>Organisation Identity</SectionLabel>
          <FieldGroup>
            <Input
              label="Organisation Name"
              icon={<Building2 className="w-4 h-4" />}
              placeholder="Acme Ltd"
              value={of.name}
              onChange={(e) => setOf((f) => ({ ...f, name: e.target.value }))}
            />
            <Input
              label="Industry"
              icon={<Briefcase className="w-4 h-4" />}
              placeholder="Manufacturing, Retail, etc."
              value={of.industry}
              onChange={(e) => setOf((f) => ({ ...f, industry: e.target.value }))}
            />
            <Input
              label="Website"
              icon={<Globe2 className="w-4 h-4" />}
              placeholder="https://acme.co.uk"
              value={of.website}
              onChange={(e) => setOf((f) => ({ ...f, website: e.target.value }))}
            />
            <Input
              label="Logo URL"
              icon={<FileText className="w-4 h-4" />}
              placeholder="https://cdn.acme.co.uk/logo.png"
              value={of.logo_url}
              onChange={(e) => setOf((f) => ({ ...f, logo_url: e.target.value }))}
            />
          </FieldGroup>

          <Divider />

          {/* Legal */}
          <SectionLabel>Legal &amp; Compliance</SectionLabel>
          <FieldGroup>
            <Input
              label="Company Registration Number"
              icon={<Hash className="w-4 h-4" />}
              placeholder="12345678"
              value={of.company_number}
              onChange={(e) => setOf((f) => ({ ...f, company_number: e.target.value }))}
            />
            <Input
              label="VAT Number"
              icon={<Hash className="w-4 h-4" />}
              placeholder="GB123456789"
              value={of.vat_number}
              onChange={(e) => setOf((f) => ({ ...f, vat_number: e.target.value }))}
            />
          </FieldGroup>

          <Divider />

          {/* Contact */}
          <SectionLabel>Contact Details</SectionLabel>
          <FieldGroup>
            <Input
              label="Organisation Email"
              icon={<Mail className="w-4 h-4" />}
              placeholder="hello@acme.co.uk"
              value={of.org_email}
              onChange={(e) => setOf((f) => ({ ...f, org_email: e.target.value }))}
            />
            <Input
              label="Phone Number"
              icon={<Phone className="w-4 h-4" />}
              placeholder="+44 20 7946 0958"
              value={of.phone}
              onChange={(e) => setOf((f) => ({ ...f, phone: e.target.value }))}
            />
          </FieldGroup>

          <Divider />

          {/* Address */}
          <SectionLabel>Registered Address</SectionLabel>
          <div className="space-y-4">
            <FieldGroup>
              <Input
                label="Address Line 1"
                icon={<MapPin className="w-4 h-4" />}
                placeholder="1 Business Park"
                value={of.address_line1}
                onChange={(e) => setOf((f) => ({ ...f, address_line1: e.target.value }))}
              />
              <Input
                label="Address Line 2"
                placeholder="Suite 100"
                value={of.address_line2}
                onChange={(e) => setOf((f) => ({ ...f, address_line2: e.target.value }))}
              />
              <Input
                label="City"
                placeholder="London"
                value={of.city}
                onChange={(e) => setOf((f) => ({ ...f, city: e.target.value }))}
              />
              <Input
                label="County"
                placeholder="Greater London"
                value={of.county}
                onChange={(e) => setOf((f) => ({ ...f, county: e.target.value }))}
              />
              <Input
                label="Postcode"
                placeholder="EC1A 1BB"
                value={of.postcode}
                onChange={(e) => setOf((f) => ({ ...f, postcode: e.target.value }))}
              />
              <Input
                label="Country"
                placeholder="GB"
                value={of.country}
                onChange={(e) => setOf((f) => ({ ...f, country: e.target.value.toUpperCase() }))}
              />
            </FieldGroup>
          </div>

          <Divider />

          {/* Plan info */}
          <div
            className="rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            style={{ background: "var(--bg-inset)", boxShadow: "var(--shadow-inset-xs)" }}
          >
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-text-muted opacity-50">
                Current Plan
              </p>
              <p className="text-sm font-black mt-0.5" style={{ color: tierCfg.color }}>
                {tierCfg.label}
                <span className="text-[9px] font-bold text-text-muted ml-2 opacity-50">
                  · {org?.seats_limit ?? "—"} seats
                </span>
              </p>
            </div>
            <a
              href="/billing"
              className="shrink-0 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:bg-black hover:text-white"
              style={{
                background: "var(--neu-base)",
                color:      "var(--text-muted)",
                border:     "var(--card-border)",
                boxShadow:  "var(--shadow-raised)",
              }}
            >
              Manage Plan →
            </a>
          </div>

          <div className="flex justify-end">
            <Button
              variant="primary"
              size="md"
              icon={<Save className="w-3.5 h-3.5" />}
              disabled={ofSaving || orgLoading}
              onClick={saveOrg}
            >
              {ofSaving ? "Saving…" : "Save Organisation"}
            </Button>
          </div>
        </div>
      )}

      {/* ── TAB: DISCOVERY ─────────────────────────────────────────────────── */}
      {activeTab === "discovery" && canSeeOrgTabs && (
        <div className="premium-card p-5 sm:p-8 space-y-8 animate-fade-in">
          <SectionLabel>Domain Discovery</SectionLabel>

          {/* What is discovery? */}
          <div
            className="rounded-2xl p-5 space-y-2"
            style={{
              background: "rgba(34,197,94,0.06)",
              border:     "1px solid rgba(34,197,94,0.15)",
            }}
          >
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 shrink-0" style={{ color: "var(--brand-green)" }} />
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--brand-green)" }}>
                What is Domain Discovery?
              </p>
            </div>
            <p className="text-xs font-bold text-text-muted leading-relaxed opacity-70">
              When enabled, new users who sign up with a matching company email domain will
              automatically discover your organisation and send a join request. You can then
              approve or reject them from the Team page.
            </p>
          </div>

          {/* Toggle */}
          <div
            className="rounded-2xl p-5 flex items-center justify-between gap-4"
            style={{ background: "var(--bg-inset)", boxShadow: "var(--shadow-inset-xs)" }}
          >
            <div>
              <p className="text-sm font-black text-text-primary">Enable Domain Discovery</p>
              <p className="text-xs font-bold text-text-muted opacity-60 mt-0.5">
                Allow employees to find and request access to your organisation
              </p>
            </div>
            <Toggle
              checked={disc.allow_discovery}
              onChange={(v) => setDisc((f) => ({ ...f, allow_discovery: v }))}
            />
          </div>

          {/* Domain input */}
          <div className="space-y-2">
            <Input
              label="Company Domain"
              icon={<Globe className="w-4 h-4" />}
              placeholder="acme.co.uk"
              value={disc.discovery_domain}
              disabled={!disc.allow_discovery}
              onChange={(e) => setDisc((f) => ({ ...f, discovery_domain: e.target.value.toLowerCase() }))}
            />
            <p className="text-[9px] font-bold text-text-muted opacity-50 pl-1">
              Must be your company domain. Public email domains (gmail.com, yahoo.com, etc.) are blocked.
            </p>
          </div>

          {/* Current domain status */}
          {org?.discovery_domain && (
            <div
              className="rounded-xl p-3.5 flex items-center gap-3"
              style={{ background: "var(--bg-inset)", boxShadow: "var(--shadow-inset-xs)" }}
            >
              <CheckCircle className="w-4 h-4 shrink-0" style={{ color: "var(--brand-green)" }} />
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-text-muted opacity-50">
                  Active Domain
                </p>
                <p className="text-sm font-black text-text-primary">{org.discovery_domain}</p>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              variant="primary"
              size="md"
              icon={<Save className="w-3.5 h-3.5" />}
              disabled={discSaving || orgLoading}
              onClick={saveDiscovery}
            >
              {discSaving ? "Saving…" : "Save Discovery Settings"}
            </Button>
          </div>
        </div>
      )}

      {/* ── TAB: APPEARANCE ────────────────────────────────────────────────── */}
      {activeTab === "appearance" && (
        <div className="premium-card p-5 sm:p-8 space-y-8 animate-fade-in">
          <SectionLabel>Theme Preference</SectionLabel>
          <p className="text-xs font-bold text-text-muted opacity-60 -mt-6">
            Choose how GreenTrack looks for you. Changes apply instantly.
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
                        ? "rgba(34,197,94,0.08)"
                        : "var(--bg-inset)",
                      boxShadow: active
                        ? "0 0 0 2px var(--brand-green)"
                        : "var(--shadow-inset-xs)",
                      border: active
                        ? "1px solid rgba(34,197,94,0.3)"
                        : "1px solid var(--border-subtle)",
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                      style={{
                        background: active ? "rgba(34,197,94,0.15)" : "var(--bg-elevated)",
                        color:      active ? "var(--brand-green)"   : "var(--text-muted)",
                      }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p
                        className="text-sm font-black tracking-tight"
                        style={{ color: active ? "var(--brand-green)" : "var(--text-primary)" }}
                      >
                        {label}
                      </p>
                      <p className="text-[10px] font-bold text-text-muted opacity-60 mt-0.5">
                        {sub}
                      </p>
                    </div>
                    {active && (
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" style={{ color: "var(--brand-green)" }} />
                        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: "var(--brand-green)" }}>
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

      {/* ── DELETE ACCOUNT DIALOG ──────────────────────────────────────────── */}
      <ConfirmDialog
        open={showDelete}
        variant="danger"
        title="Delete Your Account?"
        description="This will permanently remove all your personal data and sign you out. Your organisation's emissions data is anonymised, not deleted, to preserve the audit trail. This cannot be undone."
        confirmLabel="Yes, Delete My Account"
        cancelLabel="Cancel"
        onConfirm={() => { window.location.href = "/api/account/delete"; }}
        onCancel={() => setShowDelete(false)}
      />
    </PageLayout>
  );
}
