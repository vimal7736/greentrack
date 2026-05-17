import { requireSuperadmin } from "@/lib/admin/auth";
import { logAdminAction } from "@/lib/admin/audit";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * GET /api/admin/users?detail=<id>
 * If `detail` param provided, returns full user detail with bills.
 * Otherwise returns all users across all organisations.
 */
export async function GET(request: NextRequest) {
  const result = await requireSuperadmin();
  if ("error" in result) return result.error;
  const admin = result.admin;

  const { searchParams } = new URL(request.url);
  const detailId = searchParams.get("detail");

  // Fetch emails from auth
  const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const emailMap: Record<string, string> = {};
  for (const u of authData?.users ?? []) emailMap[u.id] = u.email ?? "";

  // Try selecting with is_disabled first; fall back without it
  const selectCols = "id, full_name, role, org_id, is_disabled, created_at, organisations(name)";
  const selectColsFallback = "id, full_name, role, org_id, created_at, organisations(name)";

  /* ── Detail mode ────────────────────────────────────────── */
  if (detailId) {
    let profileRes = await admin
      .from("profiles")
      .select(selectCols)
      .eq("id", detailId)
      .single();

    // Fallback if is_disabled column doesn't exist
    if (profileRes.error && profileRes.error.message?.includes("is_disabled")) {
      profileRes = await admin
        .from("profiles")
        .select(selectColsFallback)
        .eq("id", detailId)
        .single();
    }

    const profile = profileRes.data;
    if (!profile) return NextResponse.json({ user: null });

    const { data: bills } = await admin
      .from("bills")
      .select("id, bill_type, bill_date, co2_kg")
      .eq("uploaded_by", detailId)
      .order("bill_date", { ascending: false })
      .limit(50);

    const org = Array.isArray(profile.organisations) ? profile.organisations[0] : profile.organisations;

    return NextResponse.json({
      user: {
        id: profile.id,
        full_name: profile.full_name ?? "Unknown User",
        email: emailMap[profile.id] ?? "",
        role: profile.role,
        org_id: profile.org_id ?? "",
        org_name: (org as { name: string } | null)?.name ?? "No Organisation",
        created_at: profile.created_at,
        is_disabled: (profile as Record<string, unknown>).is_disabled ?? false,
        bills: bills ?? [],
      },
    });
  }

  /* ── List mode ──────────────────────────────────────────── */
  let profilesRes: any = await admin
    .from("profiles")
    .select(selectCols)
    .order("created_at", { ascending: false })
    .limit(200);

  // Fallback if is_disabled column doesn't exist
  if (profilesRes.error && profilesRes.error.message?.includes("is_disabled")) {
    profilesRes = await admin
      .from("profiles")
      .select(selectColsFallback)
      .order("created_at", { ascending: false })
      .limit(200);
  }

  const profiles = profilesRes.data;
  if (!profiles) return NextResponse.json({ users: [] });

  const users = profiles.map((p: Record<string, any>) => {
    const org = Array.isArray(p.organisations) ? p.organisations[0] : p.organisations;
    return {
      id: p.id,
      full_name: p.full_name ?? "Unknown User",
      email: emailMap[p.id] ?? "",
      role: p.role,
      org_id: p.org_id ?? "",
      org_name: (org as { name: string } | null)?.name ?? "No Organisation",
      created_at: p.created_at,
      is_disabled: (p as Record<string, unknown>).is_disabled ?? false,
    };
  });

  return NextResponse.json({ users });
}

/**
 * PATCH /api/admin/users
 * Update a user's role or disable/enable status.
 * Body: { user_id: string, role?: string, action?: "disable" | "enable" }
 */
export async function PATCH(request: Request) {
  const result = await requireSuperadmin();
  if ("error" in result) return result.error;
  const admin = result.admin;

  const body = await request.json();
  const { user_id, role, action } = body;

  if (!user_id) return NextResponse.json({ error: "user_id is required" }, { status: 400 });

  /* ── Role change ────────────────────────────────────────── */
  if (role && ["owner", "admin", "member"].includes(role)) {
    const { data: target } = await admin.from("profiles").select("role").eq("id", user_id).single();
    if (target?.role === "superadmin" || target?.role === "super_admin") {
      return NextResponse.json({ error: "Cannot change a superadmin's role" }, { status: 403 });
    }

    const { error } = await admin.from("profiles").update({ role }).eq("id", user_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await logAdminAction(admin, {
      adminId: result.userId,
      action: "role_change",
      targetType: "user",
      targetId: user_id,
      metadata: { old_role: target?.role, new_role: role },
    });

    return NextResponse.json({ success: true });
  }

  /* ── Disable / Enable ───────────────────────────────────── */
  if (action === "disable" || action === "enable") {
    const is_disabled = action === "disable";
    const { error } = await admin.from("profiles").update({ is_disabled }).eq("id", user_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await logAdminAction(admin, {
      adminId: result.userId,
      action: action === "disable" ? "user_disable" : "user_enable",
      targetType: "user",
      targetId: user_id,
      metadata: { is_disabled },
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "No valid updates provided" }, { status: 400 });
}
