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
    <div className="space-y-4">
      {/* Admin header */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{
            background: "var(--neu-base)",
            boxShadow: "var(--shadow-inset-sm)",
          }}
        >
          <Shield className="w-5 h-5" style={{ color: "var(--brand-orange)" }} />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
            Command Center
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "var(--brand-orange)", opacity: 0.7 }}>
            Super Admin · GreenTrack AI
          </p>
        </div>
      </div>

      {/* Tab navigation */}
      <nav
        className="flex items-center gap-1 p-1.5 rounded-2xl overflow-x-auto"
        style={{
          background: "var(--neu-base)",
          boxShadow: "var(--shadow-inset)",
          border: "var(--card-border)",
        }}
        aria-label="Admin navigation"
      >
        {ADMIN_TABS.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={[
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap",
                isActive
                  ? "shadow-lg"
                  : "hover:bg-white/30",
              ].join(" ")}
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
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
