import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

function generateSlug(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=invalid_link`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=invalid_link`);
  }

  const user = data.user;
  const meta = user.user_metadata ?? {};

  // Service role client — bypasses RLS for org insert + profile update
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  /* ── Invited user — link to existing org ─────────────────── */
  if (meta.org_id) {
    await admin
      .from("profiles")
      .update({
        org_id:    meta.org_id,
        full_name: meta.full_name ?? "",
        job_title: meta.job_title ?? null,
        phone:     meta.user_phone ?? null,
      })
      .eq("id", user.id)
      .is("org_id", null);

    return NextResponse.redirect(`${origin}${next}`);
  }

  /* ── New signup — create org + link profile ──────────────── */
  const { data: existing } = await admin
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (existing?.org_id) {
    // Already set up (e.g. user clicked link twice) — go straight to dashboard
    return NextResponse.redirect(`${origin}${next}`);
  }

  const orgName = (meta.org_name as string) || "My Organisation";

  // Try full insert with all fields; fall back to minimal if extra columns don't exist yet
  let org: { id: string } | null = null;

  const { data: fullOrg, error: fullErr } = await admin
    .from("organisations")
    .insert({
      name:           orgName,
      slug:           generateSlug(orgName),
      org_email:      meta.org_email           ?? null,
      phone:          meta.org_phone           ?? null,
      website:        meta.org_website         ?? null,
      company_number: meta.org_company_number  ?? null,
      vat_number:     meta.org_vat_number      ?? null,
      industry:       meta.org_industry        ?? null,
      address_line1:  meta.org_address_line1   ?? null,
      address_line2:  meta.org_address_line2   ?? null,
      city:           meta.org_city            ?? null,
      county:         meta.org_county          ?? null,
      postcode:       meta.org_postcode        ?? null,
      country:        meta.org_country         ?? "GB",
      tier:           "free",
      seats_limit:    3,
    })
    .select("id")
    .single();

  if (!fullErr && fullOrg) {
    org = fullOrg;
  } else {
    // Columns not yet added — fall back to minimal insert so signup never breaks
    const { data: minOrg } = await admin
      .from("organisations")
      .insert({
        name:        orgName,
        slug:        generateSlug(orgName),
        industry:    meta.org_industry ?? null,
        tier:        "free",
        seats_limit: 3,
      })
      .select("id")
      .single();
    org = minOrg;
  }

  if (!org) {
    console.error("Org creation failed entirely");
    return NextResponse.redirect(`${origin}/login?error=org_failed`);
  }

  // Link profile to org + set role = owner
  await admin
    .from("profiles")
    .update({
      org_id:    org.id,
      role:      "owner",
      full_name: meta.full_name  ?? "",
    })
    .eq("id", user.id);

  return NextResponse.redirect(`${origin}${next}`);
}
