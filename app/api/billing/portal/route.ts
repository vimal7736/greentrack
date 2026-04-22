import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

/**
 * POST /api/billing/portal
 * Creates a Stripe Customer Portal session for managing subscription,
 * updating payment method, viewing invoices, or cancelling.
 */
export async function POST() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, organisations(stripe_customer_id)")
    .eq("id", user.id)
    .single();

  const org = (Array.isArray(profile?.organisations) ? profile.organisations[0] : profile?.organisations) as { stripe_customer_id: string | null } | null;

  if (!org?.stripe_customer_id) {
    return NextResponse.json({ error: "No billing account found" }, { status: 404 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: org.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
  });

  return NextResponse.json({ url: session.url });
}
