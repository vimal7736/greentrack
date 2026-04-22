import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * GET /api/admin/orgs
 * Returns all organisations with user count and bill count.
 * Requires superadmin role.
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

  const { data: orgs } = await admin
    .from("organisations")
    .select("id, name, tier, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (!orgs) return NextResponse.json({ orgs: [] });

  // Get user and bill counts per org
  const orgIds = orgs.map((o) => o.id);

  const [profilesRes, billsRes] = await Promise.all([
    admin.from("profiles").select("org_id").in("org_id", orgIds),
    admin.from("bills").select("org_id").in("org_id", orgIds),
  ]);

  const usersByOrg: Record<string, number> = {};
  const billsByOrg: Record<string, number> = {};

  for (const p of profilesRes.data ?? []) {
    if (p.org_id) usersByOrg[p.org_id] = (usersByOrg[p.org_id] ?? 0) + 1;
  }
  for (const b of billsRes.data ?? []) {
    if (b.org_id) billsByOrg[b.org_id] = (billsByOrg[b.org_id] ?? 0) + 1;
  }

  return NextResponse.json({
    orgs: orgs.map((o) => ({
      ...o,
      user_count: usersByOrg[o.id] ?? 0,
      bill_count: billsByOrg[o.id] ?? 0,
    })),
  });
}
