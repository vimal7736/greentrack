import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/targets — returns the active target for the user's org
export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("org_id").eq("id", user.id).single();
  if (!profile?.org_id) return NextResponse.json({ error: "No organisation found" }, { status: 404 });

  const { data, error } = await supabase
    .from("targets")
    .select("*")
    .eq("org_id", profile.org_id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ target: data ?? null });
}

// POST /api/targets — create or replace the org's active target
export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("org_id, role").eq("id", user.id).single();
  if (!profile?.org_id) return NextResponse.json({ error: "No organisation found" }, { status: 404 });

  const body = await request.json();
  const {
    annual_carbon_cap_kg,
    yearly_reduction_rate,
    net_zero_target_year,
    baseline_year,
    sbti_pathway,
    notes,
  } = body;

  if (annual_carbon_cap_kg == null || yearly_reduction_rate == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Deactivate all existing targets for this org
  await supabase
    .from("targets")
    .update({ is_active: false })
    .eq("org_id", profile.org_id);

  const { data, error } = await supabase
    .from("targets")
    .insert({
      org_id: profile.org_id,
      created_by: user.id,
      annual_carbon_cap_kg: Math.round(annual_carbon_cap_kg),
      yearly_reduction_rate: Number(yearly_reduction_rate),
      net_zero_target_year: net_zero_target_year ?? null,
      baseline_year: baseline_year ?? new Date().getFullYear(),
      sbti_pathway: sbti_pathway ?? "1.5c",
      notes: notes ?? null,
      is_active: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ target: data }, { status: 201 });
}

// PATCH /api/targets?id=<uuid> — partial update of an existing target
export async function PATCH(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("org_id").eq("id", user.id).single();
  if (!profile?.org_id) return NextResponse.json({ error: "No organisation found" }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const targetId = searchParams.get("id");
  if (!targetId) return NextResponse.json({ error: "Missing target id" }, { status: 400 });

  const body = await request.json();

  const { data, error } = await supabase
    .from("targets")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", targetId)
    .eq("org_id", profile.org_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ target: data });
}
