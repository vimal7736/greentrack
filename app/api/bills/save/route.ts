import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendBillProcessedEmail } from "@/lib/email";

/**
 * POST /api/bills/save
 * Final step of the upload flow.
 * Looks up the correct DEFRA emission factor for the bill date,
 * calculates CO2, and saves the bill to the database.
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  // Get user's org
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, organisations(name)")
    .eq("id", user.id)
    .single();

  if (!profile?.org_id) {
    return NextResponse.json({ error: "No organisation found" }, { status: 404 });
  }

  const body = await request.json();
  const {
    bill_type,   // e.g. "electricity"
    bill_date,   // e.g. "2025-03-01"
    usage_amount,
    usage_unit,
    supplier,
    account_number,
    cost_gbp,
    pdf_url,
    ocr_raw,
  } = body;

  // ── Validate required fields ──────────────────────────────────────────────
  if (!bill_type || !bill_date || !usage_amount || !usage_unit) {
    return NextResponse.json(
      { error: "Missing required fields: bill_type, bill_date, usage_amount, usage_unit" },
      { status: 400 }
    );
  }

  // ── Look up emission factor by bill date (critical for SECR accuracy) ────
  // Uses valid_from / valid_to so old bills use the correct historical factor
  const { data: factor } = await supabase
    .from("emission_factors")
    .select("kg_co2e_per_unit, scope")
    .eq("fuel_type", bill_type)
    .eq("unit", usage_unit)
    .lte("valid_from", bill_date)
    .gte("valid_to", bill_date)
    .single();

  if (!factor) {
    return NextResponse.json(
      {
        error: `No emission factor found for ${bill_type} / ${usage_unit} on ${bill_date}.
                Please ask your admin to add the correct DEFRA factor.`,
      },
      { status: 422 }
    );
  }

  // ── Calculate CO2 ─────────────────────────────────────────────────────────
  // Formula: CO2 (kg) = usage × emission factor
  const co2_kg = Math.round(usage_amount * factor.kg_co2e_per_unit * 100) / 100;

  // ── Save to database ──────────────────────────────────────────────────────
  const { data: bill, error: insertError } = await supabase
    .from("bills")
    .insert({
      org_id: profile.org_id,
      uploaded_by: user.id,
      bill_type,
      bill_date,
      usage_amount,
      usage_unit,
      co2_kg,
      cost_gbp: cost_gbp ?? null,
      supplier: supplier ?? null,
      account_number: account_number ?? null,
      pdf_url: pdf_url ?? null,
      ocr_raw: ocr_raw ?? null,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Fire-and-forget email
  const org = (Array.isArray(profile.organisations) ? profile.organisations[0] : profile.organisations) as { name: string } | null;
  sendBillProcessedEmail({
    to: user.email!,
    orgName: org?.name ?? "Your Organisation",
    billType: bill_type,
    co2Kg: co2_kg,
  });

  return NextResponse.json({
    bill,
    co2_kg,
    factor_used: factor.kg_co2e_per_unit,
    scope: factor.scope,
    // Real-world equivalents for the result screen
    equivalents: {
      miles_driven: Math.round(co2_kg / 0.255),
      trees_one_year: Math.round((co2_kg / 21.77) * 10) / 10,
    },
  });
}
