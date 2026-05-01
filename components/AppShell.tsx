"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, Leaf } from "lucide-react";
import Sidebar from "./Sidebar";
import MobileBottomNav from "./MobileBottomNav";
import { ThemeToggle } from "./ThemeToggle";

const BG  = "#1a4731";
const ND  = "rgba(0,0,0,0.45)";
const NL  = "rgba(255,255,255,0.08)";
const inset = `inset 2px 2px 6px ${ND}, inset -2px -2px 6px ${NL}`;

const mobileBtnStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  boxShadow: inset,
  color: "rgba(255,255,255,0.80)",
  borderRadius: "10px",
  width: 36,
  height: 36,
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

interface AppShellProps {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
  userRole: string;
  orgName: string;
  orgTier: string;
}

export default function AppShell({
  children,
  userName, userEmail, userRole, orgName, orgTier,
}: AppShellProps) {
  const [collapsed, setCollapsed]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Keep --sidebar-w in sync with collapsed state and viewport width
  useEffect(() => {
    function sync() {
      const w = window.innerWidth >= 1024
        ? (collapsed ? "4rem" : "16rem")
        : "0px";
      document.documentElement.style.setProperty("--sidebar-w", w);
    }
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [collapsed]);

  // Auto-close mobile overlay when viewport grows to desktop
  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div style={{ background: "var(--bg-base)", minHeight: "100vh" }}>

      {/* ── Mobile top header (hidden on lg+) ─────────────────── */}
      <header
        className="lg:hidden fixed top-0 inset-x-0 z-50 flex items-center justify-between px-4 gap-3"
        style={{
          height: "3.5rem",
          background: BG,
          borderBottom: "1px solid rgba(255,255,255,0.10)",
        }}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          style={mobileBtnStyle}
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link
          href="/dashboard"
          className="flex items-center gap-2 flex-1 min-w-0"
          aria-label="GreenTrack AI home"
        >
          <div
            className="w-7 h-7 flex items-center justify-center shrink-0 rounded-xl"
            style={{ background: "rgba(255,255,255,0.08)", boxShadow: inset }}
          >
            <Leaf className="w-4 h-4" style={{ color: "#4ade80" }} />
          </div>
          <span className="font-bold text-white text-sm tracking-tight truncate">
            GreenTrack AI
          </span>
        </Link>

        <ThemeToggle buttonStyle={{ ...mobileBtnStyle }} />
      </header>

      {/* ── Mobile backdrop ────────────────────────────────────── */}
      <div
        className={`lg:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* ── Sidebar ────────────────────────────────────────────── */}
      <Sidebar
        userName={userName}
        userEmail={userEmail}
        userRole={userRole}
        orgName={orgName}
        orgTier={orgTier}
        collapsed={collapsed}
        onCollapseToggle={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* ── Main content ───────────────────────────────────────── */}
      <main
        id="main-content"
        tabIndex={-1}
        className="pt-[4.5rem] pb-20 px-4 lg:pt-8 lg:pb-8 lg:px-8"
        style={{
          marginLeft: "var(--sidebar-w, 16rem)",
          color: "var(--text-primary)",
          transition: "margin-left 0.28s cubic-bezier(.4,0,.2,1)",
          minHeight: "100vh",
        }}
      >
        {children}
      </main>

      {/* ── Mobile bottom nav (hidden on lg+) ─────────────────── */}
      <MobileBottomNav />
    </div>
  );
}
