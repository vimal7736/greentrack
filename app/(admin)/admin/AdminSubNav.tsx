"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield, BarChart3, Building2, Beaker, Users, Activity,
} from "lucide-react";

const ADMIN_TABS = [
  { label: "Overview",      href: "/admin",               icon: BarChart3 },
  { label: "Organisations", href: "/admin/organisations",  icon: Building2 },
  { label: "Factors",       href: "/admin/factors",        icon: Beaker },
  { label: "Users",         href: "/admin/users",          icon: Users },
  { label: "Activity",      href: "/admin/activity",       icon: Activity },
];

export function AdminSubNav() {
  const pathname = usePathname();

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Admin header — scales from compact mobile to full desktop */}
      <div className="flex items-center gap-2.5 lg:gap-3">
        <div
          className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl flex items-center justify-center shrink-0"
          style={{
            background: "var(--neu-base)",
            boxShadow: "var(--shadow-inset-sm)",
          }}
        >
          <Shield className="w-4 h-4 lg:w-5 lg:h-5" style={{ color: "var(--brand-orange)" }} />
        </div>
        <div>
          <h1 className="text-lg lg:text-2xl font-black tracking-tight leading-tight" style={{ color: "var(--text-primary)" }}>
            Command Center
          </h1>
          <p className="text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "var(--brand-orange)", opacity: 0.7 }}>
            Super Admin · GreenTrack AI
          </p>
        </div>
      </div>

      {/* Tab navigation — horizontally scrollable on mobile, no scrollbar shown */}
      <nav
        className="flex items-center gap-1 p-1 lg:p-1.5 rounded-xl lg:rounded-2xl overflow-x-auto"
        style={{
          background: "var(--neu-base)",
          boxShadow: "var(--shadow-inset)",
          border: "var(--card-border)",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        } as React.CSSProperties}
        aria-label="Admin navigation"
      >
        {ADMIN_TABS.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/admin" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-1.5 lg:gap-2 px-3 lg:px-5 py-2 lg:py-2.5 rounded-lg lg:rounded-xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap shrink-0"
              style={
                isActive
                  ? {
                      background: "var(--bg-surface)",
                      color: "var(--brand-orange)",
                      boxShadow: "var(--shadow-raised)",
                      border: "var(--card-border)",
                    }
                  : {
                      color: "var(--text-muted)",
                    }
              }
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="w-3 h-3 lg:w-3.5 lg:h-3.5 shrink-0" />
              <span className="hidden sm:inline">{label}</span>
              {/* Show icon-only label abbreviated on xs */}
              <span className="sm:hidden">{label.slice(0, 4)}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
