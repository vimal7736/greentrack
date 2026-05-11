"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Shield } from "lucide-react";
import AdminSidebar from "./AdminSidebar";
import AdminMobileBottomNav from "./AdminMobileBottomNav";
import { ThemeToggle } from "./ThemeToggle";
import { AdminGooeyMenu } from "./ui/AdminGooeyMenu";
import { ToastProvider } from "./ui/Toast";

const BG = "#1e293b";
const ND = "rgba(0,0,0,0.50)";
const NL = "rgba(255,255,255,0.07)";
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

interface AdminShellProps {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
}

export default function AdminShell({
  children,
  userName, userEmail,
}: AdminShellProps) {
  const [collapsed, setCollapsed] = useState(false);
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
    <ToastProvider>
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
        <div className="w-9" /> {/* Spacer for symmetry */}

        <Link
          href="/admin"
          className="flex items-center gap-2 flex-1 justify-center min-w-0"
          aria-label="Admin Command Center"
        >
          <div
            className="w-7 h-7 flex items-center justify-center shrink-0 rounded-xl"
            style={{ background: "rgba(249,115,22,0.12)", boxShadow: inset }}
          >
            <Shield className="w-4 h-4" style={{ color: "#f97316" }} />
          </div>
          <span className="font-bold text-white text-sm tracking-tight truncate">
            Admin Portal
          </span>
        </Link>

        <ThemeToggle buttonStyle={{ ...mobileBtnStyle }} />
      </header>

      {/* ── Mobile Circular Gooey Menu (only on mobile) ────────── */}
      <div className="lg:hidden">
        <AdminGooeyMenu
          isOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />
      </div>

      {/* ── Sidebar (Visible only on desktop or when sidebar is active) ── */}
      <AdminSidebar
        userName={userName}
        userEmail={userEmail}
        collapsed={collapsed}
        onCollapseToggle={() => setCollapsed((c) => !c)}
        mobileOpen={false} // Disable sidebar trigger for mobile, handled by GooeyMenu
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
      <AdminMobileBottomNav
        isOpen={mobileOpen}
        onMenuToggle={() => setMobileOpen(!mobileOpen)}
      />
    </div>
    </ToastProvider>
  );
}
