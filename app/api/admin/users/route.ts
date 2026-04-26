import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * GET /api/admin/users
 * Returns all users across all organisations. Requires superadmin role.
 */
export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();

  // Fetch all profiles with their org names
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, role, org_id, created_at, organisations(name)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (!profiles) return NextResponse.json({ users: [] });

  // Fetch emails from auth.users via admin API
  const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const emailMap: Record<string, string> = {};
  for (const u of authData?.users ?? []) {
    emailMap[u.id] = u.email ?? "";
  }

  const users = profiles.map((p) => {
    const org = Array.isArray(p.organisations) ? p.organisations[0] : p.organisations;
    return {
      id: p.id,
      full_name: p.full_name ?? "Unknown User",
      email: emailMap[p.id] ?? "",
      role: p.role,
      org_id: p.org_id ?? "",
      org_name: (org as { name: string } | null)?.name ?? "No Organisation",
      created_at: p.created_at,
    };
  });

  return NextResponse.json({ users });
}
