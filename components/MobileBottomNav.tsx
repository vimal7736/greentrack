"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Upload, History, FileText, Target,
} from "lucide-react";

const NAV = [
  { label: "Home",    href: "/dashboard", icon: LayoutDashboard },
  { label: "Upload",  href: "/upload",    icon: Upload },
  { label: "History", href: "/history",   icon: History },
  { label: "Reports", href: "/reports",   icon: FileText },
  { label: "Targets", href: "/targets",   icon: Target },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-50 flex items-stretch"
      style={{
        height: "4rem",
        background: "#1a4731",
        borderTop: "1px solid rgba(255,255,255,0.10)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
      aria-label="Mobile navigation"
    >
      {NAV.map(({ label, href, icon: Icon }) => {
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
            <span
              className="text-[10px] font-semibold leading-none"
              style={{ letterSpacing: "0.02em" }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
