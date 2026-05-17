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
    .select("org_id, role, organisations(name, tier, seats_limit, discovery_domain, allow_discovery)")
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

  const org = (Array.isArray(profile.organisations) ? profile.organisations[0] : profile.organisations) as { name: string; tier: string; seats_limit: number } | null;

  return NextResponse.json({
    members: members ?? [],
    org: {
      name: org?.name ?? "",
      tier: org?.tier ?? "free",
      seats_limit: org?.seats_limit ?? 3,
      discovery_domain: (org as any)?.discovery_domain ?? "",
      allow_discovery: (org as any)?.allow_discovery ?? false,
    },
    myRole: profile?.role ?? "member",
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

  const org = (Array.isArray(profile.organisations) ? profile.organisations[0] : profile.organisations) as { seats_limit: number; tier: string } | null;
  const seatsLimit = org?.seats_limit ?? 3;

  // Count current members (exclude platform superadmins from seat count)
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
  const { email, password, fullName } = body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  // 0. Check if a profile already exists for this email
  // If it does, we just link them to this org immediately
  const { data: existingProfile } = await adminClient
    .from("profiles")
    .select("id")
    .eq("email", email)
    .single();

  if (existingProfile) {
    await adminClient
      .from("profiles")
      .update({ 
        org_id: profile.org_id, 
        role: "member",
        full_name: fullName || undefined 
      })
      .eq("id", existingProfile.id);

    return NextResponse.json({ 
      success: true, 
      message: `${email} was already in the system and has been linked to your organisation.` 
    });
  }

  if (password) {
    // 1. Create user with password immediately
    const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // User must verify their email to access dashboard
      user_metadata: { 
        full_name: fullName || email.split('@')[0],
        org_id: profile.org_id 
      }
    });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    // 1.b Manually ensure profile exists with correct org_id
    await adminClient.from("profiles").upsert({
      id: createData.user.id,
      org_id: profile.org_id,
      full_name: fullName || email.split('@')[0],
      email: email,
      role: "member"
    }, { onConflict: 'id' });

    // 1.c Trigger the verification email by sending an invite to the newly created user
    await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
      data: { org_id: profile.org_id }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Account created and verification email sent to ${email}.` 
    });
  } else {
    // 2. Use Supabase admin to invite the user — this sends a magic link email
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
      data: { 
        org_id: profile.org_id,
        full_name: fullName || email.split('@')[0]
      },
    });

    if (inviteError) {
      if (!inviteError.message.includes("already been registered")) {
        return NextResponse.json({ error: inviteError.message }, { status: 500 });
      }
    }

    // 2.b Manually ensure profile exists (if invite created a new user)
    if (inviteData?.user) {
      await adminClient.from("profiles").upsert({
        id: inviteData.user.id,
        org_id: profile.org_id,
        full_name: fullName || email.split('@')[0],
        email: email,
        role: "member"
      }, { onConflict: 'id' });
    }

    return NextResponse.json({ success: true, message: `Invite sent to ${email}` });
  }
}
