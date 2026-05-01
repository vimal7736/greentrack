"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Upload, FileText, Target, Leaf, X
} from "lucide-react";

const NAV_LEFT = [
  { label: "Home",    href: "/dashboard", icon: LayoutDashboard },
  { label: "Upload",  href: "/upload",    icon: Upload },
];

const NAV_RIGHT = [
  { label: "Reports", href: "/reports",   icon: FileText },
  { label: "Targets", href: "/targets",   icon: Target },
];

interface MobileBottomNavProps {
  onMenuToggle: () => void;
  isOpen: boolean;
}

export default function MobileBottomNav({ onMenuToggle, isOpen }: MobileBottomNavProps) {
  const pathname = usePathname();

  const renderLink = ({ label, href, icon: Icon }: any) => {
    const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
    return (
      <Link
        key={href}
        href={href}
        className="flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-colors duration-150 active:opacity-70"
        style={{ color: active ? "#4ade80" : "rgba(255,255,255,0.40)" }}
        aria-current={active ? "page" : undefined}
      >
        {active && (
          <span
            className="absolute top-0 left-1/4 right-1/4 h-[2px] rounded-b-full"
            style={{ background: "#4ade80" }}
          />
        )}
        <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.8} aria-hidden="true" />
        <span className="text-[10px] font-semibold leading-none" style={{ letterSpacing: "0.02em" }}>
          {label}
        </span>
      </Link>
    );
  };

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-[60] flex items-stretch"
      style={{
        height: "4.5rem",
        background: "#1a4731",
        borderTop: "1px solid rgba(255,255,255,0.10)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
      aria-label="Mobile navigation"
    >
      {/* Left items */}
      <div className="flex-1 flex items-stretch">
        {NAV_LEFT.map(renderLink)}
      </div>

      {/* Central Menu Trigger (Leaf) */}
      <div className="relative flex-none w-16 flex items-center justify-center">
        <div className="absolute -top-6">
          <button
            onClick={onMenuToggle}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-premium transition-all duration-500 hover:scale-105 active:scale-95 ${
              isOpen ? "bg-gt-orange-500" : "bg-gt-green-500"
            }`}
            style={{ 
              border: "4px solid #1a4731",
              boxShadow: isOpen ? "0 0 20px rgba(249,115,22,0.4)" : "0 0 20px rgba(34,197,94,0.4)"
            }}
            aria-label={isOpen ? "Close menu" : "Open quick menu"}
          >
            {isOpen ? (
              <X className="w-7 h-7 text-white transition-all duration-300" />
            ) : (
              <Leaf className="w-7 h-7 text-white transition-all duration-300" />
            )}
          </button>
        </div>
      </div>

      {/* Right items */}
      <div className="flex-1 flex items-stretch">
        {NAV_RIGHT.map(renderLink)}
      </div>
    </nav>
  );
}
