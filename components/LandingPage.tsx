"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Leaf, BarChart3, UploadCloud, FileText, ShieldCheck,
  Zap, ArrowRight, CheckCircle, Building2,
  Target, Users, Globe, Lock, Scale, ChevronRight, Cpu,
  Menu, X, Mail, MapPin, Clock, Send, AlertCircle,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function LandingPage() {
  const [navExpanded, setNavExpanded] = useState(true);
  const [scrollPct, setScrollPct] = useState(0);
  const [sweeping, setSweeping] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", company: "", subject: "", message: "" });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const lastScrollY = useRef(0);
  const isHoveredRef = useRef(false);
  const sweepTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 768); }
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Auto-close mobile menu on desktop resize
  useEffect(() => {
    function onResize() { if (window.innerWidth >= 768) setMobileMenuOpen(false); }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - lastScrollY.current;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setScrollPct(total > 0 ? Math.min(100, (y / total) * 100) : 0);

      if (y < 80) {
        setNavExpanded(true);
      } else if (dy < -8 && !isHoveredRef.current) {
        setNavExpanded(true);
      } else if (dy > 5 && !isHoveredRef.current) {
        setNavExpanded(false);
      }

      lastScrollY.current = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleEnter = () => {
    isHoveredRef.current = true;
    if (!navExpanded) {
      setNavExpanded(true);
      setSweeping(true);
      if (sweepTimer.current) clearTimeout(sweepTimer.current);
      sweepTimer.current = setTimeout(() => setSweeping(false), 900);
    }
  };

  const handleLeave = () => {
    isHoveredRef.current = false;
    if (window.scrollY > 80) setNavExpanded(false);
  };

  async function handleContactSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setContactLoading(true);
    setContactError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm),
      });
      if (!res.ok) throw new Error("failed");
      setContactSubmitted(true);
    } catch {
      setContactError("Could not send your message. Please email us at support@greentrack.ai");
    } finally {
      setContactLoading(false);
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}>

      <style>{`
        @keyframes matPulse {
          0%,100% { box-shadow:0 0 0 0 rgba(34,197,94,.45),0 12px 40px rgba(0,0,0,.55); }
          50%      { box-shadow:0 0 0 9px rgba(34,197,94,0),0 12px 40px rgba(0,0,0,.55); }
        }
        @keyframes rollHint {
          0%,100% { opacity:.28; transform:translateX(0) scale(1); }
          50%      { opacity:1;   transform:translateX(5px) scale(1.1); }
        }
        @keyframes shimmerSweep {
          0%   { left:-60%; opacity:0; }
          8%   { opacity:1; }
          92%  { opacity:1; }
          100% { left:130%; opacity:0; }
        }
        @keyframes leafBounce {
          0%,100% { transform:scale(1) rotate(0deg); }
          30%     { transform:scale(1.15) rotate(-10deg); }
          60%     { transform:scale(0.95) rotate(5deg); }
        }
        @keyframes ctaGlow {
          0%,100% { box-shadow:0 4px 16px rgba(34,197,94,.35),inset 0 1px 0 rgba(255,255,255,.2); }
          50%      { box-shadow:0 4px 28px rgba(34,197,94,.6),inset 0 1px 0 rgba(255,255,255,.2); }
        }
        @keyframes liveDot {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:.4; transform:scale(.7); }
        }
        @keyframes leafFall {
          0%   { transform:translateY(-70px) translateX(0px) rotate(-20deg) scale(1); opacity:0; }
          6%   { opacity:1; }
          35%  { transform:translateY(35%) translateX(14px) rotate(110deg) scale(0.9); }
          65%  { transform:translateY(68%) translateX(-10px) rotate(230deg) scale(0.82); }
          92%  { opacity:0.7; }
          100% { transform:translateY(115%) translateX(5px) rotate(340deg) scale(0.72); opacity:0; }
        }
        @keyframes sendingPulse {
          0%,100% { transform:scale(1) rotate(0deg); opacity:1; }
          50%      { transform:scale(1.14) rotate(8deg); opacity:0.75; }
        }
        @keyframes dotBounce {
          0%,80%,100% { transform:translateY(0); opacity:0.4; }
          40%          { transform:translateY(-6px); opacity:1; }
        }

        .nl { position:relative; }
        .nl::after {
          content:''; position:absolute; bottom:-3px; left:0;
          width:0; height:1.5px; border-radius:2px;
          background:linear-gradient(90deg,#22c55e,#86efac,#22c55e);
          transition:width .3s cubic-bezier(0.34,1.56,0.64,1);
        }
        .nl:hover::after { width:100%; }
        .nl:hover { opacity:.8 !important; }

        .nlogin:hover { color:#4ade80 !important; }

        .ncta {
          background:linear-gradient(135deg,#22c55e 0%,#16a34a 50%,#22c55e 100%) !important;
          background-size:200% auto !important;
          transition:background-position .5s ease, box-shadow .25s, transform .15s !important;
        }
        .ncta:hover {
          background-position:right center !important;
          box-shadow:0 6px 28px rgba(34,197,94,.55),inset 0 1px 0 rgba(255,255,255,.25) !important;
          transform:translateY(-1.5px) !important;
        }
        .ncta:active { transform:translateY(0) !important; }
      `}</style>

      {/* ─── MOBILE MENU BACKDROP ────────────────────────────────── */}
      <div
        className={`fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
          mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* ─── MOBILE MENU PANEL ───────────────────────────────────── */}
      <div
        className={`fixed inset-y-0 right-0 z-[70] w-72 flex flex-col transition-transform duration-300 ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          background: "linear-gradient(175deg,rgba(14,40,22,.98) 0%,rgba(7,20,11,.96) 100%)",
          borderLeft: "1px solid rgba(34,197,94,.2)",
        }}
      >
        {/* Close button */}
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-2">
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(145deg,#22c55e,#16a34a)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Leaf size={14} color="white" strokeWidth={2.2} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 900, color: "white", letterSpacing: "-0.3px" }}>GreenTrack AI</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
            style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.6)" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-6 py-6 flex flex-col gap-2" aria-label="Mobile navigation">
          {["Features", "Compliance", "Pricing", "Contact"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 16px", borderRadius: 12,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
                fontSize: 11, fontWeight: 900, textTransform: "uppercase" as const,
                letterSpacing: "0.15em", textDecoration: "none",
                color: "rgba(255,255,255,0.75)",
              }}
            >
              {item}
              <ChevronRight size={14} style={{ color: "rgba(34,197,94,0.6)" }} />
            </a>
          ))}
        </nav>

        {/* Mobile CTAs */}
        <div className="px-6 pb-8 flex flex-col gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "1.5rem" }}>
          <Link
            href="/login"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "12px 20px", borderRadius: 12,
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              fontSize: 10, fontWeight: 900, textTransform: "uppercase" as const,
              letterSpacing: "0.15em", color: "rgba(255,255,255,0.65)", textDecoration: "none",
            }}
          >
            Login
          </Link>
          <Link
            href="/signup"
            onClick={() => setMobileMenuOpen(false)}
            className="ncta"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "14px 20px", borderRadius: 12,
              fontSize: 10, fontWeight: 900, textTransform: "uppercase" as const,
              letterSpacing: "0.14em", color: "white", textDecoration: "none",
              boxShadow: "0 4px 18px rgba(34,197,94,.38)",
            }}
          >
            Get Started <ArrowRight size={12} strokeWidth={2.5} />
          </Link>
          <div className="flex justify-center mt-2">
            <ThemeToggle buttonStyle={{
              width: 36, height: 36, borderRadius: 10,
              background: "rgba(34,197,94,.08)", border: "1px solid rgba(34,197,94,.2)",
              color: "rgba(134,239,172,.85)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }} />
          </div>
        </div>
      </div>

      {/* ─── NAVBAR ──────────────────────────────────────────────── */}
      <div
        style={{ position: "fixed", top: 16, left: 16, right: 16, zIndex: 50 }}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto", position: "relative", height: 56 }}>

          {/* ── Rolling mat bar ── */}
          <nav
            aria-label="Main navigation"
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 22px",
              backdropFilter: "blur(40px)",
              WebkitBackdropFilter: "blur(40px)",
              background: "linear-gradient(175deg,rgba(14,40,22,.96) 0%,rgba(7,20,11,.92) 100%)",
              border: "1px solid rgba(34,197,94,.22)",
              boxShadow: "0 1px 0 rgba(134,239,172,.08) inset, 0 20px 60px rgba(0,0,0,.55)",
              clipPath: navExpanded
                ? "inset(0 0% 0 0 round 18px)"
                : "inset(0 calc(100% - 60px) 0 0 round 28px)",
              transition: navExpanded
                ? "clip-path 0.78s cubic-bezier(0.34,1.56,0.64,1)"
                : "clip-path 0.44s cubic-bezier(0.4,0,0.2,1)",
              animation: !navExpanded ? "matPulse 2.4s ease-in-out infinite" : "none",
              overflow: "hidden",
              willChange: "clip-path",
            }}
          >
            {/* Top glass-edge highlight */}
            <div aria-hidden="true" style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 1, pointerEvents: "none",
              background: "linear-gradient(90deg,transparent 0%,rgba(134,239,172,.6) 25%,rgba(255,255,255,.35) 50%,rgba(134,239,172,.6) 75%,transparent 100%)",
            }} />

            {/* Shimmer sweep when unrolling */}
            {sweeping && (
              <div aria-hidden="true" style={{
                position: "absolute", top: 0, bottom: 0, width: "45%", pointerEvents: "none",
                background: "linear-gradient(90deg,transparent,rgba(255,255,255,.055),rgba(134,239,172,.04),transparent)",
                animation: "shimmerSweep .85s ease-out forwards",
              }} />
            )}

            {/* Scroll progress bar */}
            <div aria-hidden="true" style={{
              position: "absolute", bottom: 0, left: 0, height: 2, pointerEvents: "none",
              width: `${scrollPct}%`,
              background: "linear-gradient(90deg,#22c55e,#86efac)",
              boxShadow: "0 0 8px rgba(34,197,94,.7)",
              borderRadius: "0 2px 0 0",
              transition: "width .12s linear",
            }} />

            {/* ── Logo ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 11, flexShrink: 0 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                background: "linear-gradient(145deg,#22c55e 0%,#16a34a 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 18px rgba(34,197,94,.55),inset 0 1px 0 rgba(255,255,255,.25)",
                animation: !navExpanded ? "leafBounce 2.8s ease-in-out infinite" : "none",
              }}>
                <Leaf size={20} color="white" strokeWidth={2.2} />
              </div>

              {/* Brand text + live dot */}
              <div style={{
                opacity: navExpanded ? 1 : 0,
                transform: navExpanded ? "translateX(0)" : "translateX(-10px)",
                transition: navExpanded ? "opacity .24s .42s, transform .28s .42s" : "opacity .08s, transform .08s",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{ fontSize: 17, fontWeight: 900, letterSpacing: "-0.5px", whiteSpace: "nowrap" }}>
                  GreenTrack <span style={{ color: "#22c55e" }}>AI</span>
                </span>
                <span style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "2px 7px", borderRadius: 20,
                  background: "rgba(34,197,94,.12)", border: "1px solid rgba(34,197,94,.25)",
                }}>
                  <span style={{
                    width: 5, height: 5, borderRadius: "50%", background: "#22c55e", flexShrink: 0,
                    animation: "liveDot 1.6s ease-in-out infinite",
                    boxShadow: "0 0 5px rgba(34,197,94,.8)",
                  }} />
                  <span style={{ fontSize: 8, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "#4ade80" }}>
                    Live
                  </span>
                </span>
              </div>
            </div>

            {/* ── Nav links (desktop only) ── */}
            <div style={{
              display: isMobile ? "none" : "flex",
              alignItems: "center", gap: 36, whiteSpace: "nowrap",
            }}>
              {["Features", "Compliance", "Pricing"].map((item, i) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="nl"
                  style={{
                    fontSize: 10, fontWeight: 900, textTransform: "uppercase",
                    letterSpacing: "0.17em", textDecoration: "none",
                    background: "linear-gradient(135deg,#4ade80 0%,#22c55e 45%,#16a34a 100%)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                    opacity: navExpanded ? 1 : 0,
                    transform: navExpanded ? "translateY(0)" : "translateY(5px)",
                    transition: navExpanded
                      ? `opacity .32s ${.38 + i * .07}s, transform .32s ${.38 + i * .07}s`
                      : "opacity .05s, transform .05s",
                    display: "block",
                  }}
                >
                  {item}
                </a>
              ))}
            </div>

            {/* ── Desktop CTAs ── */}
            <div style={{
              display: isMobile ? "none" : "flex",
              alignItems: "center", gap: 6, flexShrink: 0,
              opacity: navExpanded ? 1 : 0,
              transform: navExpanded ? "translateX(0)" : "translateX(10px)",
              transition: navExpanded ? "opacity .24s .52s, transform .28s .52s" : "opacity .05s, transform .05s",
              whiteSpace: "nowrap",
            }}>
              <ThemeToggle buttonStyle={{
                width: 36, height: 36, borderRadius: 10,
                background: "rgba(34,197,94,.08)",
                border: "1px solid rgba(34,197,94,.2)",
                color: "rgba(134,239,172,.85)",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background .2s, box-shadow .2s",
                flexShrink: 0,
              }} />
              <Link href="/login" className="nlogin" style={{
                fontSize: 10, fontWeight: 900, textTransform: "uppercase",
                letterSpacing: "0.15em", padding: "8px 16px", borderRadius: 10,
                color: "rgba(255,255,255,.42)", textDecoration: "none",
                transition: "color .2s",
              }}>
                Login
              </Link>
              <Link href="/signup" className="ncta" style={{
                fontSize: 10, fontWeight: 900, textTransform: "uppercase",
                letterSpacing: "0.14em", padding: "10px 20px", borderRadius: 12,
                display: "flex", alignItems: "center", gap: 6,
                color: "white", textDecoration: "none",
                backgroundSize: "200% auto",
                boxShadow: "0 4px 18px rgba(34,197,94,.38),inset 0 1px 0 rgba(255,255,255,.22)",
                animation: navExpanded ? "ctaGlow 3s ease-in-out infinite" : "none",
              }}>
                Get Started <ArrowRight size={12} strokeWidth={2.5} />
              </Link>
            </div>

            {/* ── Mobile hamburger ── */}
            {isMobile && (
              <button
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open navigation menu"
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "rgba(34,197,94,.08)", border: "1px solid rgba(34,197,94,.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "rgba(134,239,172,.85)", flexShrink: 0,
                  opacity: navExpanded ? 1 : 0,
                  transition: navExpanded ? "opacity .24s .52s" : "opacity .05s",
                }}
              >
                <Menu size={18} />
              </button>
            )}
          </nav>

          {/* ── Chevron hint beside rolled pill ── */}
          <div aria-hidden="true" style={{
            position: "absolute", top: "50%", left: 68,
            transform: "translateY(-50%)",
            display: "flex", alignItems: "center", gap: 0,
            pointerEvents: "none",
            opacity: navExpanded ? 0 : 1,
            transition: navExpanded ? "opacity .1s" : "opacity .35s .6s",
            animation: !navExpanded ? "rollHint 2s ease-in-out infinite" : "none",
          }}>
            <ChevronRight size={12} color="rgba(34,197,94,.85)" strokeWidth={2.5} />
            <ChevronRight size={12} color="rgba(34,197,94,.4)" strokeWidth={2.5} style={{ marginLeft: -5 }} />
          </div>

          {/* ── Curl-edge gradient at roll boundary ── */}
          <div aria-hidden="true" style={{
            position: "absolute", top: 5, bottom: 5,
            left: navExpanded ? -300 : 54,
            width: 14, borderRadius: "0 7px 7px 0",
            background: "linear-gradient(to right,rgba(34,197,94,.18),rgba(134,239,172,.06),transparent)",
            pointerEvents: "none",
            transition: navExpanded
              ? "left 0.78s cubic-bezier(0.34,1.56,0.64,1)"
              : "left 0.44s cubic-bezier(0.4,0,0.2,1)",
          }} />
        </div>
      </div>

      {/* ─── HERO ────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-28 pb-24 px-6 overflow-hidden"
        style={{ background: "linear-gradient(160deg, #091a0e 0%, #050f07 50%, #0c1f10 100%)" }}>

        {/* Dot-grid overlay */}
        <div className="absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: "radial-gradient(circle, rgba(34,197,94,1) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none"
          style={{ background: "rgba(34,197,94,0.15)" }} />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full blur-[100px] pointer-events-none"
          style={{ background: "rgba(249,115,22,0.08)" }} />

        <div className="max-w-7xl mx-auto w-full relative z-10 text-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full mb-8 animate-fade-in"
            style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-gt-green-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gt-green-400">
              UK's Leading Carbon Intelligence Platform
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] text-white mb-6 animate-fade-in"
            style={{ animationDelay: "0.1s" }}>
            Track. Report.
            <br />
            <span style={{
              background: "linear-gradient(135deg, #22c55e 0%, #86efac 50%, #4ade80 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              Net Zero.
            </span>
          </h1>

          <p className="max-w-xl mx-auto text-sm md:text-base font-medium leading-relaxed mb-10 animate-fade-in"
            style={{ color: "rgba(255,255,255,0.45)", animationDelay: "0.2s" }}>
            Automated CO₂ calculations from your utility bills. SECR-ready reports in one click.
            Built for UK businesses using official DEFRA 2024 conversion factors.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in"
            style={{ animationDelay: "0.3s" }}>
            <Link href="/signup"
              className="group flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all hover:scale-105 hover:brightness-110 w-full sm:w-auto justify-center"
              style={{
                background: "linear-gradient(135deg, #22c55e, #15803d)",
                boxShadow: "0 0 40px rgba(34,197,94,0.25), 0 4px 20px rgba(0,0,0,0.3)",
              }}>
              Start Free Audit
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/login"
              className="flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 w-full sm:w-auto justify-center"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.75)",
              }}>
              View Live Dashboard
            </Link>
          </div>

          {/* ── Mock Dashboard ── */}
          <div className="max-w-5xl mx-auto relative animate-scale-in" style={{ animationDelay: "0.4s" }}>
            <div className="rounded-[2rem] overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 50px 120px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)",
              }}>
              {/* Window chrome */}
              <div className="flex items-center gap-2 px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-3 h-3 rounded-full" style={{ background: "rgba(255,80,80,0.6)" }} />
                <div className="w-3 h-3 rounded-full" style={{ background: "rgba(255,200,50,0.6)" }} />
                <div className="w-3 h-3 rounded-full" style={{ background: "rgba(34,197,94,0.6)" }} />
                <span className="ml-4 text-[9px] font-black uppercase tracking-widest hidden sm:block" style={{ color: "rgba(255,255,255,0.15)" }}>
                  GreenTrack AI — Carbon Dashboard · SECR Mode
                </span>
              </div>

              <div className="p-4 sm:p-6 grid grid-cols-12 gap-3 sm:gap-4">
                {/* Stat cards — 2 per row on mobile, 4 per row on sm+ */}
                {[
                  { label: "Total CO₂e", value: "12.4 t", tag: "−8.2% MoM", green: true },
                  { label: "Energy kWh", value: "48,200", tag: "+2.1% MoM", green: false },
                  { label: "Bills Audited", value: "84", tag: "SECR ✓", green: true },
                  { label: "Net Zero ETA", value: "2031", tag: "On Track", green: true },
                ].map((s, i) => (
                  <div key={i} className="col-span-6 sm:col-span-3 rounded-2xl p-3 sm:p-4"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-[8px] font-black uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.25)" }}>{s.label}</p>
                    <p className="text-base sm:text-lg font-black text-white mb-1.5">{s.value}</p>
                    <span className="text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider"
                      style={{
                        background: s.green ? "rgba(34,197,94,0.12)" : "rgba(249,115,22,0.12)",
                        color: s.green ? "#4ade80" : "#fb923c",
                      }}>
                      {s.tag}
                    </span>
                  </div>
                ))}

                {/* Chart — full width on mobile, 8/12 on sm+ */}
                <div className="col-span-12 sm:col-span-8 rounded-2xl p-4 sm:p-5"
                  style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <p className="text-[8px] font-black uppercase tracking-widest mb-4 sm:mb-5" style={{ color: "rgba(255,255,255,0.25)" }}>
                    Carbon Emissions — 12 Months
                  </p>
                  <div className="flex items-end gap-1 sm:gap-2 h-20 sm:h-24">
                    {[45, 68, 52, 78, 60, 42, 72, 55, 48, 65, 38, 30].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t-md transition-all"
                        style={{
                          height: `${h}%`,
                          background: i === 11
                            ? "linear-gradient(to top, #22c55e, #86efac)"
                            : i >= 9
                              ? "rgba(34,197,94,0.35)"
                              : "rgba(34,197,94,0.15)",
                          boxShadow: i === 11 ? "0 0 16px rgba(34,197,94,0.4)" : "none",
                        }} />
                    ))}
                  </div>
                  <div className="flex justify-between mt-2">
                    {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(m => (
                      <span key={m} className="flex-1 text-center text-[7px] font-black uppercase" style={{ color: "rgba(255,255,255,0.15)" }}>{m}</span>
                    ))}
                  </div>
                </div>

                {/* Gauge ring — full width on mobile, 4/12 on sm+ */}
                <div className="col-span-12 sm:col-span-4 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center"
                  style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.12)" }}>
                  <p className="text-[8px] font-black uppercase tracking-widest mb-3 sm:mb-4" style={{ color: "rgba(255,255,255,0.25)" }}>
                    Compliance Score
                  </p>
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                    <svg viewBox="0 0 96 96" className="w-20 h-20 sm:w-24 sm:h-24" style={{ transform: "rotate(-90deg)" }}>
                      <circle cx="48" cy="48" r="38" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                      <circle cx="48" cy="48" r="38" fill="none" stroke="url(#greenGrad)" strokeWidth="10"
                        strokeDasharray="238" strokeDashoffset="14" strokeLinecap="round" />
                      <defs>
                        <linearGradient id="greenGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#22c55e" />
                          <stop offset="100%" stopColor="#86efac" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-black text-white">98%</span>
                      <span className="text-[7px] font-black uppercase tracking-wider" style={{ color: "#4ade80" }}>SECR</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating cards */}
            <div className="absolute -right-6 top-12 rounded-2xl px-4 py-3 hidden lg:flex items-center gap-3 animate-fade-in"
              style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", backdropFilter: "blur(20px)", animationDelay: "0.8s" }}>
              <Zap className="w-5 h-5 text-gt-green-400" />
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>AI Accuracy</p>
                <p className="text-sm font-black text-white">99.8%</p>
              </div>
            </div>

            <div className="absolute -left-6 bottom-12 rounded-2xl px-4 py-3 hidden lg:flex items-center gap-3 animate-fade-in"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(20px)", animationDelay: "1s" }}>
              <ShieldCheck className="w-5 h-5 text-gt-green-400" />
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>Audit Status</p>
                <p className="text-sm font-black text-white">SECR Verified</p>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* ─── STATS BAR ───────────────────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: "500+", label: "UK Businesses", icon: Building2 },
            { value: "1.2M kg", label: "CO₂e Tracked", icon: Leaf },
            { value: "100%", label: "SECR Compliant", icon: ShieldCheck },
            { value: "99.8%", label: "AI Accuracy", icon: Cpu },
          ].map(({ value, label, icon: Icon }) => (
            <div key={label} className="neu-inset p-6 sm:p-8 text-center flex flex-col items-center gap-3 rounded-2xl">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(34,197,94,0.1)" }}>
                <Icon className="w-5 h-5 text-gt-green-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-black tracking-tighter" style={{ color: "var(--text-primary)" }}>{value}</p>
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-3" style={{ color: "var(--brand-green-dark)" }}>Process</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter">From Bill to Report<br />in 3 Steps</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-16 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px"
              style={{ background: "linear-gradient(90deg, var(--brand-green), transparent, var(--brand-green))", opacity: 0.3 }} />

            {[
              {
                step: "01",
                icon: UploadCloud,
                title: "Upload Your Bill",
                desc: "Drag and drop any UK utility bill PDF — electricity, gas, water, or fuel. Our Mindee AI reads it instantly.",
                color: "green",
              },
              {
                step: "02",
                icon: Cpu,
                title: "AI Calculates CO₂",
                desc: "We apply official DEFRA 2024 conversion factors to compute exact kgCO₂e — zero manual entry required.",
                color: "orange",
              },
              {
                step: "03",
                icon: FileText,
                title: "Download SECR Report",
                desc: "One click generates a government-ready PDF audit report covering Scope 1, 2 & 3 emissions for your board.",
                color: "green",
              },
            ].map(({ step, icon: Icon, title, desc, color }) => (
              <div key={step} className="premium-card p-6 sm:p-8 relative overflow-hidden group">
                <div className="absolute top-6 right-6 text-6xl font-black opacity-5 select-none"
                  style={{ color: color === "green" ? "var(--brand-green)" : "var(--brand-orange)" }}>
                  {step}
                </div>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg transition-transform group-hover:scale-110"
                  style={{ background: color === "green" ? "var(--brand-green)" : "var(--brand-orange)" }}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <p className="text-[9px] font-black uppercase tracking-[0.25em] mb-2"
                  style={{ color: color === "green" ? "var(--brand-green-dark)" : "var(--brand-orange-dark)" }}>
                  Step {step}
                </p>
                <h3 className="text-lg font-black tracking-tight mb-3">{title}</h3>
                <p className="text-xs font-medium leading-relaxed" style={{ color: "var(--text-muted)" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES BENTO ──────────────────────────────────────── */}
      <section id="features" className="py-16 sm:py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-3" style={{ color: "var(--brand-green-dark)" }}>Platform</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter">Everything You Need<br />for Carbon Compliance</h2>
          </div>

          {/* Bento grid */}
          <div className="grid grid-cols-6 gap-4 sm:gap-6">

            {/* Large — AI Bill Extraction */}
            <div className="col-span-6 md:col-span-4 premium-card p-6 sm:p-8 relative overflow-hidden group flex flex-col justify-between min-h-[220px]">
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] opacity-10 transition-opacity group-hover:opacity-20"
                style={{ background: "var(--brand-green)" }} />
              <div className="flex items-start gap-5 relative z-10">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: "linear-gradient(135deg, var(--brand-green), var(--brand-green-dark))" }}>
                  <UploadCloud className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight mb-2">AI-Powered Bill Extraction</h3>
                  <p className="text-sm font-medium leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    Drop your PDF utility bills. Mindee OCR reads kWh, cost, billing period, and vendor with zero manual input. Works with every UK energy supplier.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-4 relative z-10">
                {["SSE", "British Gas", "EDF", "Octopus", "+40 more"].map(sup => (
                  <span key={sup} className="text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider"
                    style={{ background: "rgba(34,197,94,0.1)", color: "var(--brand-green-dark)" }}>
                    {sup}
                  </span>
                ))}
              </div>
            </div>

            {/* Live Dashboard */}
            <div className="col-span-6 sm:col-span-3 md:col-span-2 premium-card p-6 sm:p-8 relative overflow-hidden group min-h-[220px]"
              style={{ boxShadow: "var(--shadow-inset)" }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: "rgba(249,115,22,0.15)" }}>
                <BarChart3 className="w-6 h-6 text-gt-orange-500" />
              </div>
              <h3 className="text-base font-black tracking-tight mb-2">Live Carbon Dashboard</h3>
              <p className="text-xs font-medium leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Real-time charts tracking electricity, gas, and fuel trends with monthly comparison.
              </p>
            </div>

            {/* SECR Reports */}
            <div className="col-span-6 sm:col-span-3 md:col-span-2 premium-card p-6 sm:p-8 relative overflow-hidden group min-h-[220px]">
              <div className="absolute bottom-0 right-0 opacity-5">
                <FileText className="w-32 h-32" />
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: "rgba(34,197,94,0.15)" }}>
                <FileText className="w-6 h-6 text-gt-green-600" />
              </div>
              <h3 className="text-base font-black tracking-tight mb-2">SECR Audit Reports</h3>
              <p className="text-xs font-medium leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Government-ready PDFs covering Scope 1, 2 & 3 — suitable for board presentations and B-Corp applications.
              </p>
            </div>

            {/* Performance Compare */}
            <div className="col-span-6 sm:col-span-3 md:col-span-2 premium-card p-6 sm:p-8 relative overflow-hidden group min-h-[220px]"
              style={{ boxShadow: "var(--shadow-inset)" }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: "rgba(249,115,22,0.15)" }}>
                <Scale className="w-6 h-6 text-gt-orange-500" />
              </div>
              <h3 className="text-base font-black tracking-tight mb-2">Period Comparison</h3>
              <p className="text-xs font-medium leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Side-by-side audit of any two periods. Instantly spot seasonal spikes and inefficiencies.
              </p>
            </div>

            {/* Strategy & Targets */}
            <div className="col-span-6 sm:col-span-3 md:col-span-2 premium-card p-6 sm:p-8 relative overflow-hidden group min-h-[220px]">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: "rgba(34,197,94,0.15)" }}>
                <Target className="w-6 h-6 text-gt-green-600" />
              </div>
              <h3 className="text-base font-black tracking-tight mb-2">Net Zero Strategy</h3>
              <p className="text-xs font-medium leading-relaxed" style={{ color: "var(--text-muted)" }}>
                SBTi-aligned target setting with trajectory charts. Model "what-if" scenarios to plan your 2030 path.
              </p>
            </div>

            {/* Team + Secure */}
            <div className="col-span-6 md:col-span-4 premium-card p-6 sm:p-8 relative overflow-hidden group flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-10 min-h-[220px]">
              <div className="absolute inset-0 opacity-[0.02]">
                <Lock className="w-full h-full" />
              </div>
              <div className="relative z-10 flex-1">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: "rgba(34,197,94,0.15)" }}>
                  <Users className="w-6 h-6 text-gt-green-600" />
                </div>
                <h3 className="text-base font-black tracking-tight mb-2">Team Governance</h3>
                <p className="text-xs font-medium leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  Role-based access (Owner / Admin / Member). Invite climate auditors with encrypted links.
                </p>
              </div>
              <div className="relative z-10 flex-1 border-t pt-6 md:border-t-0 md:pt-0 md:border-l md:pl-10 w-full md:w-auto" style={{ borderColor: "var(--border-subtle)" }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: "rgba(249,115,22,0.15)" }}>
                  <Lock className="w-6 h-6 text-gt-orange-500" />
                </div>
                <h3 className="text-base font-black tracking-tight mb-2">UK GDPR Vault</h3>
                <p className="text-xs font-medium leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  All data encrypted in London (eu-west-2). RLS ensures Company A never sees Company B data.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── COMPLIANCE ──────────────────────────────────────────── */}
      <section id="compliance" className="py-16 sm:py-24 px-6"
        style={{ background: "linear-gradient(160deg, #091a0e 0%, #050f07 100%)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-3 text-gt-green-400">Compliance</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-white">Built for UK Law.<br />Verified by Design.</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4 sm:space-y-5">
              {[
                { icon: ShieldCheck, title: "DEFRA 2024 Conversion Factors", desc: "Always current with HM Government's official CO₂ math." },
                { icon: FileText, title: "SECR Intensity Ratios", desc: "Carbon per £ of revenue — the mandatory SECR metric for large UK businesses." },
                { icon: Globe, title: "UK GDPR (London Region)", desc: "All data stored in eu-west-2. Article 17 Right to Erasure built-in." },
                { icon: Target, title: "SBTi Aligned Targets", desc: "Set science-based reduction goals validated against climate science pathways." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-4 p-4 sm:p-5 rounded-2xl transition-colors"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "rgba(34,197,94,0.15)" }}>
                    <Icon className="w-5 h-5 text-gt-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white mb-1">{title}</p>
                    <p className="text-xs font-medium leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 sm:gap-5">
              {[
                { value: "98%", label: "Audit Success Rate", green: true },
                { value: "0%", label: "Data Leakage Rate", green: false },
                { value: "2024", label: "DEFRA Factor Version", green: true },
                { value: "SOC2", label: "Security Standard", green: false },
              ].map(({ value, label, green }) => (
                <div key={label} className="aspect-square rounded-2xl flex flex-col items-center justify-center p-4 sm:p-6 text-center"
                  style={{
                    background: green ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${green ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.06)"}`,
                  }}>
                  <p className="text-2xl sm:text-3xl font-black mb-2" style={{ color: green ? "#4ade80" : "rgba(255,255,255,0.8)" }}>{value}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── PRICING ─────────────────────────────────────────────── */}
      <section id="pricing" className="py-16 sm:py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-3" style={{ color: "var(--brand-green-dark)" }}>Pricing</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter">Simple, Transparent Pricing</h2>
            <p className="text-sm font-medium mt-3" style={{ color: "var(--text-muted)" }}>All prices exclude 20% UK VAT</p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                name: "Free",
                price: 0,
                desc: "Perfect for small businesses exploring carbon tracking.",
                features: ["3 bill uploads / month", "Basic dashboard", "CSV export", "1 team member"],
                cta: "Start Free",
                highlight: false,
              },
              {
                name: "Starter",
                price: 24,
                desc: "For growing businesses needing proper carbon reporting.",
                features: ["Unlimited bill uploads", "Full dashboard & charts", "SECR PDF reports", "5 team members", "Period comparison"],
                cta: "Get Starter",
                highlight: true,
              },
              {
                name: "Business",
                price: 99,
                desc: "For enterprises with complex multi-site reporting needs.",
                features: ["Everything in Starter", "Branded PDF reports", "SBTi target setting", "25 team members", "Priority support", "API access"],
                cta: "Get Business",
                highlight: false,
              },
            ].map(({ name, price, desc, features, cta, highlight }) => (
              <div key={name}
                className={`premium-card p-6 sm:p-8 flex flex-col relative overflow-hidden ${highlight ? "ring-2 ring-gt-green-500 sm:col-span-2 md:col-span-1" : ""}`}>
                {highlight && (
                  <div className="absolute top-0 right-0 p-4">
                    <span className="text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest text-white"
                      style={{ background: "var(--brand-green)" }}>
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-8">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-4" style={{ color: "var(--text-muted)" }}>{name}</p>
                  {price === 0 ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-black tracking-tighter">Free</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black" style={{ color: "var(--text-muted)" }}>£</span>
                      <span className="text-5xl font-black tracking-tighter">{price}</span>
                      <span className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>/mo</span>
                    </div>
                  )}
                  <p className="text-xs font-medium mt-3 leading-relaxed" style={{ color: "var(--text-muted)" }}>{desc}</p>
                </div>

                <div className="flex-1 space-y-3 mb-8">
                  {features.map((f) => (
                    <div key={f} className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-gt-green-500 shrink-0" />
                      <span className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>{f}</span>
                    </div>
                  ))}
                </div>

                <Link href="/signup"
                  className="w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-widest text-center transition-all hover:scale-[1.02]"
                  style={highlight
                    ? { background: "var(--brand-green)", color: "white", boxShadow: "0 0 24px rgba(34,197,94,0.25)" }
                    : { background: "var(--neu-base)", boxShadow: "var(--shadow-raised)", color: "var(--text-primary)" }}>
                  {cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CONTACT ─────────────────────────────────────────────── */}
      <section id="contact" className="py-16 sm:py-24 px-6"
        style={{ background: "linear-gradient(160deg, #091a0e 0%, #050f07 100%)" }}>
        <div className="max-w-7xl mx-auto">

          <div className="text-center mb-12 sm:mb-16">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-3 text-gt-green-400">Get in Touch</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-white">
              Talk to Our Team
            </h2>
            <p className="text-sm font-medium mt-4 max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.4)" }}>
              Questions about compliance, pricing, or your net-zero strategy? We reply within one business day.
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-6 sm:gap-8 items-stretch">

            {/* ── Contact Form ── */}
            <div className="md:col-span-3 rounded-3xl p-6 sm:p-8 relative overflow-hidden min-h-[600px] flex flex-col" style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}>

              {/* ── Crystal Leaf Loading Overlay ── */}
              {contactLoading && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-6 rounded-3xl overflow-hidden"
                  style={{
                    background: "rgba(3, 11, 5, 0.86)",
                    backdropFilter: "blur(14px)",
                    WebkitBackdropFilter: "blur(14px)",
                    border: "1px solid rgba(34,197,94,0.15)",
                  }}>

                  {/* Falling crystal leaves — crisp, no blur */}
                  {[
                    { x:  6, size: 14, dur: 3.6, delay: 0.0 },
                    { x: 17, size: 21, dur: 2.8, delay: 0.5 },
                    { x: 29, size: 11, dur: 4.3, delay: 1.0 },
                    { x: 43, size: 25, dur: 2.6, delay: 0.2 },
                    { x: 56, size: 16, dur: 3.9, delay: 0.8 },
                    { x: 67, size: 19, dur: 3.0, delay: 1.3 },
                    { x: 79, size: 13, dur: 4.1, delay: 0.4 },
                    { x: 90, size: 23, dur: 2.7, delay: 1.1 },
                    { x: 36, size: 18, dur: 3.3, delay: 1.6 },
                    { x: 72, size: 10, dur: 4.5, delay: 0.7 },
                  ].map((leaf, i) => (
                    <div key={i} aria-hidden="true" style={{
                      position: "absolute",
                      left: `${leaf.x}%`,
                      top: 0,
                      pointerEvents: "none",
                      animation: `leafFall ${leaf.dur}s ${leaf.delay}s ease-in infinite`,
                    }}>
                      <Leaf style={{
                        width:  leaf.size,
                        height: leaf.size,
                        /* crystal effect: light mint stroke, razor-thin crisp outline only */
                        color: i % 3 === 0
                          ? "rgba(220,255,235,0.80)"
                          : i % 3 === 1
                          ? "rgba(134,239,172,0.65)"
                          : "rgba(74,222,128,0.55)",
                        filter: "drop-shadow(0 0 1px rgba(200,255,220,0.9))",
                        display: "block",
                        strokeWidth: 1.5,
                      }} />
                    </div>
                  ))}

                  {/* Central focal content */}
                  <div className="relative z-10 flex flex-col items-center gap-5 text-center px-6">
                    {/* Crystal glass leaf badge */}
                    <div style={{
                      width: 72, height: 72, borderRadius: 22,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(134,239,172,0.35)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.2)",
                    }}>
                      <Leaf style={{
                        width: 34, height: 34,
                        color: "rgba(200,255,225,0.9)",
                        filter: "drop-shadow(0 0 1px rgba(180,255,210,1))",
                        animation: "sendingPulse 2s ease-in-out infinite",
                      }} />
                    </div>

                    <div>
                      <p style={{ fontSize: 15, fontWeight: 900, color: "rgba(255,255,255,0.92)", marginBottom: 5, letterSpacing: "-0.2px" }}>
                        Sending your message
                      </p>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(134,239,172,0.55)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
                        Just a moment
                      </p>
                    </div>

                    {/* Bouncing dots */}
                    <div style={{ display: "flex", gap: 7 }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{
                          width: 6, height: 6, borderRadius: "50%",
                          background: "rgba(134,239,172,0.7)",
                          border: "1px solid rgba(200,255,220,0.5)",
                          animation: `dotBounce 1.1s ${i * 0.18}s ease-in-out infinite`,
                        }} />
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {contactSubmitted ? (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-5">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)" }}>
                    <CheckCircle className="w-8 h-8 text-gt-green-400" />
                  </div>
                  <div>
                    <p className="text-xl font-black text-white mb-2">Message Sent</p>
                    <p className="text-sm font-medium leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
                      We&apos;ll get back to{" "}
                      <span className="text-gt-green-400 font-bold">{contactForm.email}</span>{" "}
                      within one business day.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setContactSubmitted(false);
                      setContactForm({ name: "", email: "", company: "", subject: "", message: "" });
                    }}
                    className="text-xs font-black uppercase tracking-widest px-6 py-3 rounded-xl transition-all hover:scale-105"
                    style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ade80" }}
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-5">
                  <div className="mb-2">
                    <p className="text-base font-black text-white">Send us a message</p>
                    <p className="text-xs font-medium mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                      Fields marked * are required
                    </p>
                  </div>

                  {contactError && (
                    <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold"
                      style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {contactError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.35)" }}>
                        Full Name *
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="James Mitchell"
                        value={contactForm.name}
                        onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl text-sm text-white transition-all focus:outline-none"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                        onFocus={e => { e.target.style.borderColor = "rgba(34,197,94,0.5)"; e.target.style.background = "rgba(255,255,255,0.08)"; }}
                        onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.background = "rgba(255,255,255,0.06)"; }}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.35)" }}>
                        Work Email *
                      </label>
                      <input
                        required
                        type="email"
                        placeholder="james@acme.co.uk"
                        value={contactForm.email}
                        onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl text-sm text-white transition-all focus:outline-none"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                        onFocus={e => { e.target.style.borderColor = "rgba(34,197,94,0.5)"; e.target.style.background = "rgba(255,255,255,0.08)"; }}
                        onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.background = "rgba(255,255,255,0.06)"; }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.35)" }}>
                        Company
                      </label>
                      <input
                        type="text"
                        placeholder="Acme Ltd"
                        value={contactForm.company}
                        onChange={e => setContactForm(p => ({ ...p, company: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl text-sm text-white transition-all focus:outline-none"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                        onFocus={e => { e.target.style.borderColor = "rgba(34,197,94,0.5)"; e.target.style.background = "rgba(255,255,255,0.08)"; }}
                        onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.background = "rgba(255,255,255,0.06)"; }}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.35)" }}>
                        Topic *
                      </label>
                      <select
                        required
                        value={contactForm.subject}
                        onChange={e => setContactForm(p => ({ ...p, subject: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none cursor-pointer"
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          color: contactForm.subject ? "white" : "rgba(255,255,255,0.3)",
                        }}
                        onFocus={e => { e.target.style.borderColor = "rgba(34,197,94,0.5)"; }}
                        onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
                      >
                        <option value="" disabled style={{ background: "#0d2416" }}>Select a topic…</option>
                        {["Pricing & Plans", "Compliance & SECR", "Technical Support", "Enterprise / Custom", "Partnership", "Other"].map(t => (
                          <option key={t} value={t} style={{ background: "#0d2416", color: "white" }}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.35)" }}>
                      Message *
                    </label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Tell us about your carbon reporting goals or anything we can help with…"
                      value={contactForm.message}
                      onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl text-sm text-white resize-none transition-all focus:outline-none"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                      onFocus={e => { e.target.style.borderColor = "rgba(34,197,94,0.5)"; e.target.style.background = "rgba(255,255,255,0.08)"; }}
                      onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.background = "rgba(255,255,255,0.06)"; }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={contactLoading}
                    className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-black text-xs uppercase tracking-widest text-white transition-all hover:scale-[1.02] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                    style={{
                      background: "linear-gradient(135deg, #22c55e 0%, #15803d 100%)",
                      boxShadow: "0 0 32px rgba(34,197,94,0.22), 0 4px 16px rgba(0,0,0,0.3)",
                    }}
                  >
                    {contactLoading ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Message
                      </>
                    )}
                  </button>

                  <p className="text-[10px] font-medium text-center" style={{ color: "rgba(255,255,255,0.2)" }}>
                    Protected by UK GDPR · We never share your data
                  </p>
                </form>
              )}
            </div>

            {/* ── Contact Info ── */}
            <div className="md:col-span-2 flex flex-col gap-4 h-full">

              <div className="rounded-2xl p-6" style={{
                background: "rgba(34,197,94,0.06)",
                border: "1px solid rgba(34,197,94,0.18)",
              }}>
                <p className="text-[9px] font-black uppercase tracking-[0.25em] mb-3 text-gt-green-400">Our Promise</p>
                <p className="text-sm font-black text-white mb-1.5">Always a Real Person</p>
                <p className="text-xs font-medium leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
                  No bots, no automated replies. Every enquiry is handled by our UK-based team who know SECR and net zero inside out.
                </p>
              </div>

              {([
                { icon: Mail,   label: "Email",        value: "support@greentrack.ai",   sub: "Replies within 24 hours",      green: true },
                { icon: MapPin, label: "Location",     value: "London, United Kingdom",  sub: "Data stored in eu-west-2",     green: false },
                { icon: Clock,  label: "Office Hours", value: "Mon – Fri · 9am – 6pm",  sub: "GMT / BST (UK time)",           green: false },
              ] as const).map(({ icon: Icon, label, value, sub, green }) => (
                <div key={label} className="flex items-start gap-4 rounded-2xl p-5 transition-all hover:scale-[1.01]" style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: green ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)" }}>
                    <Icon className="w-5 h-5" style={{ color: green ? "#4ade80" : "rgba(255,255,255,0.45)" }} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>{label}</p>
                    <p className="text-sm font-black text-white">{value}</p>
                    <p className="text-[10px] font-medium mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{sub}</p>
                  </div>
                </div>
              ))}

              <div className="flex-1 flex items-start gap-4 rounded-2xl p-5" style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}>
                <ShieldCheck className="w-8 h-8 text-gt-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-black text-white">UK GDPR Compliant</p>
                  <p className="text-[10px] font-medium mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                    Your information is never shared or sold
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA BANNER ──────────────────────────────────────────── */}
      <section className="py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-[2rem] sm:rounded-[2.5rem] p-8 sm:p-12 md:p-16 text-center relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #0d2416 0%, #091a0e 100%)" }}>
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[120px] opacity-20 pointer-events-none"
              style={{ background: "var(--brand-green)" }} />
            <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-[100px] opacity-10 pointer-events-none"
              style={{ background: "var(--brand-orange)" }} />

            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 text-gt-green-400">Ready?</p>
              <h2 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter text-white mb-6">
                Start Your Journey<br />to{" "}
                <span style={{ background: "linear-gradient(135deg, #22c55e, #86efac)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Net Zero
                </span>
              </h2>
              <p className="text-sm font-medium mb-8 sm:mb-10 max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.4)" }}>
                Join 500+ UK businesses already saving time and the environment with GreenTrack AI.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/signup"
                  className="group flex items-center gap-3 px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all hover:scale-105 w-full sm:w-auto justify-center"
                  style={{ background: "linear-gradient(135deg, var(--brand-green), var(--brand-green-dark))", boxShadow: "0 0 40px rgba(34,197,94,0.3)" }}>
                  Get Started — It's Free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.25)" }}>
                  No credit card required
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────── */}
      <footer className="py-10 sm:py-12 px-6 mt-8" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--brand-green)" }}>
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="font-black tracking-tight">GreenTrack AI</span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
            {[
              { href: "/terms", label: "Terms" },
              { href: "/privacy", label: "Privacy" },
              { href: "#contact", label: "Contact" },
              { href: "/login", label: "Login" },
              { href: "/signup", label: "Sign Up" },
            ].map(({ href, label }) => (
              <Link key={label} href={href}
                className="text-[10px] font-black uppercase tracking-widest transition-colors hover:text-gt-green-600"
                style={{ color: "var(--text-muted)" }}>
                {label}
              </Link>
            ))}
          </div>

          <p className="text-[10px] font-bold uppercase tracking-widest text-center" style={{ color: "var(--text-muted)" }}>
            © 2025 GreenTrack AI Ltd · England & Wales
          </p>
        </div>
      </footer>

    </div>
  );
}
