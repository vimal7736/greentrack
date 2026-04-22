"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Upload, History, FileText,
  Users, CreditCard, LogOut, Leaf, Shield
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Upload Bill", href: "/upload", icon: Upload },
  { label: "History", href: "/history", icon: History },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Team", href: "/team", icon: Users },
  { label: "Billing", href: "/billing", icon: CreditCard },
];

const TIER_COLORS: Record<string, string> = {
  free: "bg-gray-100 text-gray-600",
  starter: "bg-blue-100 text-blue-700",
  business: "bg-green-100 text-green-700",
};

interface SidebarProps {
  userName: string;
  userEmail: string;
  userRole: string;
  orgName: string;
  orgTier: string;
}

export default function Sidebar({ userName, userEmail, userRole, orgName, orgTier }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = (userName || "User")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const safeTier = orgTier || "free";
  const tierLabel = safeTier.charAt(0).toUpperCase() + safeTier.slice(1);

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-64 bg-green-900 text-white flex flex-col z-40"
      aria-label="Application sidebar"
    >
      {/* Logo */}
      <div className="px-6 py-5 border-b border-green-800">
        <Link href="/dashboard" className="flex items-center gap-2" aria-label="GreenTrack AI home">
          <div className="w-8 h-8 bg-green-400 rounded-lg flex items-center justify-center" aria-hidden="true">
            <Leaf className="w-5 h-5 text-green-900" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">GreenTrack AI</p>
            <p className="text-green-400 text-xs">Carbon Management</p>
          </div>
        </Link>
      </div>

      {/* Org + Tier */}
      <div className="px-4 py-3 border-b border-green-800">
        <p className="text-white text-sm font-semibold truncate" aria-label={`Organisation: ${orgName}`}>{orgName}</p>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIER_COLORS[orgTier] ?? TIER_COLORS.free}`}
          aria-label={`Subscription plan: ${tierLabel}`}
        >
          {tierLabel} Plan
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Main navigation">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-green-700 text-white"
                  : "text-green-200 hover:bg-green-800 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
              {label}
            </Link>
          );
        })}

        {(userRole === "admin" || userRole === "superadmin") && (
          <div className="pt-2 border-t border-green-800 mt-2">
            <Link
              href="/admin"
              aria-current={pathname === "/admin" ? "page" : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/admin"
                  ? "bg-green-700 text-white"
                  : "text-green-200 hover:bg-green-800 hover:text-white"
              }`}
            >
              <Shield className="w-4 h-4 shrink-0" aria-hidden="true" />
              Admin Panel
            </Link>
          </div>
        )}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-green-800">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold text-white"
            aria-hidden="true"
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{userName}</p>
            <p className="text-green-400 text-xs truncate">{userEmail}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          aria-label="Sign out of GreenTrack AI"
          className="flex items-center gap-2 text-green-300 hover:text-white text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-400"
        >
          <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
