import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/bills/export
 * Returns all filtered bills as a CSV file download.
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
  const typeFilter = searchParams.get("type") ?? "";
  const search = (searchParams.get("search") ?? "").trim().toLowerCase();

  let query = supabase
    .from("bills")
    .select("bill_type, bill_date, usage_amount, usage_unit, co2_kg, cost_gbp, supplier, account_number, created_at")
    .eq("org_id", profile.org_id)
    .order("bill_date", { ascending: false })
    .limit(5000);

  if (typeFilter && typeFilter !== "all") {
    query = query.eq("bill_type", typeFilter);
  }

  if (search) {
    query = query.or(`bill_date.ilike.%${search}%,supplier.ilike.%${search}%`);
  }

  const { data: bills, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const headers = ["Bill Type", "Bill Date", "Supplier", "Usage", "Unit", "CO2 (kg)", "Cost (£)", "Account No.", "Created At"];
  const rows = (bills ?? []).map((b) => [
    b.bill_type,
    b.bill_date,
    b.supplier ?? "",
    b.usage_amount,
    b.usage_unit,
    b.co2_kg,
    b.cost_gbp ?? "",
    b.account_number ?? "",
    b.created_at,
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="greentrack-bills-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
