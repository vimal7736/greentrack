import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { name } = await request.json();
  if (!name || name.trim().length < 2) {
    return NextResponse.json({ error: "Organisation name must be at least 2 characters." }, { status: 400 });
  }

  // Create the organisation (allow_create_org RLS policy permits this)
  const { data: org, error: orgError } = await supabase
    .from("organisations")
    .insert({ name: name.trim(), tier: "free", seats_limit: 1 })
    .select("id")
    .single();

  if (orgError || !org) {
    console.error("Org insert error:", orgError);
    return NextResponse.json({ error: orgError?.message ?? "Failed to create organisation" }, { status: 500 });
  }

  // Check if profile row exists for this user
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  let profileError;

  if (existingProfile) {
    // Profile exists (created by trigger) — update org_id
    const { error } = await supabase
      .from("profiles")
      .update({ org_id: org.id, role: "owner" })
      .eq("id", user.id);
    profileError = error;
  } else {
    // No profile yet (user signed up before trigger was added) — insert one
    const { error } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        org_id: org.id,
        role: "owner",
        full_name: user.user_metadata?.full_name ?? user.email ?? "User",
      });
    profileError = error;
  }

  if (profileError) {
    console.error("Profile link error:", profileError);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, orgId: org.id });
}
