"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3, Building2, Beaker, Users, Shield, X, CreditCard, UserCircle,
} from "lucide-react";

const NAV_LEFT = [
  { label: "Overview",  href: "/admin",              icon: BarChart3 },
  { label: "Orgs",      href: "/admin/organisations", icon: Building2 },
];

const NAV_RIGHT = [
  { label: "Users",   href: "/admin/users",         icon: Users },
  { label: "Profile", href: "/admin/profile",       icon: UserCircle },
];

interface AdminMobileBottomNavProps {
  onMenuToggle: () => void;
  isOpen: boolean;
}

export default function AdminMobileBottomNav({ onMenuToggle, isOpen }: AdminMobileBottomNavProps) {
  const pathname = usePathname();

  const renderLink = ({ label, href, icon: Icon }: { label: string; href: string; icon: React.ElementType }) => {
    const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
    return (
      <Link
        key={href}
        href={href}
        className="flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-colors duration-150 active:opacity-70"
        style={{ color: active ? "#f97316" : "rgba(255,255,255,0.40)" }}
        aria-current={active ? "page" : undefined}
      >
        {active && (
          <span
            className="absolute top-0 left-1/4 right-1/4 h-[2px] rounded-b-full"
            style={{ background: "#f97316" }}
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
        background: "#1e293b",
        borderTop: "1px solid rgba(255,255,255,0.10)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
      aria-label="Admin mobile navigation"
    >
      {/* Left items */}
      <div className="flex-1 flex items-stretch">
        {NAV_LEFT.map(renderLink)}
      </div>

      {/* Central Menu Trigger (Shield) */}
      <div className="relative flex-none w-16 flex items-center justify-center">
        <div className="absolute -top-6">
          <button
            onClick={onMenuToggle}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-premium transition-all duration-500 hover:scale-105 active:scale-95 ${
              isOpen ? "bg-red-500" : "bg-orange-500"
            }`}
            style={{ 
              border: "4px solid #1e293b",
              boxShadow: isOpen ? "0 0 20px rgba(239,68,68,0.4)" : "0 0 20px rgba(249,115,22,0.4)"
            }}
            aria-label={isOpen ? "Close menu" : "Open quick menu"}
          >
            {isOpen ? (
              <X className="w-7 h-7 text-white transition-all duration-300" />
            ) : (
              <Shield className="w-7 h-7 text-white transition-all duration-300" />
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
