import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, created_at, org_id, organisations(name, tier)")
    .eq("id", user.id)
    .single();

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const org = (
    Array.isArray(profile.organisations) ? profile.organisations[0] : profile.organisations
  ) as { name: string; tier: string } | null;

  const meta = user.user_metadata ?? {};

  return NextResponse.json({
    id:         profile.id,
    full_name:  profile.full_name,
    email:      profile.email ?? user.email,
    role:       profile.role,
    created_at: profile.created_at,
    org_id:     profile.org_id,
    org_name:   org?.name  ?? null,
    org_tier:   org?.tier  ?? null,
    job_title:  meta.job_title  ?? null,
    phone:      meta.phone      ?? null,
  });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { full_name, job_title, phone } = await request.json();

  if (full_name !== undefined) {
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: full_name.trim() || null })
      .eq("id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // job_title and phone live in auth user_metadata
  const metaUpdate: Record<string, string | null> = {};
  if (job_title !== undefined) metaUpdate.job_title = job_title.trim() || null;
  if (phone     !== undefined) metaUpdate.phone     = phone.trim()     || null;

  if (Object.keys(metaUpdate).length > 0) {
    const { error } = await supabase.auth.updateUser({ data: metaUpdate });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
