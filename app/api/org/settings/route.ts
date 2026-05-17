import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPublicDomain } from "@/lib/utils/domain";

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

  const { discovery_domain, allow_discovery } = await request.json();

  if (discovery_domain && isPublicDomain(discovery_domain)) {
    return NextResponse.json(
      { error: "Public email domains (gmail.com, yahoo.com, etc.) cannot be used for discovery. Use your company domain e.g. company.com" },
      { status: 400 }
    );
  }

  const updateData: any = {};
  if (discovery_domain !== undefined) updateData.discovery_domain = discovery_domain.toLowerCase().trim();
  if (allow_discovery !== undefined) updateData.allow_discovery = allow_discovery;

  const { error } = await supabase
    .from("organisations")
    .update(updateData)
    .eq("id", profile.org_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
