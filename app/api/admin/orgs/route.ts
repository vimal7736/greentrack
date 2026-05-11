import { requireSuperadmin } from "@/lib/admin/auth";
import { logAdminAction } from "@/lib/admin/audit";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * GET /api/admin/orgs?search=&tier=&detail=<id>
 * If `detail` param is provided, returns full org detail with members + bills.
 * Otherwise returns all organisations with user count and bill count.
 */
export async function GET(request: NextRequest) {
  const result = await requireSuperadmin();
  if ("error" in result) return result.error;
  const admin = result.admin;

  const { searchParams } = new URL(request.url);
  const detailId = searchParams.get("detail");

  // Column sets — with and without `status` for DB compatibility
  const detailCols = "id, name, tier, status, created_at, stripe_customer_id, seats_limit";
  const detailColsFallback = "id, name, tier, created_at, stripe_customer_id, seats_limit";
  const listCols = "id, name, tier, status, created_at";
  const listColsFallback = "id, name, tier, created_at";

  /* ── Detail mode ────────────────────────────────────────── */
  if (detailId) {
    let orgRes = await admin.from("organisations").select(detailCols).eq("id", detailId).single();
    if (orgRes.error && orgRes.error.message?.includes("status")) {
      orgRes = await admin.from("organisations").select(detailColsFallback).eq("id", detailId).single();
    }

    const org = orgRes.data;
    if (!org) return NextResponse.json({ org: null });

    const [profilesRes, billsRes] = await Promise.all([
      admin.from("profiles").select("id, full_name, role, created_at").eq("org_id", detailId).order("created_at", { ascending: false }),
      admin.from("bills").select("id, bill_type, bill_date, co2_kg, cost_gbp, usage_amount, usage_unit").eq("org_id", detailId).order("bill_date", { ascending: false }).limit(100),
    ]);

    // Get emails
    const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const emailMap: Record<string, string> = {};
    for (const u of authData?.users ?? []) emailMap[u.id] = u.email ?? "";

    const members = (profilesRes.data ?? []).map((p) => ({
      ...p, full_name: p.full_name ?? "Unknown", email: emailMap[p.id] ?? "",
    }));

    const totalCo2 = (billsRes.data ?? []).reduce((s, b) => s + (b.co2_kg ?? 0), 0);

    return NextResponse.json({
      org: {
        ...org,
        status: (org as Record<string, unknown>).status ?? "active",
        user_count: members.length,
        bill_count: (billsRes.data ?? []).length,
        total_co2_kg: totalCo2,
        members,
        bills: billsRes.data ?? [],
      },
    });
  }

  /* ── List mode ──────────────────────────────────────────── */
  const search = searchParams.get("search")?.trim() ?? "";
  const tier = searchParams.get("tier") ?? "";

  let query = admin.from("organisations").select(listCols).order("created_at", { ascending: false }).limit(200);
  if (search) query = query.ilike("name", `%${search}%`);
  if (tier && tier !== "all") query = query.eq("tier", tier);

  let orgsRes = await query;

  // Fallback if status column doesn't exist
  if (orgsRes.error && orgsRes.error.message?.includes("status")) {
    let fallbackQuery = admin.from("organisations").select(listColsFallback).order("created_at", { ascending: false }).limit(200);
    if (search) fallbackQuery = fallbackQuery.ilike("name", `%${search}%`);
    if (tier && tier !== "all") fallbackQuery = fallbackQuery.eq("tier", tier);
    orgsRes = await fallbackQuery;
  }

  const orgs = orgsRes.data;
  if (!orgs) return NextResponse.json({ orgs: [] });

  const orgIds = orgs.map((o) => o.id);
  const [profilesRes, billsRes] = await Promise.all([
    admin.from("profiles").select("org_id").in("org_id", orgIds),
    admin.from("bills").select("org_id").in("org_id", orgIds),
  ]);

  const usersByOrg: Record<string, number> = {};
  const billsByOrg: Record<string, number> = {};
  for (const p of profilesRes.data ?? []) { if (p.org_id) usersByOrg[p.org_id] = (usersByOrg[p.org_id] ?? 0) + 1; }
  for (const b of billsRes.data ?? []) { if (b.org_id) billsByOrg[b.org_id] = (billsByOrg[b.org_id] ?? 0) + 1; }

  return NextResponse.json({
    orgs: orgs.map((o) => ({
      ...o,
      status: (o as Record<string, unknown>).status ?? "active",
      user_count: usersByOrg[o.id] ?? 0,
      bill_count: billsByOrg[o.id] ?? 0,
    })),
  });
}

/**
 * PATCH /api/admin/orgs
 * Update an organisation's tier or status.
 * Body: { id: string, tier?: string, status?: string }
 */
export async function PATCH(request: Request) {
  const result = await requireSuperadmin();
  if ("error" in result) return result.error;
  const admin = result.admin;

  const body = await request.json();
  const { id, tier, status } = body;

  if (!id) return NextResponse.json({ error: "Organisation ID is required" }, { status: 400 });

  const updates: Record<string, string> = {};
  if (tier && ["free", "starter", "business"].includes(tier)) updates.tier = tier;
  if (status && ["active", "suspended"].includes(status)) updates.status = status;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid updates provided" }, { status: 400 });
  }

  const { error } = await admin.from("organisations").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAdminAction(admin, {
    adminId: result.userId,
    action: tier ? "tier_change" : "status_change",
    targetType: "organisation",
    targetId: id,
    metadata: updates,
  });

  return NextResponse.json({ success: true });
}
