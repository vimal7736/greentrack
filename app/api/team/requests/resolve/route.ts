import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { requestId, action } = await request.json(); // action: 'approve' | 'reject'

  if (!requestId || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Get current user's profile to check permissions
  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("org_id, role")
    .eq("id", user.id)
    .single();

  if (adminProfile?.role !== "admin" && adminProfile?.role !== "owner") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Get the request details
  const { data: joinRequest, error: fetchErr } = await supabase
    .from("access_requests")
    .select("*")
    .eq("id", requestId)
    .eq("org_id", adminProfile.org_id)
    .single();

  if (fetchErr || !joinRequest) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  if (action === 'approve') {
    // 1. Update user profile with org_id
    const { error: profileErr } = await adminClient
      .from("profiles")
      .update({ org_id: adminProfile.org_id, role: "member" })
      .eq("id", joinRequest.user_id);

    if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 });

    // 2. Mark request as approved
    await supabase
      .from("access_requests")
      .update({ status: "approved" })
      .eq("id", requestId);

  } else {
    // Mark request as rejected
    await supabase
      .from("access_requests")
      .update({ status: "rejected" })
      .eq("id", requestId);
  }

  return NextResponse.json({ success: true });
}
