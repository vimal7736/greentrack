import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * GET /api/admin/stats
 * Returns platform-wide stats. Requires superadmin role.
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

  const today = new Date().toISOString().slice(0, 10);

  const [orgsRes, usersRes, billsTodayRes, billsAllRes] = await Promise.all([
    admin.from("organisations").select("id, tier", { count: "exact" }),
    admin.from("profiles").select("id", { count: "exact" }),
    admin.from("bills").select("id", { count: "exact" }).gte("created_at", today),
    admin.from("bills").select("id", { count: "exact" }),
  ]);

  const orgs = orgsRes.data ?? [];
  const tierCounts = { free: 0, starter: 0, business: 0 };
  for (const o of orgs) {
    const t = o.tier as keyof typeof tierCounts;
    if (t in tierCounts) tierCounts[t]++;
  }

  const mrr = tierCounts.starter * 24 + tierCounts.business * 99;

  return NextResponse.json({
    total_orgs: orgsRes.count ?? 0,
    total_users: usersRes.count ?? 0,
    bills_today: billsTodayRes.count ?? 0,
    total_bills: billsAllRes.count ?? 0,
    mrr,
    tier_counts: tierCounts,
  });
}
