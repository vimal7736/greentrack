"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Upload, History, FileText,
  Users, CreditCard, LogOut, Leaf, Shield,
  Scale, Target,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
  { label: "Dashboard",  href: "/dashboard", icon: LayoutDashboard },
  { label: "Upload Bill", href: "/upload",    icon: Upload },
  { label: "History",    href: "/history",   icon: History },
  { label: "Reports",    href: "/reports",   icon: FileText },
  { label: "Compare",    href: "/compare",   icon: Scale },
  { label: "Targets",    href: "/targets",   icon: Target },
  { label: "Team",       href: "/team",      icon: Users },
  { label: "Billing",    href: "/billing",   icon: CreditCard },
];

const TIER_CFG: Record<string, { label: string; style: React.CSSProperties }> = {
  free: {
    label: "Free",
    style: {
      background: "rgba(255,255,255,0.06)",
      color: "rgba(255,255,255,0.45)",
      boxShadow: "inset 2px 2px 5px rgba(0,0,0,0.35), inset -2px -2px 5px rgba(255,255,255,0.06)",
      borderRadius: "6px",
    },
  },
  starter: {
    label: "Starter",
    style: {
      background: "rgba(249,115,22,0.15)",
      color: "#fdba74",
      boxShadow: "inset 3px 3px 6px rgba(100,30,0,0.45), inset -3px -3px 6px rgba(255,160,60,0.18)",
      borderRadius: "6px",
    },
  },
  business: {
    label: "Business",
    style: {
      background: "rgba(34,197,94,0.12)",
      color: "#86efac",
      boxShadow: "inset 3px 3px 6px rgba(0,50,20,0.50), inset -3px -3px 6px rgba(80,200,110,0.16)",
      borderRadius: "6px",
    },
  },
};

const BG  = "#1a4731";
const ND  = "rgba(0,0,0,0.45)";
const NL  = "rgba(255,255,255,0.08)";

const inset   = `inset 4px 4px 10px ${ND}, inset -4px -4px 10px ${NL}`;
const insetSm = `inset 2px 2px 6px ${ND}, inset -2px -2px 6px ${NL}`;
const raised  = `4px 4px 10px ${ND}, -4px -4px 10px ${NL}`;

const toggleBtnStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  boxShadow: inset,
  color: "rgba(255,255,255,0.65)",
  borderRadius: "10px",
};

interface SidebarProps {
  userName:  string;
  userEmail: string;
  userRole:  string;
  orgName:   string;
  orgTier:   string;
}

export default function Sidebar({ userName, userEmail, userRole, orgName, orgTier }: SidebarProps) {
  const pathname  = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-w", collapsed ? "4rem" : "16rem");
  }, [collapsed]);

  function handleSignOut() {
    window.location.href = "/api/auth/signout";
  }

  const initials = (userName || "User")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const safeTier = orgTier || "free";
  const tierCfg  = TIER_CFG[safeTier] ?? TIER_CFG.free;

  function activeStyle(active: boolean): React.CSSProperties {
    if (collapsed) {
      return {
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 40, height: 40, borderRadius: 12, margin: "0 auto",
        background: active ? "rgba(34,197,94,0.20)" : "transparent",
        boxShadow: active ? inset : "none",
        color: active ? "#86efac" : "rgba(255,255,255,0.55)",
        transition: "background 150ms, color 150ms",
        flexShrink: 0,
      };
    }
    return active
      ? {
          display: "flex", alignItems: "center", gap: "0.75rem",
          paddingTop: "0.6rem", paddingBottom: "0.6rem",
          paddingLeft: "calc(0.75rem - 3px)",
          borderLeft: "3px solid #22c55e",
          borderRadius: "0 12px 12px 0",
          background: "rgba(34,197,94,0.16)",
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
      className="fixed left-0 top-0 h-screen flex flex-col z-40"
      style={{
        background: BG,
        width: collapsed ? "4rem" : "16rem",
        transition: "width 0.28s cubic-bezier(.4,0,.2,1)",
      }}
      aria-label="Application sidebar"
    >
      <div
        className="px-3 py-4 flex items-center shrink-0"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          justifyContent: collapsed ? "center" : "space-between",
          gap: "0.5rem",
        }}
      >
        <Link
          href="/dashboard"
          className="flex items-center gap-3 group min-w-0"
          aria-label="GreenTrack AI home"
        >
          <div
            className="w-9 h-9 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
            style={{
              borderRadius: 12,
              background: "rgba(255,255,255,0.06)",
              boxShadow: inset,
            }}
          >
            <Leaf className="w-5 h-5" style={{ color: "#4ade80" }} />
          </div>

          {!collapsed && (
            <div className="overflow-hidden">
              <p className="font-bold text-white text-sm leading-tight tracking-tight whitespace-nowrap">
                GreenTrack AI
              </p>
              <p className="text-[11px] leading-tight whitespace-nowrap" style={{ color: "#4ade80" }}>
                Carbon Management
              </p>
            </div>
          )}
        </Link>

        {!collapsed && <ThemeToggle buttonStyle={toggleBtnStyle} />}
      </div>

      {!collapsed && (
        <div
          className="px-4 py-2.5 flex items-center justify-between gap-2 shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-white/90 text-xs font-semibold truncate">{orgName}</p>
          <span
            className="shrink-0 inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            style={tierCfg.style}
          >
            {tierCfg.label}
          </span>
        </div>
      )}

      <nav
        className="flex-1 py-2 overflow-y-auto overflow-x-hidden"
        style={{ paddingLeft: collapsed ? 0 : "0.5rem", paddingRight: collapsed ? 0 : "0.5rem" }}
        aria-label="Main navigation"
      >
        <div className="space-y-0.5">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
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
                {!collapsed && label}
              </Link>
            );
          })}

          {(userRole === "admin" || userRole === "superadmin" || userRole === "super_admin") && (
            <div
              className="pt-2 mt-2"
              style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
            >
              <Link
                href="/admin"
                title={collapsed ? "Admin Panel" : undefined}
                aria-current={pathname.startsWith("/admin") ? "page" : undefined}
                style={
                  collapsed
                    ? {
                        display: "flex", alignItems: "center", justifyContent: "center",
                        width: 40, height: 40, borderRadius: 12, margin: "0 auto",
                        background: pathname.startsWith("/admin") ? "rgba(249,115,22,0.20)" : "transparent",
                        boxShadow: pathname.startsWith("/admin") ? inset : "none",
                        color: pathname.startsWith("/admin") ? "#fdba74" : "rgba(249,115,22,0.70)",
                        transition: "background 150ms",
                      }
                    : {
                        display: "flex", alignItems: "center", gap: "0.75rem",
                        paddingTop: "0.6rem", paddingBottom: "0.6rem",
                        paddingLeft: "calc(0.75rem - 3px)",
                        borderLeft: `3px solid ${pathname.startsWith("/admin") ? "#f97316" : "transparent"}`,
                        borderRadius: "0 12px 12px 0",
                        background: pathname.startsWith("/admin") ? "rgba(249,115,22,0.16)" : "transparent",
                        color: pathname.startsWith("/admin") ? "#fff" : "rgba(249,115,22,0.70)",
                        fontSize: "0.875rem", fontWeight: 500, transition: "all 150ms",
                      }
                }
              >
                <Shield className="w-4 h-4 shrink-0" aria-hidden="true" />
                {!collapsed && "Admin Panel"}
              </Link>
            </div>
          )}
        </div>

        <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }} />
      </nav>

      {/* Floating Toggle Button */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="absolute top-[40%] -right-6 w-7 h-12 flex items-center justify-center group z-50 transition-all duration-300 hover:scale-110"
        style={{
          background: BG,
          borderRadius: "0 100px 100px 0",
          boxShadow: "6px 0 12px rgba(0,0,0,0.3), inset 1px 1px 0 rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderLeft: "none",
          cursor: "pointer",
        }}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <Leaf 
          className={`w-4 h-4 text-gt-green-400 transition-all duration-500 ease-in-out ${
            collapsed ? "rotate-180 scale-x-[-1]" : "rotate-0"
          }`} 
        />
      </button>

      <div
        className="shrink-0 p-3"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(0,0,0,0.20)",
        }}
      >
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                background: "linear-gradient(145deg, #16a34a, #22c55e)",
                boxShadow: raised,
                color: "#fff",
              }}
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
                style={{
                  background: "linear-gradient(145deg, #16a34a, #22c55e)",
                  boxShadow: raised,
                  color: "#fff",
                }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-semibold truncate leading-tight">{userName}</p>
                <p className="text-[11px] truncate leading-tight" style={{ color: "#4ade80" }}>{userEmail}</p>
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
