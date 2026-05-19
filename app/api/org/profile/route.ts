import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const UPDATABLE_FIELDS = [
  "name", "logo_url", "org_email", "phone", "website",
  "company_number", "vat_number", "industry",
  "address_line1", "address_line2", "city", "county", "postcode", "country",
] as const;

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, role")
    .eq("id", user.id)
    .single();

  if (!profile?.org_id) return NextResponse.json({ error: "No organisation" }, { status: 404 });

  const { data: org } = await supabase
    .from("organisations")
    .select(
      "id, name, logo_url, org_email, phone, website, company_number, vat_number, industry, " +
      "address_line1, address_line2, city, county, postcode, country, " +
      "tier, seats_limit, discovery_domain, allow_discovery"
    )
    .eq("id", profile.org_id)
    .single();

  if (!org) return NextResponse.json({ error: "Organisation not found" }, { status: 404 });

  return NextResponse.json({ ...(org as unknown as Record<string, unknown>), user_role: profile.role });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, role")
    .eq("id", user.id)
    .single();

  if (!profile?.org_id || (profile.role !== "admin" && profile.role !== "owner")) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const body = await request.json();
  const update: Record<string, unknown> = {};
  for (const field of UPDATABLE_FIELDS) {
    if (body[field] !== undefined) update[field] = body[field] || null;
  }
  // name must not be empty
  if (update.name === null) {
    return NextResponse.json({ error: "Organisation name is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("organisations")
    .update(update)
    .eq("id", profile.org_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
