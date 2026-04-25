import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, organisations(name, tier)")
    .eq("id", user.id)
    .single();

  const org = (Array.isArray(profile?.organisations) ? profile.organisations[0] : profile?.organisations) as { name: string; tier: string } | null;

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-base)" }}>
      <Sidebar
        userName={profile?.full_name ?? user.email ?? "User"}
        userEmail={user.email ?? ""}
        userRole={profile?.role ?? "member"}
        orgName={org?.name ?? "Your Organisation"}
        orgTier={org?.tier ?? "free"}
      />
      <main
        id="main-content"
        className="flex-1 p-8"
        tabIndex={-1}
        style={{ marginLeft: "var(--sidebar-w, 16rem)", color: "var(--text-primary)", transition: "margin-left 0.28s cubic-bezier(.4,0,.2,1)" }}
      >
        {children}
      </main>
    </div>
  );
}
