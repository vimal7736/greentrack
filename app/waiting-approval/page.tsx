"use client";
import { useEffect, useState } from "react";
import { Clock, LogOut, RefreshCcw, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function WaitingApprovalPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<any>(null);

  useEffect(() => {
    async function checkStatus() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Check if they now have an org_id
      const { data: profile } = await supabase
        .from("profiles")
        .select("org_id")
        .eq("id", user.id)
        .single();

      if (profile?.org_id) {
        router.push("/dashboard");
        return;
      }

      // Check for pending request
      const { data: requests } = await supabase
        .from("access_requests")
        .select("*, organisations(name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (requests && requests.length > 0) {
        setRequest(requests[0]);
      }
      setLoading(false);
    }

    checkStatus();
    const interval = setInterval(checkStatus, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, [supabase, router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-pulse">
          <Clock className="w-10 h-10 text-blue-600" />
        </div>
        
        <h1 className="text-2xl font-black text-gray-900 mb-2">Awaiting Approval</h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          Your request to join <strong className="text-gray-900">{(request as any)?.organisations?.name || "the organisation"}</strong> is pending. 
          An administrator needs to approve your access.
        </p>

        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-8 text-left">
          <div className="flex items-center gap-2 text-blue-700 font-bold text-[10px] uppercase tracking-widest mb-3">
            <Building2 className="w-4 h-4" /> Request Details
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-blue-600/60">Status</span>
              <span className="font-bold text-blue-700 capitalize">{(request as any)?.status || "Pending"}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-blue-600/60">Submitted</span>
              <span className="font-bold text-blue-700">
                {request?.created_at ? new Date(request.created_at).toLocaleDateString() : "Recently"}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
          >
            <RefreshCcw className="w-4 h-4" /> Check Status Now
          </button>
          
          <button 
            onClick={handleLogout}
            className="w-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>

        <p className="mt-8 text-[10px] text-gray-400 uppercase font-black tracking-widest">
          GreenTrack AI · Secure Data Portal
        </p>
      </div>
    </div>
  );
}
