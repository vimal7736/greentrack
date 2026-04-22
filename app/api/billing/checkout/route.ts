import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/ratelimit";

/**
 * POST /api/billing/checkout
 * Creates a Stripe Checkout session for upgrading to starter or business plan.
 * Body: { plan: "starter" | "business" }
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  // Rate limiting
  const { success } = await checkRateLimit("checkout", user.id);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, full_name, organisations(name, stripe_customer_id, tier)")
    .eq("id", user.id)
    .single();

  if (!profile?.org_id) {
    return NextResponse.json({ error: "No organisation found" }, { status: 404 });
  }

  const { plan } = await request.json();
  if (!["starter", "business"].includes(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const priceId = plan === "starter"
    ? process.env.STRIPE_STARTER_PRICE_ID!
    : process.env.STRIPE_BUSINESS_PRICE_ID!;

  const org = (Array.isArray(profile.organisations) ? profile.organisations[0] : profile.organisations) as {
    name: string;
    stripe_customer_id: string | null;
    tier: string;
  } | null;

  // Reuse existing Stripe customer or create a new one
  let customerId = org?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email!,
      name: org?.name ?? profile.full_name ?? user.email!,
      metadata: { org_id: profile.org_id },
    });
    customerId = customer.id;

    await supabase
      .from("organisations")
      .update({ stripe_customer_id: customerId })
      .eq("id", profile.org_id);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    automatic_tax: { enabled: true }, // Stripe Tax handles 20% UK VAT
    customer_update: { address: "auto" },
    success_url: `${appUrl}/billing?success=1`,
    cancel_url: `${appUrl}/billing?cancelled=1`,
    metadata: { org_id: profile.org_id, plan },
  });

  return NextResponse.json({ url: session.url });
}
