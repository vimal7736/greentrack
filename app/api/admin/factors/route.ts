import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/admin/factors
 * Returns all emission factors. Requires superadmin role.
 *
 * PATCH /api/admin/factors
 * Updates a single factor's kg_co2e_per_unit value.
 * Body: { id: string, kg_co2e_per_unit: number }
 */
export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: factors } = await supabase
    .from("emission_factors")
    .select("id, fuel_type, unit, kg_co2e_per_unit, scope, valid_from, valid_to")
    .order("fuel_type");

  return NextResponse.json({ factors: factors ?? [] });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, kg_co2e_per_unit } = await request.json();

  if (!id || typeof kg_co2e_per_unit !== "number" || kg_co2e_per_unit <= 0) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const { error } = await supabase
    .from("emission_factors")
    .update({ kg_co2e_per_unit })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
