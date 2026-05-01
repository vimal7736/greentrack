"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Leaf, X, History, Scale, Users, CreditCard, 
  LogOut, Shield, LayoutDashboard, Upload, FileText, Target
} from "lucide-react";
import { usePathname } from "next/navigation";

interface MenuItem {
  label: string;
  href: string;
  icon: React.ElementType;
  colorClass: string;
}

interface GooeyMenuProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
}

/**
 * GooeyMenu
 * A premium circular menu with a gooey animation effect.
 * Designed for mobile navigation, replacing the traditional sidebar.
 */
export const GooeyMenu: React.FC<GooeyMenuProps> = ({ isOpen, onClose, userRole }) => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Menu items configuration with vibrant colors from the user's snippet
  const menuItems: MenuItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, colorClass: "bg-[#70cc72]" }, // Green
    { label: "History",   href: "/history",   icon: History,         colorClass: "bg-[#62c2e4]" }, // LightBlue
    { label: "Compare",   href: "/compare",   icon: Scale,           colorClass: "bg-[#b908ff]" }, // Blue/Purple
    { label: "Team",      href: "/team",      icon: Users,           colorClass: "bg-[#c49cde]" }, // Purple
    { label: "Billing",   href: "/billing",   icon: CreditCard,      colorClass: "bg-[#fc913a]" }, // Orange
    { label: "Targets",   href: "/targets",   icon: Target,          colorClass: "bg-[#fe4365]" }, // Red
    { label: "Logout",    href: "/api/auth/signout", icon: LogOut,   colorClass: "bg-slate-500" }, // Gray
  ];

  // Add Admin item if user has privileges
  if (userRole === "admin" || userRole === "superadmin" || userRole === "super_admin") {
    menuItems.push({ label: "Admin", href: "/admin", icon: Shield, colorClass: "bg-[#fe4365]" });
  }

  // Helper to calculate circular positions
  const getTransform = (index: number, total: number, isOpen: boolean) => {
    if (!isOpen) return "translate3d(0,0,0) scale(0.5)";
    
    // Spread items in a full circle
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    const radius = 130; // Increased radius for more breathing room
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    return `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(1)`;
  };

  return (
    <div 
      className={`fixed inset-0 z-[100] transition-all duration-500 ${isOpen ? "visible" : "invisible"}`}
      aria-hidden={!isOpen}
    >
      {/* Backdrop with premium blur */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-xl transition-opacity duration-500 ${isOpen ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />

      {/* SVG Filter for the Gooey Effect */}
      <svg className="hidden">
        <defs>
          <filter id="gooey-filter">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix 
              in="blur" 
              mode="matrix" 
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" 
              result="goo" 
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Central Menu Container */}
      <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative flex items-center justify-center">
          
          {/* LAYER 1: Gooey Bubbles (Filtered) */}
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ filter: isOpen ? "url(#gooey-filter)" : "none" }}
          >
            {/* Main Center Bubble */}
            <div className="w-16 h-16 rounded-full bg-[#1a4731]" />
            
            {/* Item Bubbles */}
            {menuItems.map((item, i) => (
              <div
                key={`bubble-${item.href}`}
                className={`absolute w-12 h-12 rounded-full transition-all duration-500 ${item.colorClass}`}
                style={{
                  transform: getTransform(i, menuItems.length, isOpen),
                  opacity: isOpen ? 1 : 0,
                  transitionDelay: isOpen ? `${i * 30}ms` : "0ms",
                }}
              />
            ))}
          </div>

          {/* LAYER 2: Icons and Labels (Sharp/Unfiltered) */}
          <div className="relative flex items-center justify-center">
            {menuItems.map((item, i) => (
              <Link
                key={`link-${item.href}`}
                href={item.href}
                prefetch={item.label === "Logout" ? false : undefined}
                onClick={onClose}
                className="absolute w-12 h-12 rounded-full flex flex-col items-center justify-center text-white transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] hover:scale-110 active:scale-90"
                style={{
                  transform: getTransform(i, menuItems.length, isOpen),
                  opacity: isOpen ? 1 : 0,
                  transitionDelay: isOpen ? `${i * 40}ms` : "0ms",
                }}
              >
                <item.icon className="w-5 h-5 drop-shadow-md" />
                <span className="sr-only">{item.label}</span>
                
                {/* Compact, Clean Label */}
                <span 
                  className={`absolute -bottom-7 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase tracking-[0.15em] text-white/90 transition-all duration-500 delay-200 ${isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
                >
                  {item.label}
                </span>
              </Link>
            ))}
          </div>

          {/* Central Control Button */}
          <button
            type="button"
            onClick={onClose}
            className="relative z-20 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl bg-[#1a4731] border-4 border-[#1a4731] hover:scale-105 active:scale-95"
            aria-label="Close menu"
          >
            <div className="w-full h-full rounded-full flex items-center justify-center bg-gt-green-500/10 backdrop-blur-sm border border-white/10">
              {isOpen ? (
                <X className="w-7 h-7 text-white transition-all duration-500" />
              ) : (
                <Leaf className="w-7 h-7 text-white transition-all duration-500" />
              )}
            </div>
          </button>
        </div>
      </nav>

      {/* Floating Brand Label - Moved further down for space */}
      <div 
        className={`absolute left-1/2 top-[calc(50%+190px)] -translate-x-1/2 transition-all duration-500 ${isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <div className="flex flex-col items-center gap-1.5">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/40">
            GreenTrack AI
          </p>
          <div className="h-0.5 w-8 bg-gt-green-500/40 rounded-full" />
        </div>
      </div>
    </div>
  );
};
