import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/bills
 * Returns paginated bills for the authenticated user's org.
 * Query params: page (default 1), page_size (default 10), type (filter), search (date/supplier)
 *
 * DELETE /api/bills?id=<uuid>
 * Deletes a single bill by ID (org-scoped, admin only in full impl).
 */
export async function GET(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile?.org_id) {
    return NextResponse.json({ error: "No organisation found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("page_size") ?? "10")));
  const typeFilter = searchParams.get("type") ?? "";
  const search = (searchParams.get("search") ?? "").trim().toLowerCase();

  let query = supabase
    .from("bills")
    .select(
      "id, bill_type, bill_date, usage_amount, usage_unit, co2_kg, cost_gbp, supplier, account_number, pdf_url, created_at",
      { count: "exact" }
    )
    .eq("org_id", profile.org_id)
    .order("bill_date", { ascending: false });

  if (typeFilter && typeFilter !== "all") {
    query = query.eq("bill_type", typeFilter);
  }

  if (search) {
    // Filter by date prefix or supplier name (case-insensitive via ilike)
    query = query.or(`bill_date.ilike.%${search}%,supplier.ilike.%${search}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data: bills, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Summary stats across ALL filtered bills (not just this page)
  const { data: allBills } = await supabase
    .from("bills")
    .select("co2_kg, cost_gbp, bill_type")
    .eq("org_id", profile.org_id)
    .then((r) => {
      // reapply same type filter for summary
      if (typeFilter && typeFilter !== "all") {
        return { data: r.data?.filter((b) => b.bill_type === typeFilter) ?? [] };
      }
      return r;
    });

  const totalCo2 = allBills?.reduce((s, b) => s + (b.co2_kg ?? 0), 0) ?? 0;
  const totalCost = allBills?.reduce((s, b) => s + (b.cost_gbp ?? 0), 0) ?? 0;

  return NextResponse.json({
    bills: bills ?? [],
    total: count ?? 0,
    page,
    page_size: pageSize,
    total_pages: Math.ceil((count ?? 0) / pageSize),
    summary: {
      total_co2_kg: Math.round(totalCo2 * 10) / 10,
      total_cost_gbp: Math.round(totalCost * 100) / 100,
    },
  });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, role")
    .eq("id", user.id)
    .single();

  if (!profile?.org_id) {
    return NextResponse.json({ error: "No organisation found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const billId = searchParams.get("id");
  if (!billId) return NextResponse.json({ error: "Missing bill id" }, { status: 400 });

  // RLS ensures org scoping; also check role if needed
  const { error } = await supabase
    .from("bills")
    .delete()
    .eq("id", billId)
    .eq("org_id", profile.org_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
