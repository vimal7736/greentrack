import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * GET /api/admin/activity
 * Returns recent platform activity (signups + bill uploads).
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

  // Recent signups (last 20)
  const { data: recentProfiles } = await admin
    .from("profiles")
    .select("id, full_name, created_at, organisations(name)")
    .order("created_at", { ascending: false })
    .limit(20);

  // Recent bills (last 20)
  const { data: recentBills } = await admin
    .from("bills")
    .select("id, bill_type, co2_kg, created_at, org_id, organisations(name)")
    .order("created_at", { ascending: false })
    .limit(20);

  type ActivityItem = {
    id: string;
    type: "signup" | "bill_upload";
    description: string;
    user_name: string | null;
    org_name: string | null;
    created_at: string;
  };

  const activities: ActivityItem[] = [];

  for (const p of recentProfiles ?? []) {
    const org = Array.isArray(p.organisations) ? p.organisations[0] : p.organisations;
    activities.push({
      id: `signup-${p.id}`,
      type: "signup",
      description: `${p.full_name ?? "New user"} joined the platform`,
      user_name: p.full_name,
      org_name: (org as { name: string } | null)?.name ?? null,
      created_at: p.created_at,
    });
  }

  for (const b of recentBills ?? []) {
    const org = Array.isArray(b.organisations) ? b.organisations[0] : b.organisations;
    const typeLabel = b.bill_type?.replace("_", " ") ?? "unknown";
    activities.push({
      id: `bill-${b.id}`,
      type: "bill_upload",
      description: `${typeLabel} bill uploaded — ${b.co2_kg?.toFixed(1) ?? "0"} kg CO₂e`,
      user_name: null,
      org_name: (org as { name: string } | null)?.name ?? null,
      created_at: b.created_at,
    });
  }

  // Sort by timestamp descending and take top 30
  activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({ activities: activities.slice(0, 30) });
}
