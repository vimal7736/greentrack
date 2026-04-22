import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * GET /api/team
 * Returns all profiles in the same org as the authenticated user.
 *
 * POST /api/team
 * Invites a user by email (Supabase sends the invite email automatically).
 * Body: { email: string }
 * Requires admin or owner role.
 */

export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, organisations(name, tier, seats_limit)")
    .eq("id", user.id)
    .single();

  if (!profile?.org_id) {
    return NextResponse.json({ error: "No organisation found" }, { status: 404 });
  }

  const { data: members } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, created_at")
    .eq("org_id", profile.org_id)
    .order("created_at", { ascending: true });

  const org = profile.organisations as unknown as { name: string; tier: string; seats_limit: number } | null;

  return NextResponse.json({
    members: members ?? [],
    org: {
      name: org?.name ?? "",
      tier: org?.tier ?? "free",
      seats_limit: org?.seats_limit ?? 3,
    },
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, role, organisations(seats_limit, tier)")
    .eq("id", user.id)
    .single();

  if (!profile?.org_id) {
    return NextResponse.json({ error: "No organisation found" }, { status: 404 });
  }

  if (profile.role !== "admin" && profile.role !== "owner") {
    return NextResponse.json({ error: "Only admins can invite members" }, { status: 403 });
  }

  const org = profile.organisations as unknown as { seats_limit: number; tier: string } | null;
  const seatsLimit = org?.seats_limit ?? 3;

  // Count current members
  const { count: currentCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("org_id", profile.org_id);

  if ((currentCount ?? 0) >= seatsLimit) {
    return NextResponse.json(
      { error: `Seat limit reached (${seatsLimit}). Upgrade your plan to add more members.` },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { email } = body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  // Use Supabase admin to invite the user — this sends a magic link email
  const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    data: { org_id: profile.org_id },
  });

  if (inviteError) {
    // If user already exists, that's fine — they can just sign in
    if (!inviteError.message.includes("already been registered")) {
      return NextResponse.json({ error: inviteError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, message: `Invite sent to ${email}` });
}
