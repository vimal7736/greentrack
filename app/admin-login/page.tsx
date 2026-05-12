"use client";

import { useState } from "react";
import { ShieldCheck, Eye, EyeOff, AlertCircle, Lock, BarChart3, Users, Building2, Activity } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleLogin() {
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError("Invalid credentials. Please try again.");
      setLoading(false);
      return;
    }

    // Verify the user actually has superadmin role
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role === "super_admin" || profile?.role === "superadmin") {
        router.push("/admin");
      } else {
        // Not an admin — sign them out and show error
        await supabase.auth.signOut();
        setError("Access denied. This portal is for administrators only.");
        setLoading(false);
      }
    }
  }

  return (
    <div className="h-screen flex overflow-hidden">

      {/* ── Left branding panel ─────────────────────────────── */}
      <div className="hidden lg:flex w-[400px] shrink-0 flex-col justify-between p-10"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)" }}>

        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-black text-sm tracking-wide">GreenTrack AI</p>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Admin Portal</p>
            </div>
          </div>

          <h2 className="text-white text-2xl font-black leading-snug mb-3">
            Platform<br />Control Centre
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-10">
            Manage organisations, users, billing, and platform-wide emission factors from one place.
          </p>

          <div className="space-y-4">
            {[
              { Icon: Building2, text: "Manage all organisations & plans" },
              { Icon: Users,     text: "User management & role control" },
              { Icon: BarChart3, text: "Platform analytics & MRR tracking" },
              { Icon: Activity,  text: "Real-time activity & audit logs" },
            ].map(({ Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)" }}>
                  <Icon className="w-3.5 h-3.5 text-green-400" />
                </div>
                <p className="text-slate-400 text-xs">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom badge */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg w-fit"
          style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)" }}>
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <p className="text-green-400 text-[10px] font-bold uppercase tracking-widest">Restricted Access</p>
        </div>
      </div>

      {/* ── Right login panel ────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 lg:px-14"
        style={{ background: "#f8fafc" }}>

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)" }}>
            <ShieldCheck className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="font-black text-slate-900 text-sm">GreenTrack AI</p>
            <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">Admin Portal</p>
          </div>
        </div>

        <div className="w-full max-w-sm">

          {/* Lock icon */}
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
            style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)" }}>
            <Lock className="w-5 h-5 text-green-400" />
          </div>

          <h2 className="text-2xl font-black text-slate-900 mb-1">Admin Sign In</h2>
          <p className="text-slate-400 text-sm mb-7">Authorised personnel only</p>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2.5 rounded-lg mb-5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </div>
          )}

          <form action={handleLogin} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Admin Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="admin@greentrack.ai"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full disabled:opacity-60 text-white py-3 rounded-xl font-bold text-sm transition-all mt-2 flex items-center justify-center gap-2"
              style={{ background: loading ? "#374151" : "linear-gradient(135deg, #0f172a, #1e293b)" }}
            >
              <ShieldCheck className="w-4 h-4" />
              {loading ? "Verifying..." : "Sign In to Admin"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-400">
              Not an admin?{" "}
              <a href="/login" className="text-green-600 font-semibold hover:underline">
                Go to user login
              </a>
            </p>
          </div>
        </div>

        <p className="absolute bottom-6 text-[10px] text-slate-300">
          GreenTrack AI · Admin Portal · Restricted Access
        </p>
      </div>
    </div>
  );
}
