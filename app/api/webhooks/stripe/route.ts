import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { sendSubscriptionChangedEmail } from "@/lib/email";

async function notifyOrgOfPlanChange(orgId: string, newTier: string) {
  const supabase = createAdminClient();
  const { data: org } = await supabase
    .from("organisations")
    .select("name")
    .eq("id", orgId)
    .single();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id")
    .eq("org_id", orgId);

  if (!profiles || profiles.length === 0) return;

  // Fetch emails from auth.users (requires admin client)
  for (const profile of profiles) {
    const { data: { user } } = await supabase.auth.admin.getUserById(profile.id);
    if (user?.email) {
      sendSubscriptionChangedEmail({
        to: user.email,
        orgName: org?.name ?? "Your Organisation",
        newTier,
      });
    }
  }
}

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

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const orgId = session.metadata?.org_id;
        const plan = session.metadata?.plan;
        const subscriptionId = session.subscription as string;

        if (!orgId || !plan) break;

        const seatsMap: Record<string, number> = { starter: 5, business: 20 };

        const { error } = await supabase
          .from("organisations")
          .update({
            tier: plan,
            stripe_subscription_id: subscriptionId,
            seats_limit: seatsMap[plan] ?? 3,
          })
          .eq("id", orgId);

        if (error) throw new Error(`DB update failed for checkout.session.completed: ${error.message}`);
        
        // Notify of change
        notifyOrgOfPlanChange(orgId, plan);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object;
        const customerId = sub.customer as string;

        const { data: org, error: fetchError } = await supabase
          .from("organisations")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (fetchError) throw new Error(`Org lookup failed: ${fetchError.message}`);
        if (!org) break;

        const priceId = sub.items.data[0]?.price?.id;
        let tier = "free";
        if (priceId === process.env.STRIPE_STARTER_PRICE_ID) tier = "starter";
        if (priceId === process.env.STRIPE_BUSINESS_PRICE_ID) tier = "business";

        const seatsMap: Record<string, number> = { free: 3, starter: 5, business: 20 };

        const { error: updateError } = await supabase
          .from("organisations")
          .update({ tier, seats_limit: seatsMap[tier] })
          .eq("id", org.id);

        if (updateError) throw new Error(`DB update failed for subscription.updated: ${updateError.message}`);
        
        // Notify of change
        notifyOrgOfPlanChange(org.id, tier);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const customerId = sub.customer as string;

        const { data: org, error: fetchError } = await supabase
          .from("organisations")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (fetchError) throw new Error(`Org lookup failed: ${fetchError.message}`);
        if (!org) break;

        const { error: updateError } = await supabase
          .from("organisations")
          .update({ tier: "free", stripe_subscription_id: null, seats_limit: 3 })
          .eq("id", org.id);

        if (updateError) throw new Error(`DB update failed for subscription.deleted: ${updateError.message}`);
        
        // Notify of downgrade to free
        notifyOrgOfPlanChange(org.id, "free");
        break;
      }
    }
  } catch (err) {
    console.error("[stripe-webhook]", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
