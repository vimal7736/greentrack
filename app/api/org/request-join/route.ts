import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendJoinRequestEmail } from "@/lib/email";

export async function POST(request: Request) {
  const { orgId, userId: bodyUserId } = await request.json();
  console.log("DEBUG API: Received Join Request for Org:", orgId, "User:", bodyUserId);
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If no user session, we use the userId passed in the body (from signup result)
  const userId = user?.id || bodyUserId;
  console.log("DEBUG API: Final UserID for request:", userId, "Session User found:", !!user);

  if (!userId) {
    console.error("DEBUG API: No UserID found!");
    return NextResponse.json({ error: "User ID is required" }, { status: 401 });
  }

  if (!orgId) {
    return NextResponse.json({ error: "Organisation ID is required" }, { status: 400 });
  }

  // 1. Fetch organisation name and owner profile
  // We try to get email, but if the column doesn't exist yet, we'll handle the error
  const { data: org, error: orgErr } = await supabase
    .from("organisations")
    .select("name, profiles(id, role, email)")
    .eq("id", orgId)
    .single();

  if (orgErr || !org) {
    console.error("Join Request Error: Org not found", orgErr);
    return NextResponse.json({ error: "Organisation not found" }, { status: 404 });
  }

  // Find the owner
  const owners = (org.profiles as any[]).filter(p => p.role === "owner");
  let ownerEmail = owners[0]?.email;

  // If email is missing in the profile table, we can try to fetch it from auth admin
  if (!ownerEmail && owners[0]?.id) {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    const { data: authUser } = await admin.auth.admin.getUserById(owners[0].id);
    ownerEmail = authUser?.user?.email;
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  // 2. Create a pending join request (using admin client to bypass RLS during signup)
  const { error } = await admin
    .from("access_requests")
    .insert({
      user_id: userId,
      org_id: orgId,
      status: "pending",
    });

  console.log("DEBUG API: Insertion result:", error ? error : "SUCCESS");

  if (error) {
    console.error("Join Request Error: DB Insert failed", error);
    if (error.code === "23505") {
      return NextResponse.json({ error: "You already have a pending request for this organisation" }, { status: 400 });
    }
    if (error.code === "23503") {
      return NextResponse.json({ error: "An account with this email already exists. Please log in first to request access." }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 3. Get user details for email (since we might not have a session user)
  const { data: authUser } = await admin.auth.admin.getUserById(userId);
  const userName = authUser?.user?.user_metadata?.full_name || authUser?.user?.email || "A new user";
  const userEmail = authUser?.user?.email;

  // 4. Send email to owner (non-blocking)
  if (ownerEmail && userEmail) {
    console.log(`Sending join request email to ${ownerEmail}`);
    sendJoinRequestEmail({
      to: ownerEmail,
      orgName: org.name,
      userName: userName,
      userEmail: userEmail,
    });
  } else {
    console.warn("Join Request Warning: No owner email found to notify.");
  }

  return NextResponse.json({ success: true });
}
