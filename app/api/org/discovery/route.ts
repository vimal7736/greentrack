import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Accept either ?domain=greentrack.com or ?email=user@greentrack.com
  let domain = searchParams.get("domain") ?? "";

  if (!domain) {
    const email = searchParams.get("email") ?? "";
    if (email.includes("@")) domain = email.split("@")[1];
  }

  // Strip leading @ if user typed @company.com
  domain = domain.replace(/^@/, "").toLowerCase().trim();

  if (!domain) return NextResponse.json({ found: false });

  const supabase = await createClient();

  const { data: orgs, error } = await supabase
    .from("organisations")
    .select("id, name")
    .eq("discovery_domain", domain)
    .eq("allow_discovery", true)
    .limit(1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!orgs || orgs.length === 0) return NextResponse.json({ found: false });

  return NextResponse.json({ found: true, orgId: orgs[0].id, orgName: orgs[0].name });
}
