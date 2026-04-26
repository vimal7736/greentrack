import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Shared superadmin auth check. Returns the admin Supabase client or an error response.
 */
async function requireSuperadmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorised" }, { status: 401 }) };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "superadmin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { admin: createAdminClient() };
}

/**
 * GET /api/admin/orgs?search=&tier=
 * Returns all organisations with user count and bill count.
 * Supports optional search and tier filter.
 * Requires superadmin role.
 */
export async function GET(request: NextRequest) {
  const result = await requireSuperadmin();
  if ("error" in result) return result.error;
  const admin = result.admin;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const tier = searchParams.get("tier") ?? "";

  let query = admin
    .from("organisations")
    .select("id, name, tier, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }
  if (tier && tier !== "all") {
    query = query.eq("tier", tier);
  }

  const { data: orgs } = await query;

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

/**
 * PATCH /api/admin/orgs
 * Update an organisation's tier or suspend status.
 * Body: { id: string, tier?: string }
 * Requires superadmin role.
 */
export async function PATCH(request: Request) {
  const result = await requireSuperadmin();
  if ("error" in result) return result.error;
  const admin = result.admin;

  const body = await request.json();
  const { id, tier } = body;

  if (!id) {
    return NextResponse.json({ error: "Organisation ID is required" }, { status: 400 });
  }

  const updates: Record<string, string> = {};
  if (tier && ["free", "starter", "business"].includes(tier)) {
    updates.tier = tier;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid updates provided" }, { status: 400 });
  }

  const { error } = await admin
    .from("organisations")
    .update(updates)
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
