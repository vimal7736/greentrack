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

  // Block unverified users from dashboard - redirect to verify email
  if (!user.email_confirmed_at) {
    redirect("/verify-email");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, org_id, organisations(name, tier)")
    .eq("id", user.id)
    .single();

  // Block admin users from accessing user portal — redirect to admin portal
  if (profile?.role === "superadmin" || profile?.role === "super_admin" || profile?.role === "admin") {
    redirect("/admin");
  }

  // If user has no organisation linked, redirect to waiting approval
  if (!profile?.org_id) {
    redirect("/waiting-approval");
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
