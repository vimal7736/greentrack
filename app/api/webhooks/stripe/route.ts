import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * POST /api/webhooks/stripe
 * Handles Stripe webhook events.
 * Configure in Stripe Dashboard → Webhooks → this endpoint.
 *
 * Events handled:
 * - checkout.session.completed → activate subscription
 * - customer.subscription.updated → sync plan changes
 * - customer.subscription.deleted → downgrade to free
 */
export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const orgId = session.metadata?.org_id;
      const plan = session.metadata?.plan;
      const subscriptionId = session.subscription as string;

      if (!orgId || !plan) break;

      const seatsMap: Record<string, number> = { starter: 5, business: 20 };

      await supabase
        .from("organisations")
        .update({
          tier: plan,
          stripe_subscription_id: subscriptionId,
          seats_limit: seatsMap[plan] ?? 3,
        })
        .eq("id", orgId);

      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object;
      const customerId = sub.customer as string;

      const { data: org } = await supabase
        .from("organisations")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (!org) break;

      // Map Stripe price IDs to plan names
      const priceId = sub.items.data[0]?.price?.id;
      let tier = "free";
      if (priceId === process.env.STRIPE_STARTER_PRICE_ID) tier = "starter";
      if (priceId === process.env.STRIPE_BUSINESS_PRICE_ID) tier = "business";

      const seatsMap: Record<string, number> = { free: 3, starter: 5, business: 20 };

      await supabase
        .from("organisations")
        .update({ tier, seats_limit: seatsMap[tier] })
        .eq("id", org.id);

      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object;
      const customerId = sub.customer as string;

      const { data: org } = await supabase
        .from("organisations")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (!org) break;

      await supabase
        .from("organisations")
        .update({ tier: "free", stripe_subscription_id: null, seats_limit: 3 })
        .eq("id", org.id);

      break;
    }
  }

  return NextResponse.json({ received: true });
}
