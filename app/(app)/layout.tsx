import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";

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

  // Block admin users from accessing user portal — redirect to admin portal
  if (profile?.role === "superadmin" || profile?.role === "super_admin") {
    redirect("/admin");
  }

  const org = (Array.isArray(profile?.organisations) ? profile.organisations[0] : profile?.organisations) as { name: string; tier: string } | null;

  return (
    <AppShell
      userName={profile?.full_name ?? user.email ?? "User"}
      userEmail={user.email ?? ""}
      userRole={profile?.role ?? "member"}
      orgName={org?.name ?? "Your Organisation"}
      orgTier={org?.tier ?? "free"}
    >
      {children}
    </AppShell>
  );
}
