"use client";
import React from "react";
import Link from "next/link";
import {
  Leaf, BarChart3, UploadCloud, FileText, ShieldCheck,
  Zap, ArrowRight, TrendingDown, CheckCircle, Building2,
  Target, Users, Globe, Lock, Scale, ChevronRight, Cpu,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}>

      {/* ─── NAVBAR ──────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between glass rounded-2xl px-6 py-3.5" style={{ backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg" style={{ background: "var(--brand-green)" }}>
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-black tracking-tight">
              GreenTrack <span style={{ color: "var(--brand-green)" }}>AI</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {["Features", "Compliance", "Pricing"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`}
                className="text-[10px] font-black uppercase tracking-widest transition-opacity hover:opacity-80"
                style={{
                  background: "linear-gradient(135deg, #16a34a 0%, #16a34a 40%, #1a9c5f 70%, #1f8e49 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-colors hover:text-gt-green-600"
              style={{ color: "var(--text-muted)" }}>
              Login
            </Link>
            <Link href="/signup" className=" px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
              style={{ color: "var(--brand-green-dark)" }}>
              Get Started <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

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
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] text-white mb-6 animate-fade-in"
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
              className="group flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all hover:scale-105 hover:brightness-110"
              style={{
                background: "linear-gradient(135deg, #22c55e, #15803d)",
                boxShadow: "0 0 40px rgba(34,197,94,0.25), 0 4px 20px rgba(0,0,0,0.3)",
              }}>
              Start Free Audit
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/login"
              className="flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105"
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
                <span className="ml-4 text-[9px] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.15)" }}>
                  GreenTrack AI — Carbon Dashboard · SECR Mode
                </span>
              </div>

              <div className="p-6 grid grid-cols-12 gap-4">
                {/* Stat cards */}
                {[
                  { label: "Total CO₂e", value: "12.4 t", tag: "−8.2% MoM", green: true },
                  { label: "Energy kWh", value: "48,200", tag: "+2.1% MoM", green: false },
                  { label: "Bills Audited", value: "84", tag: "SECR ✓", green: true },
                  { label: "Net Zero ETA", value: "2031", tag: "On Track", green: true },
                ].map((s, i) => (
                  <div key={i} className="col-span-3 rounded-2xl p-4"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-[8px] font-black uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.25)" }}>{s.label}</p>
                    <p className="text-lg font-black text-white mb-1.5">{s.value}</p>
                    <span className="text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider"
                      style={{
                        background: s.green ? "rgba(34,197,94,0.12)" : "rgba(249,115,22,0.12)",
                        color: s.green ? "#4ade80" : "#fb923c",
                      }}>
                      {s.tag}
                    </span>
                  </div>
                ))}

                {/* Chart */}
                <div className="col-span-8 rounded-2xl p-5"
                  style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <p className="text-[8px] font-black uppercase tracking-widest mb-5" style={{ color: "rgba(255,255,255,0.25)" }}>
                    Carbon Emissions — 12 Months
                  </p>
                  <div className="flex items-end gap-2 h-24">
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

                {/* Gauge ring */}
                <div className="col-span-4 rounded-2xl p-5 flex flex-col items-center justify-center"
                  style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.12)" }}>
                  <p className="text-[8px] font-black uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.25)" }}>
                    Compliance Score
                  </p>
                  <div className="relative w-24 h-24">
                    <svg viewBox="0 0 96 96" className="w-24 h-24" style={{ transform: "rotate(-90deg)" }}>
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
            <div key={label} className="neu-inset p-8 text-center flex flex-col items-center gap-3 rounded-2xl">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(34,197,94,0.1)" }}>
                <Icon className="w-5 h-5 text-gt-green-600" />
              </div>
              <p className="text-3xl font-black tracking-tighter" style={{ color: "var(--text-primary)" }}>{value}</p>
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-3" style={{ color: "var(--brand-green-dark)" }}>Process</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter">From Bill to Report<br />in 3 Steps</h2>
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
              <div key={step} className="premium-card p-8 relative overflow-hidden group">
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
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-3" style={{ color: "var(--brand-green-dark)" }}>Platform</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter">Everything You Need<br />for Carbon Compliance</h2>
          </div>

          {/* Bento grid */}
          <div className="grid grid-cols-6 gap-6 auto-rows-[220px]">

            {/* Large — AI Bill Extraction */}
            <div className="col-span-6 md:col-span-4 premium-card p-8 relative overflow-hidden group flex flex-col justify-between">
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
              <div className="flex items-center gap-3 mt-4 relative z-10">
                {["SSE", "British Gas", "EDF", "Octopus", "+40 more"].map(sup => (
                  <span key={sup} className="text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider"
                    style={{ background: "rgba(34,197,94,0.1)", color: "var(--brand-green-dark)" }}>
                    {sup}
                  </span>
                ))}
              </div>
            </div>

            {/* Live Dashboard */}
            <div className="col-span-6 md:col-span-2 premium-card p-8 relative overflow-hidden group"
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
            <div className="col-span-6 md:col-span-2 premium-card p-8 relative overflow-hidden group">
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
            <div className="col-span-6 md:col-span-2 premium-card p-8 relative overflow-hidden group"
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
            <div className="col-span-6 md:col-span-2 premium-card p-8 relative overflow-hidden group">
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
            <div className="col-span-6 md:col-span-4 premium-card p-8 relative overflow-hidden group flex items-center gap-10">
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
              <div className="relative z-10 flex-1 border-l pl-10" style={{ borderColor: "var(--border-subtle)" }}>
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
      <section id="compliance" className="py-24 px-6"
        style={{ background: "linear-gradient(160deg, #091a0e 0%, #050f07 100%)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-3 text-gt-green-400">Compliance</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white">Built for UK Law.<br />Verified by Design.</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-5">
              {[
                { icon: ShieldCheck, title: "DEFRA 2024 Conversion Factors", desc: "Always current with HM Government's official CO₂ math." },
                { icon: FileText, title: "SECR Intensity Ratios", desc: "Carbon per £ of revenue — the mandatory SECR metric for large UK businesses." },
                { icon: Globe, title: "UK GDPR (London Region)", desc: "All data stored in eu-west-2. Article 17 Right to Erasure built-in." },
                { icon: Target, title: "SBTi Aligned Targets", desc: "Set science-based reduction goals validated against climate science pathways." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-4 p-5 rounded-2xl transition-colors"
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

            <div className="grid grid-cols-2 gap-5">
              {[
                { value: "98%", label: "Audit Success Rate", green: true },
                { value: "0%", label: "Data Leakage Rate", green: false },
                { value: "2024", label: "DEFRA Factor Version", green: true },
                { value: "SOC2", label: "Security Standard", green: false },
              ].map(({ value, label, green }) => (
                <div key={label} className="aspect-square rounded-2xl flex flex-col items-center justify-center p-6 text-center"
                  style={{
                    background: green ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${green ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.06)"}`,
                  }}>
                  <p className="text-3xl font-black mb-2" style={{ color: green ? "#4ade80" : "rgba(255,255,255,0.8)" }}>{value}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── PRICING ─────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-3" style={{ color: "var(--brand-green-dark)" }}>Pricing</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter">Simple, Transparent Pricing</h2>
            <p className="text-sm font-medium mt-3" style={{ color: "var(--text-muted)" }}>All prices exclude 20% UK VAT</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
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
                className={`premium-card p-8 flex flex-col relative overflow-hidden ${highlight ? "ring-2 ring-gt-green-500" : ""}`}>
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

      {/* ─── CTA BANNER ──────────────────────────────────────────── */}
      <section className="py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-[2.5rem] p-16 text-center relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #0d2416 0%, #091a0e 100%)" }}>
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[120px] opacity-20 pointer-events-none"
              style={{ background: "var(--brand-green)" }} />
            <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-[100px] opacity-10 pointer-events-none"
              style={{ background: "var(--brand-orange)" }} />

            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 text-gt-green-400">Ready?</p>
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-6">
                Start Your Journey<br />to{" "}
                <span style={{ background: "linear-gradient(135deg, #22c55e, #86efac)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Net Zero
                </span>
              </h2>
              <p className="text-sm font-medium mb-10 max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.4)" }}>
                Join 500+ UK businesses already saving time and the environment with GreenTrack AI.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/signup"
                  className="group flex items-center gap-3 px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all hover:scale-105"
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
      <footer className="py-12 px-6 mt-8" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--brand-green)" }}>
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="font-black tracking-tight">GreenTrack AI</span>
          </div>

          <div className="flex gap-8">
            {[
              { href: "/terms", label: "Terms" },
              { href: "/privacy", label: "Privacy" },
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

          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            © 2025 GreenTrack AI Ltd · England & Wales
          </p>
        </div>
      </footer>

    </div>
  );
}
