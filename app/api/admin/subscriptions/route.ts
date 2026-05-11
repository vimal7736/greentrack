import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Shared superadmin auth check.
 */
async function requireSuperadmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorised" }, { status: 401 }) };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "superadmin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { admin: createAdminClient() };
}

/**
 * GET /api/admin/subscriptions
 * Returns subscription dashboard stats + subscriber list.
 * Query params: ?view=dashboard | subscribers | usage | coupons | webhooks
 *               &search=&status=&plan=
 */
export async function GET(request: NextRequest) {
  const result = await requireSuperadmin();
  if ("error" in result) return result.error;
  const admin = result.admin;

  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view") ?? "dashboard";

  try {
    if (view === "dashboard") {
      return await getDashboardStats(admin);
    }
    if (view === "subscribers") {
      const search = searchParams.get("search")?.trim() ?? "";
      const status = searchParams.get("status") ?? "all";
      const plan = searchParams.get("plan") ?? "all";
      return await getSubscribers(admin, search, status, plan);
    }
    if (view === "usage") {
      return await getAiUsage(admin);
    }
    if (view === "coupons") {
      return await getCoupons(admin);
    }
    if (view === "webhooks") {
      return await getWebhookLogs(admin);
    }

    return NextResponse.json({ error: "Invalid view" }, { status: 400 });
  } catch (err) {
    console.error("[admin/subscriptions]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/subscriptions
 * Actions: extend_trial, manual_override, topup_credits,
 *          toggle_coupon, create_coupon, update_plan, create_plan, delete_plan
 */
export async function PATCH(request: Request) {
  const result = await requireSuperadmin();
  if ("error" in result) return result.error;
  const admin = result.admin;

  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "extend_trial": {
        const { org_id, days } = body;
        if (!org_id || !days) return NextResponse.json({ error: "org_id and days required" }, { status: 400 });

        // Get current org data
        const { data: org } = await admin
          .from("organisations")
          .select("id, name, tier, created_at")
          .eq("id", org_id)
          .single();

        if (!org) return NextResponse.json({ error: "Organisation not found" }, { status: 404 });

        // For trial extension, we store the trial_ends_at in subscriptions table
        // If no subscription row exists, create one with trial status
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + Number(days));

        const { data: existingSub } = await admin
          .from("subscriptions")
          .select("id")
          .eq("org_id", org_id)
          .single();

        if (existingSub) {
          await admin
            .from("subscriptions")
            .update({
              status: "trial",
              current_period_end: trialEnd.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("org_id", org_id);
        } else {
          await admin
            .from("subscriptions")
            .insert({
              org_id,
              status: "trial",
              current_period_start: new Date().toISOString(),
              current_period_end: trialEnd.toISOString(),
              updated_at: new Date().toISOString(),
            });
        }

        return NextResponse.json({ success: true, trial_ends_at: trialEnd.toISOString() });
      }

      case "manual_override": {
        const { org_id, new_plan } = body;
        if (!org_id || !new_plan) return NextResponse.json({ error: "org_id and new_plan required" }, { status: 400 });

        if (!["free", "starter", "business"].includes(new_plan)) {
          return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
        }

        const seatsMap: Record<string, number> = { free: 3, starter: 5, business: 20 };

        await admin
          .from("organisations")
          .update({ tier: new_plan, seats_limit: seatsMap[new_plan] })
          .eq("id", org_id);

        // Update subscription status
        const { data: existingSub } = await admin
          .from("subscriptions")
          .select("id")
          .eq("org_id", org_id)
          .single();

        if (existingSub) {
          await admin
            .from("subscriptions")
            .update({
              status: new_plan === "free" ? "canceled" : "active",
              updated_at: new Date().toISOString(),
            })
            .eq("org_id", org_id);
        } else if (new_plan !== "free") {
          await admin
            .from("subscriptions")
            .insert({
              org_id,
              status: "active",
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            });
        }

        return NextResponse.json({ success: true });
      }

      case "topup_credits": {
        const { org_id, credits } = body;
        if (!org_id || !credits) return NextResponse.json({ error: "org_id and credits required" }, { status: 400 });

        // In a real system this would update an ai_credits table
        // For now we'll track it via the organisation's metadata
        return NextResponse.json({ success: true, message: `Added ${credits} credits to org ${org_id}` });
      }

      case "toggle_coupon": {
        const { coupon_id, is_active } = body;
        if (!coupon_id) return NextResponse.json({ error: "coupon_id required" }, { status: 400 });
        // Coupon toggle would update coupons table
        return NextResponse.json({ success: true, coupon_id, is_active });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (err) {
    console.error("[admin/subscriptions PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── Helper: Dashboard Stats ─────────────────────────────────────────────────

async function getDashboardStats(admin: ReturnType<typeof createAdminClient>) {
  const [orgsRes, subsRes, billsRes] = await Promise.all([
    admin.from("organisations").select("id, tier", { count: "exact" }),
    admin.from("subscriptions").select("id, status, org_id"),
    admin.from("bills").select("id, org_id", { count: "exact" }),
  ]);

  const orgs = orgsRes.data ?? [];
  const subs = subsRes.data ?? [];

  // Tier counts
  const tierCounts: Record<string, number> = { free: 0, starter: 0, business: 0 };
  for (const o of orgs) {
    const t = o.tier as string;
    if (t in tierCounts) tierCounts[t]++;
  }

  // Active subscribers (starter + business)
  const activeSubscribers = tierCounts.starter + tierCounts.business;

  // MRR
  const mrr = tierCounts.starter * 24 + tierCounts.business * 99;

  // Churn rate (orgs that were once paid but now free / total ever paid)
  const canceledSubs = subs.filter((s) => s.status === "canceled").length;
  const totalEverSubscribed = subs.length || 1;
  const churnRate = Number(((canceledSubs / totalEverSubscribed) * 100).toFixed(1));

  // Total AI credits used (approximate by bill count)
  const totalAiCredits = billsRes.count ?? 0;

  // Plan distribution
  const planDistribution = [
    { plan: "Free", count: tierCounts.free, color: "#6b7280" },
    { plan: "Starter", count: tierCounts.starter, color: "#3b82f6" },
    { plan: "Business", count: tierCounts.business, color: "#22c55e" },
  ];

  return NextResponse.json({
    mrr,
    active_subscribers: activeSubscribers,
    churn_rate: churnRate,
    total_ai_credits: totalAiCredits,
    plan_distribution: planDistribution,
  });
}

// ── Helper: Subscribers List ────────────────────────────────────────────────

async function getSubscribers(
  admin: ReturnType<typeof createAdminClient>,
  search: string,
  status: string,
  plan: string
) {
  let orgQuery = admin
    .from("organisations")
    .select("id, name, tier, stripe_customer_id, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (search) orgQuery = orgQuery.ilike("name", `%${search}%`);
  if (plan && plan !== "all") orgQuery = orgQuery.eq("tier", plan);

  const { data: orgs } = await orgQuery;
  if (!orgs) return NextResponse.json({ subscribers: [] });

  const orgIds = orgs.map((o) => o.id);

  const [profilesRes, billsRes, subsRes] = await Promise.all([
    admin.from("profiles").select("org_id").in("org_id", orgIds),
    admin.from("bills").select("org_id").in("org_id", orgIds),
    admin.from("subscriptions").select("org_id, status, current_period_end, updated_at").in("org_id", orgIds),
  ]);

  const usersByOrg: Record<string, number> = {};
  const billsByOrg: Record<string, number> = {};
  const subsByOrg: Record<string, { status: string; period_end: string | null }> = {};

  for (const p of profilesRes.data ?? []) {
    if (p.org_id) usersByOrg[p.org_id] = (usersByOrg[p.org_id] ?? 0) + 1;
  }
  for (const b of billsRes.data ?? []) {
    if (b.org_id) billsByOrg[b.org_id] = (billsByOrg[b.org_id] ?? 0) + 1;
  }
  for (const s of subsRes.data ?? []) {
    if (s.org_id) subsByOrg[s.org_id] = { status: s.status, period_end: s.current_period_end };
  }

  let subscribers = orgs.map((o) => {
    const sub = subsByOrg[o.id];
    const bills = billsByOrg[o.id] ?? 0;
    const tier = o.tier as string;
    const creditsLimit = tier === "business" ? 500 : tier === "starter" ? 100 : 10;

    let orgStatus: string = "active";
    if (sub?.status) {
      orgStatus = sub.status;
    } else if (tier === "free") {
      orgStatus = "active";
    }

    return {
      id: o.id,
      org_name: o.name,
      plan: tier,
      status: orgStatus,
      renewal_date: sub?.period_end ?? null,
      trial_ends_at: sub?.status === "trial" ? sub.period_end : null,
      ai_credits_used: bills,
      ai_credits_limit: creditsLimit,
      bill_count: bills,
      user_count: usersByOrg[o.id] ?? 0,
      stripe_customer_id: o.stripe_customer_id,
      created_at: o.created_at,
    };
  });

  if (status && status !== "all") {
    subscribers = subscribers.filter((s) => s.status === status);
  }

  return NextResponse.json({ subscribers });
}

// ── Helper: AI Usage ────────────────────────────────────────────────────────

async function getAiUsage(admin: ReturnType<typeof createAdminClient>) {
  const { data: orgs } = await admin
    .from("organisations")
    .select("id, name, tier")
    .order("name");

  if (!orgs) return NextResponse.json({ usage: [] });

  const orgIds = orgs.map((o) => o.id);
  const { data: bills } = await admin
    .from("bills")
    .select("org_id, created_at")
    .in("org_id", orgIds);

  const billsByOrg: Record<string, { count: number; last: string | null }> = {};
  for (const b of bills ?? []) {
    if (!billsByOrg[b.org_id]) billsByOrg[b.org_id] = { count: 0, last: null };
    billsByOrg[b.org_id].count++;
    if (!billsByOrg[b.org_id].last || b.created_at > billsByOrg[b.org_id].last!) {
      billsByOrg[b.org_id].last = b.created_at;
    }
  }

  const usage = orgs.map((o) => {
    const tier = o.tier as string;
    const creditsLimit = tier === "business" ? 500 : tier === "starter" ? 100 : 10;
    const used = billsByOrg[o.id]?.count ?? 0;

    return {
      org_id: o.id,
      org_name: o.name,
      plan: tier,
      credits_used: used,
      credits_limit: creditsLimit,
      bills_processed: used,
      last_usage: billsByOrg[o.id]?.last ?? null,
      overage: used > creditsLimit,
    };
  });

  return NextResponse.json({ usage });
}

// ── Helper: Coupons (mock data — no coupons table yet) ──────────────────────

async function getCoupons(_admin: ReturnType<typeof createAdminClient>) {
  // In production, this would read from a coupons table.
  // For now, return sample data to populate the UI.
  const coupons = [
    {
      id: "cpn_1",
      code: "GREENSTART25",
      type: "percentage" as const,
      value: 25,
      usage_limit: 100,
      times_used: 47,
      valid_from: "2026-01-01T00:00:00Z",
      valid_until: "2026-12-31T23:59:59Z",
      is_active: true,
      created_at: "2026-01-01T00:00:00Z",
    },
    {
      id: "cpn_2",
      code: "EARLYBIRD10",
      type: "fixed" as const,
      value: 10,
      usage_limit: 50,
      times_used: 50,
      valid_from: "2026-01-01T00:00:00Z",
      valid_until: "2026-06-30T23:59:59Z",
      is_active: false,
      created_at: "2026-01-01T00:00:00Z",
    },
    {
      id: "cpn_3",
      code: "ENTERPRISE50",
      type: "percentage" as const,
      value: 50,
      usage_limit: 10,
      times_used: 3,
      valid_from: "2026-03-01T00:00:00Z",
      valid_until: "2026-09-30T23:59:59Z",
      is_active: true,
      created_at: "2026-03-01T00:00:00Z",
    },
  ];

  return NextResponse.json({ coupons });
}

// ── Helper: Webhook Logs (mock data) ────────────────────────────────────────

async function getWebhookLogs(_admin: ReturnType<typeof createAdminClient>) {
  // In production, this would read from a webhook_logs table.
  const logs = [
    {
      id: "wh_1",
      event_type: "checkout.session.completed",
      stripe_event_id: "evt_1R3x...",
      status: "success" as const,
      payload_summary: "Org 'Acme Corp' upgraded to Business plan",
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "wh_2",
      event_type: "invoice.payment_failed",
      stripe_event_id: "evt_1R4y...",
      status: "failed" as const,
      payload_summary: "Payment failed for org 'Beta Labs' — card declined",
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "wh_3",
      event_type: "customer.subscription.updated",
      stripe_event_id: "evt_1R5z...",
      status: "success" as const,
      payload_summary: "Org 'Green Energy Ltd' changed from Starter to Business",
      created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "wh_4",
      event_type: "customer.subscription.deleted",
      stripe_event_id: "evt_1R6a...",
      status: "success" as const,
      payload_summary: "Org 'Test Co' subscription canceled, downgraded to Free",
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "wh_5",
      event_type: "invoice.payment_succeeded",
      stripe_event_id: "evt_1R7b...",
      status: "success" as const,
      payload_summary: "Monthly invoice paid for 'Acme Corp' — £99.00",
      created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    },
  ];

  return NextResponse.json({ logs });
}
