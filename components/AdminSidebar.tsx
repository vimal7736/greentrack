"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  BarChart3, Building2, Beaker, Users, Activity,
  LogOut, Shield, Leaf, CreditCard, UserCircle, LifeBuoy,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

const ADMIN_NAV = [
  { label: "Overview",      href: "/admin",              icon: BarChart3 },
  { label: "Organisations", href: "/admin/organisations", icon: Building2 },
  { label: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
  { label: "Factors",       href: "/admin/factors",       icon: Beaker },
  { label: "Users",         href: "/admin/users",         icon: Users },
  { label: "Activity",      href: "/admin/activity",      icon: Activity },
  { label: "Support",       href: "/admin/support",       icon: LifeBuoy },
  { label: "Profile",       href: "/admin/profile",       icon: UserCircle },
];

const BG  = "#1e293b";
const ND  = "rgba(0,0,0,0.50)";
const NL  = "rgba(255,255,255,0.07)";

const inset   = `inset 4px 4px 10px ${ND}, inset -4px -4px 10px ${NL}`;
const insetSm = `inset 2px 2px 6px ${ND}, inset -2px -2px 6px ${NL}`;
const raised  = `4px 4px 10px ${ND}, -4px -4px 10px ${NL}`;

const toggleBtnStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  boxShadow: inset,
  color: "rgba(255,255,255,0.65)",
  borderRadius: "10px",
};

interface AdminSidebarProps {
  userName:  string;
  userEmail: string;
  collapsed: boolean;
  onCollapseToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function AdminSidebar({
  userName, userEmail,
  collapsed, onCollapseToggle,
  mobileOpen, onMobileClose,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 1024); }
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const iconOnly = isMobile || collapsed;

  function handleSignOut() {
    window.location.href = "/api/auth/signout";
  }

  const initials = (userName || "Admin")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  function activeStyle(active: boolean): React.CSSProperties {
    if (iconOnly) {
      return {
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 40, height: 40, borderRadius: 12, margin: "0 auto",
        background: active ? "rgba(249,115,22,0.20)" : "transparent",
        boxShadow: active ? inset : "none",
        color: active ? "#fdba74" : "rgba(255,255,255,0.55)",
        transition: "background 150ms, color 150ms",
        flexShrink: 0,
      };
    }
    return active
      ? {
          display: "flex", alignItems: "center", gap: "0.75rem",
          paddingTop: "0.6rem", paddingBottom: "0.6rem",
          paddingLeft: "calc(0.75rem - 3px)",
          borderLeft: "3px solid #f97316",
          borderRadius: "0 12px 12px 0",
          background: "rgba(249,115,22,0.16)",
          boxShadow: insetSm,
          color: "#fff",
          fontSize: "0.875rem", fontWeight: 600,
          transition: "all 150ms",
        }
      : {
          display: "flex", alignItems: "center", gap: "0.75rem",
          paddingTop: "0.6rem", paddingBottom: "0.6rem",
          paddingLeft: "calc(0.75rem - 3px)",
          borderLeft: "3px solid transparent",
          borderRadius: "0 12px 12px 0",
          background: "transparent",
          color: "rgba(255,255,255,0.55)",
          fontSize: "0.875rem", fontWeight: 500,
          transition: "all 150ms",
        };
  }

  return (
    <aside
      className={`fixed left-0 top-0 h-screen flex flex-col z-40 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0`}
      style={{
        background: BG,
        width: iconOnly ? "4rem" : "16rem",
        transition: "width 0.28s cubic-bezier(.4,0,.2,1), transform 0.28s cubic-bezier(.4,0,.2,1)",
      }}
      aria-label="Admin sidebar"
    >
      {/* ── Logo / Brand ────────────────────────────────────────── */}
      <div
        className="px-3 py-4 flex items-center shrink-0"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          justifyContent: iconOnly ? "center" : "space-between",
          gap: "0.5rem",
        }}
      >
        <Link
          href="/admin"
          className="flex items-center gap-3 group min-w-0"
          onClick={onMobileClose}
          aria-label="Admin Command Center"
        >
          <div
            className="w-9 h-9 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
            style={{ borderRadius: 12, background: "rgba(249,115,22,0.12)", boxShadow: inset }}
          >
            <Shield className="w-5 h-5" style={{ color: "#f97316" }} />
          </div>

          {!iconOnly && (
            <div className="overflow-hidden">
              <p className="font-bold text-white text-sm leading-tight tracking-tight whitespace-nowrap">
                GreenTrack AI
              </p>
              <p className="text-[11px] leading-tight whitespace-nowrap" style={{ color: "#f97316" }}>
                Admin Portal
              </p>
            </div>
          )}
        </Link>

        {!iconOnly && <ThemeToggle buttonStyle={toggleBtnStyle} />}
      </div>

      {/* ── Admin label strip ────────────────────────────────────── */}
      {!iconOnly && (
        <div
          className="px-4 py-2.5 flex items-center justify-between gap-2 shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-white/90 text-xs font-semibold truncate">Command Center</p>
          <span
            className="shrink-0 inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            style={{
              background: "rgba(249,115,22,0.15)",
              color: "#fdba74",
              boxShadow: "inset 3px 3px 6px rgba(100,30,0,0.45), inset -3px -3px 6px rgba(255,160,60,0.18)",
              borderRadius: "6px",
            }}
          >
            Super Admin
          </span>
        </div>
      )}

      {/* ── Nav items ───────────────────────────────────────────── */}
      <nav
        className="flex-1 py-2 overflow-y-auto overflow-x-hidden"
        style={{ paddingLeft: iconOnly ? 0 : "0.5rem", paddingRight: iconOnly ? 0 : "0.5rem" }}
        aria-label="Admin navigation"
      >
        <div className="space-y-0.5">
          {ADMIN_NAV.map(({ label, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onMobileClose}
                title={iconOnly ? label : undefined}
                aria-current={active ? "page" : undefined}
                style={activeStyle(active)}
                onMouseEnter={(e) => {
                  if (!active) {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = "rgba(255,255,255,0.08)";
                    el.style.color = "#fff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = "transparent";
                    el.style.color = "rgba(255,255,255,0.55)";
                  }
                }}
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                {!iconOnly && label}
              </Link>
            );
          })}
        </div>

        <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }} />
      </nav>

      {/* ── Desktop collapse toggle ──────────────────────────────── */}
      <button
        type="button"
        onClick={onCollapseToggle}
        className="hidden lg:flex absolute top-[40%] -right-6 w-7 h-12 items-center justify-center group z-50 transition-all duration-300 hover:scale-110"
        style={{
          background: BG,
          borderRadius: "0 100px 100px 0",
          boxShadow: "6px 0 12px rgba(0,0,0,0.3), inset 1px 1px 0 rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderLeft: "none",
          cursor: "pointer",
        }}
        aria-label={iconOnly ? "Expand sidebar" : "Collapse sidebar"}
      >
        <Leaf
          className={`w-4 h-4 text-orange-400 transition-all duration-500 ease-in-out ${
            iconOnly ? "rotate-180 scale-x-[-1]" : "rotate-0"
          }`}
        />
      </button>

      {/* ── User profile footer ─────────────────────────────────── */}
      <div
        className="shrink-0 p-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.25)" }}
      >
        {iconOnly ? (
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: "linear-gradient(145deg, #ea580c, #f97316)", boxShadow: raised, color: "#fff" }}
              title={userName}
            >
              {initials}
            </div>
            <ThemeToggle buttonStyle={{ ...toggleBtnStyle, width: 32, height: 32, borderRadius: 8 }} />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: "linear-gradient(145deg, #ea580c, #f97316)", boxShadow: raised, color: "#fff" }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-semibold truncate leading-tight">{userName}</p>
                <p className="text-[11px] truncate leading-tight" style={{ color: "#f97316" }}>{userEmail}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              aria-label="Sign out"
              className="flex items-center gap-2 text-xs font-medium transition-colors duration-150"
              style={{ color: "rgba(255,255,255,0.35)", background: "none", border: "none", cursor: "pointer" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#fb923c")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.35)")}
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              Sign out
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
