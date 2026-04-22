import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * DELETE /api/team/[userId]
 * Removes a member from the org (sets org_id to null on their profile).
 * Only admins/owners can do this, and cannot remove themselves.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  if (user.id === userId) {
    return NextResponse.json({ error: "You cannot remove yourself" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, role")
    .eq("id", user.id)
    .single();

  if (!profile?.org_id) {
    return NextResponse.json({ error: "No organisation found" }, { status: 404 });
  }

  if (profile.role !== "admin" && profile.role !== "owner") {
    return NextResponse.json({ error: "Only admins can remove members" }, { status: 403 });
  }

  // Verify the target user is in the same org
  const { data: target } = await supabase
    .from("profiles")
    .select("org_id, role")
    .eq("id", userId)
    .single();

  if (!target || target.org_id !== profile.org_id) {
    return NextResponse.json({ error: "User not found in your organisation" }, { status: 404 });
  }

  if (target.role === "owner") {
    return NextResponse.json({ error: "Cannot remove the organisation owner" }, { status: 403 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ org_id: null })
    .eq("id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

/**
 * PATCH /api/team/[userId]
 * Updates a member's role. Body: { role: "admin" | "member" }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
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

  if (profile.role !== "admin" && profile.role !== "owner") {
    return NextResponse.json({ error: "Only admins can change roles" }, { status: 403 });
  }

  const { role } = await request.json();
  if (!["admin", "member"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId)
    .eq("org_id", profile.org_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
