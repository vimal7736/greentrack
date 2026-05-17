import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const domain = email.split("@")[1].toLowerCase();
  const supabase = await createClient();

  // Search for organisations with matching discovery_domain and allow_discovery = true
  const { data: orgs, error } = await supabase
    .from("organisations")
    .select("id, name")
    .eq("discovery_domain", domain)
    .eq("allow_discovery", true)
    .limit(1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!orgs || orgs.length === 0) {
    return NextResponse.json({ found: false });
  }

  return NextResponse.json({
    found: true,
    orgId: orgs[0].id,
    orgName: orgs[0].name,
  });
}
