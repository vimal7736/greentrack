import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminShell from "@/components/AdminShell";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin-login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  // Only superadmin / super_admin / admin can access the admin portal
  if (profile?.role !== "superadmin" && profile?.role !== "super_admin" && profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <AdminShell
      userName={profile?.full_name ?? user.email ?? "Admin"}
      userEmail={user.email ?? ""}
    >
      {children}
    </AdminShell>
  );
}
