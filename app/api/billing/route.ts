import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/billing
 * Returns the current org's billing info (tier, subscription ID).
 */
export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, organisations(name, tier, stripe_subscription_id, seats_limit)")
    .eq("id", user.id)
    .single();

  if (!profile?.org_id) {
    return NextResponse.json({ error: "No organisation found" }, { status: 404 });
  }

  const org = profile.organisations as unknown as {
    name: string;
    tier: string;
    stripe_subscription_id: string | null;
    seats_limit: number;
  } | null;

  return NextResponse.json({
    tier: org?.tier ?? "free",
    name: org?.name ?? "",
    stripe_subscription_id: org?.stripe_subscription_id ?? null,
    seats_limit: org?.seats_limit ?? 3,
  });
}
