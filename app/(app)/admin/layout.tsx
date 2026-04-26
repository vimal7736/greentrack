import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminSubNav } from "./AdminSubNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "superadmin" && profile?.role !== "super_admin") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <AdminSubNav />
      {children}
    </div>
  );
}
