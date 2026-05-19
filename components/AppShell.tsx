"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Leaf, FileText } from "lucide-react";
import Sidebar from "./Sidebar";
import MobileBottomNav from "./MobileBottomNav";
import { ThemeToggle } from "./ThemeToggle";
import { GooeyMenu } from "./ui/GooeyMenu";
import { ToastProvider } from "./ui/Toast";
import SupportDrawer from "./SupportDrawer";

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
  const pathname = usePathname();
  const [collapsed, setCollapsed]     = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

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
        <Link
          href="/reports"
          aria-label="Reports"
          className="flex items-center justify-center w-9 h-9 rounded-xl transition-colors"
          style={{ background: "rgba(255,255,255,0.08)", boxShadow: inset }}
        >
          <FileText className="w-4 h-4" style={{ color: "#4ade80" }} />
        </Link>

        <Link
          href="/dashboard"
          className="flex items-center gap-2 flex-1 justify-center min-w-0"
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

      {/* ── Mobile Circular Gooey Menu (only on mobile) ────────── */}
      <div className="lg:hidden">
        <GooeyMenu 
          isOpen={mobileOpen} 
          onClose={() => setMobileOpen(false)} 
          userRole={userRole}
          onNavigate={() => setIsNavigating(true)}
        />
      </div>

      {/* ── Sidebar (Visible only on desktop or when sidebar is active) ── */}
      <Sidebar
        userName={userName}
        userEmail={userEmail}
        userRole={userRole}
        orgName={orgName}
        orgTier={orgTier}
        collapsed={collapsed}
        onCollapseToggle={() => setCollapsed((c) => !c)}
        mobileOpen={false}
        onMobileClose={() => setMobileOpen(false)}
        onNavigate={() => setIsNavigating(true)}
        onSupportOpen={() => setSupportOpen(true)}
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
      <MobileBottomNav
        isOpen={mobileOpen}
        onMenuToggle={() => setMobileOpen(!mobileOpen)}
        onNavigate={() => setIsNavigating(true)}
        onSupportOpen={() => setSupportOpen(true)}
      />

      <SupportDrawer
        open={supportOpen}
        onClose={() => setSupportOpen(false)}
        userRole={userRole}
        userName={userName}
        userEmail={userEmail}
        orgName={orgName}
        orgTier={orgTier}
      />

      {/* ── Instant full screen loader overlay (Slate-Black, Emerald Green, and Solar Orange leaves) ── */}
      {isNavigating && (
        <div 
          className="fixed inset-y-0 right-0 z-[9999] flex flex-col items-center justify-center bg-[var(--bg-base)] transition-colors duration-500 animate-in fade-in duration-300"
          style={{
            left: "var(--sidebar-w, 16rem)",
            transition: "left 0.28s cubic-bezier(.4,0,.2,1)",
          }}
        >
          <div className="absolute w-[300px] h-[300px] rounded-full bg-brand-orange/5 blur-[120px] pointer-events-none" />
          
          <div className="relative w-48 h-48 flex items-center justify-center pointer-events-none">
            <Leaf 
              className="w-10 h-10 text-gt-green-500 fill-gt-green-500/10 filter drop-shadow-[0_0_10px_rgba(34,197,94,0.2)] absolute left-6 bottom-8"
              style={{
                animation: "instant-smooth-float-green 4s ease-in-out infinite",
              }}
            />

            <Leaf 
              className="w-10 h-10 text-gt-orange-500 fill-gt-orange-500/10 filter drop-shadow-[0_0_10px_rgba(249,115,22,0.2)] absolute top-6 left-16"
              style={{
                animation: "instant-smooth-float-orange 4.5s ease-in-out infinite",
              }}
            />

            <Leaf 
              className="w-10 h-10 text-text-primary fill-text-primary/10 filter drop-shadow-[0_0_10px_rgba(0,0,0,0.15)] absolute right-6 bottom-8"
              style={{
                animation: "instant-smooth-float-black 5s ease-in-out infinite",
              }}
            />
          </div>

          <div className="relative z-10 flex flex-col items-center gap-2.5 text-center mt-4">
            <h2 className="text-sm font-black text-text-primary tracking-[0.3em] uppercase animate-[instant-text-glow_2.5s_ease-in-out_infinite]">
              GreenTrack AI
            </h2>
            <div className="h-[2px] w-20 bg-border-subtle rounded-full overflow-hidden relative">
              <div 
                className="h-full w-full animate-[instant-progress-bar_2.5s_ease-in-out_infinite]"
                style={{
                  background: "linear-gradient(to right, var(--brand-green), var(--brand-orange))",
                }}
              />
            </div>
            <span className="text-[10px] text-text-muted font-bold tracking-widest uppercase opacity-80 mt-1">
              Syncing environmental metrics...
            </span>
          </div>

          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes instant-smooth-float-green {
              0%, 100% {
                transform: translateY(0px) rotate(-15deg);
              }
              50% {
                transform: translateY(-12px) rotate(-5deg);
              }
            }
            @keyframes instant-smooth-float-orange {
              0%, 100% {
                transform: translateY(0px) rotate(10deg);
              }
              50% {
                transform: translateY(-15px) rotate(20deg);
              }
            }
            @keyframes instant-smooth-float-black {
              0%, 100% {
                transform: translateY(0px) rotate(25deg);
              }
              50% {
                transform: translateY(-10px) rotate(15deg);
              }
            }
            @keyframes instant-text-glow {
              0%, 100% {
                opacity: 0.7;
              }
              50% {
                opacity: 1;
              }
            }
            @keyframes instant-progress-bar {
              0% { transform: translateX(-100%); }
              50% { transform: translateX(0); }
              100% { transform: translateX(100%); }
            }
          `}} />
        </div>
      )}
    </div>
    </ToastProvider>
  );
}
