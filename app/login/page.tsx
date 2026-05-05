"use client";

import { useState } from "react";
import { Leaf, Eye, EyeOff, AlertCircle, BarChart3, FileText, Users, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router    = useRouter();
  const supabase  = createClient();

  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleLogin() {
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    const { data: { user: authUser } } = await supabase.auth.getUser();
    let destination = "/dashboard";
    if (authUser) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authUser.id)
        .single();
      if (profile?.role === "superadmin" || profile?.role === "super_admin") {
        destination = "/admin";
      }
    }

    router.push(destination);
  }

  return (
    <div className="h-screen flex overflow-hidden">

      {/* ── Left branding panel ─────────────────────────────── */}
      <div className="hidden lg:flex w-[380px] shrink-0 bg-gradient-to-br from-green-900 via-green-800 to-green-700 flex-col justify-between p-10">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-green-400 rounded-xl flex items-center justify-center">
              <Leaf className="w-5 h-5 text-green-900" />
            </div>
            <span className="text-white font-bold text-lg">GreenTrack AI</span>
          </div>
          <h2 className="text-white text-2xl font-black leading-snug mb-3">
            Carbon management<br />for UK businesses
          </h2>
          <p className="text-green-300 text-sm leading-relaxed mb-10">
            Track, report, and reduce your carbon footprint using real UK DEFRA emission factors.
          </p>
          <div className="space-y-4">
            {[
              { Icon: BarChart3,   text: "Automatic CO₂ calculation from bills" },
              { Icon: FileText,    text: "SECR-compliant PDF carbon reports" },
              { Icon: Users,       text: "Team management & role-based access" },
              { Icon: ShieldCheck, text: "UK GDPR compliant · Data in London" },
            ].map(({ Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-green-700 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-green-300" />
                </div>
                <p className="text-green-200 text-xs">{text}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-green-500 text-[10px]">© 2025 GreenTrack AI · Free to start</p>
      </div>

      {/* ── Right form panel ────────────────────────────────── */}
      <div className="flex-1 bg-white flex flex-col items-center justify-center px-8 lg:px-14">

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-lg">GreenTrack AI</span>
        </div>

        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-black text-gray-900 mb-1">Welcome back</h2>
          <p className="text-gray-400 text-sm mb-7">Sign in to your account</p>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2.5 rounded-lg mb-5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </div>
          )}

          <form action={handleLogin} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@company.co.uk"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-gray-500 cursor-pointer">
                <input type="checkbox" className="rounded accent-green-600" />
                Remember me
              </label>
              <a href="#" className="text-green-600 hover:underline font-medium">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-3 rounded-xl font-semibold text-sm transition-colors mt-1"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-green-600 font-semibold hover:underline">
              Sign up free
            </Link>
          </p>
        </div>

        <p className="absolute bottom-6 text-[10px] text-gray-300">
          UK GDPR compliant · Data stored in London
        </p>
      </div>
    </div>
  );
}
