"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Leaf, X, History, Scale, Users, CreditCard, 
  LogOut, Shield, LayoutDashboard, Target
} from "lucide-react";
import { usePathname } from "next/navigation";

interface MenuItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface GooeyMenuProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
  onNavigate?: () => void;
}

/**
 * GooeyMenu
 * A premium circular menu with a gooey animation effect.
 * Redesigned to be strictly Green and Neumorphic.
 */
export const GooeyMenu: React.FC<GooeyMenuProps> = ({ isOpen, onClose, userRole, onNavigate }) => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Menu items configuration - All Green
  const menuItems: MenuItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "History",   href: "/history",   icon: History },
    { label: "Compare",   href: "/compare",   icon: Scale },
    { label: "Team",      href: "/team",      icon: Users },
    { label: "Billing",   href: "/billing",   icon: CreditCard },
    { label: "Targets",   href: "/targets",   icon: Target },
    { label: "Logout",    href: "/api/auth/signout", icon: LogOut },
  ];

  if (userRole === "admin" || userRole === "superadmin" || userRole === "super_admin") {
    menuItems.push({ label: "Admin", href: "/admin", icon: Shield });
  }

  // Helper to calculate circular positions
  const getTransform = (index: number, total: number, isOpen: boolean) => {
    if (!isOpen) return "translate3d(0,0,0) scale(0.5)";
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    const radius = 135; 
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
      <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 flex items-center justify-center">
        
        {/* LAYER 1: Gooey Bubbles (Filtered) */}
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ filter: isOpen ? "url(#gooey-filter)" : "none" }}
        >
          {/* Main Center Bubble */}
          <div className="w-16 h-16 rounded-full bg-[#1a4731]" />
          
          {/* Item Bubbles - Strictly Green */}
          {menuItems.map((item, i) => (
            <div
              key={`bubble-${item.href}`}
              className="absolute w-14 h-14 rounded-full bg-gt-green-500 transition-all duration-500"
              style={{
                transform: getTransform(i, menuItems.length, isOpen),
                opacity: isOpen ? 1 : 0,
                transitionDelay: isOpen ? `${i * 35}ms` : "0ms",
              }}
            />
          ))}
        </div>

        {/* LAYER 2: Icons and Labels (Sharp/Unfiltered) */}
        <div className="absolute inset-0 flex items-center justify-center">
          {menuItems.map((item, i) => (
            <Link
              key={`link-${item.href}`}
              href={item.href}
              prefetch={item.label === "Logout" ? false : undefined}
              onClick={() => {
                onClose();
                if (pathname !== item.href && onNavigate) onNavigate();
              }}
              className="absolute w-14 h-14 rounded-full flex flex-col items-center justify-center text-white transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] hover:scale-110 active:scale-90"
              style={{
                transform: getTransform(i, menuItems.length, isOpen),
                opacity: isOpen ? 1 : 0,
                transitionDelay: isOpen ? `${i * 45}ms` : "0ms",
              }}
            >
              {/* Neumorphic Icon Container */}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300"
                style={{ 
                  background: "rgba(255,255,255,0.1)", 
                  boxShadow: "inset 2px 2px 4px rgba(255,255,255,0.1), inset -2px -2px 4px rgba(0,0,0,0.2)" 
                }}
              >
                <item.icon className="w-5 h-5 drop-shadow-md" />
              </div>
              
              {/* Label */}
              <span 
                className={`absolute -bottom-8 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-[0.2em] text-white transition-all duration-500 delay-200 ${isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
                style={{ textShadow: "0 2px 4px rgba(0,0,0,0.6)", whiteSpace: "nowrap" }}
              >
                {item.label}
              </span>
            </Link>
          ))}
        </div>

        {/* Central Control Button (Neumorphic Green) */}
        <button
          type="button"
          onClick={onClose}
          className="relative z-20 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl bg-[#1a4731] border-4 border-[#1a4731] hover:scale-105 active:scale-95"
          aria-label="Close menu"
        >
          <div className="w-full h-full rounded-full flex items-center justify-center bg-gt-green-500/10 backdrop-blur-sm border border-white/10 shadow-[inset_2px_2px_6px_rgba(255,255,255,0.15),_inset_-2px_-2px_6px_rgba(0,0,0,0.3)]">
            {isOpen ? (
              <X className="w-7 h-7 text-white transition-all duration-500" />
            ) : (
              <Leaf className="w-7 h-7 text-white transition-all duration-500" />
            )}
          </div>
        </button>
      </nav>

      {/* Floating Brand Label */}
      <div 
        className={`absolute left-1/2 top-[calc(50%+210px)] -translate-x-1/2 transition-all duration-500 ${isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <div className="flex flex-col items-center gap-2">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gt-green-400">
            GreenTrack AI
          </p>
          <div className="h-0.5 w-10 bg-gt-green-500/40 rounded-full" />
        </div>
      </div>
    </div>
  );
};
