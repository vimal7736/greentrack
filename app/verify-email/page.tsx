"use client";
import { Mail, ArrowRight, RefreshCw, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function VerifyEmailPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    // Poll for verification status
    const interval = setInterval(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email_confirmed_at) {
        router.refresh();
        router.push("/dashboard");
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [supabase, router]);

  async function handleResend() {
    setResending(true);
    setMessage(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });
      if (error) setMessage("Could not resend email. Please try again later.");
      else setMessage("A new verification link has been sent to your inbox.");
    }
    setResending(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 text-center border border-gray-100">
        <div className="w-24 h-24 bg-gt-green-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 animate-bounce">
          <Mail className="w-12 h-12 text-gt-green-600" />
        </div>

        <h1 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">Verify Your Email</h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-10">
          We&apos;ve sent a secure access link to your inbox. Please click the link to activate your climate auditor account and access the dashboard.
        </p>

        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-gt-green-50/50 border border-gt-green-100 text-left">
            <p className="text-[10px] font-black uppercase tracking-widest text-gt-green-700 mb-1">Status</p>
            <div className="flex items-center gap-2 text-gt-green-600 font-bold text-xs">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Waiting for verification...
            </div>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gt-green-600 hover:bg-gt-green-700 text-white py-4 rounded-2xl font-black text-sm transition-all shadow-lg shadow-gt-green-200 flex items-center justify-center gap-2 group"
          >
            I've Verified My Email
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleResend}
              disabled={resending}
              className="px-4 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-[11px] hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              {resending ? "Sending..." : "Resend Link"}
            </button>
            <button
              onClick={handleSignOut}
              className="px-4 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-[11px] hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>

        {message ? (
          <p className="mt-6 text-[10px] font-bold text-gt-green-600 uppercase tracking-widest animate-fade-in">
            {message}
          </p>
        ) : (
          <p className="mt-10 text-[10px] text-gray-400 uppercase font-black tracking-widest">
            GreenTrack AI · Action Required
          </p>
        )}
      </div>
    </div>
  );
}
