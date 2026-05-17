import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  // Get current user's profile to find their org
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, role")
    .eq("id", user.id)
    .single();

  if (!profile?.org_id) {
    return NextResponse.json({ error: "No organisation found" }, { status: 404 });
  }

  if (profile.role !== "admin" && profile.role !== "owner") {
    console.warn("DEBUG API: Access denied for role:", profile.role);
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  console.log("DEBUG API: Fetching requests for Org:", profile.org_id);

  // Fetch pending requests for this org
  // We need to join with auth.users or profiles to get user info, but since we can't easily join auth.users in standard client
  // we'll assume the user has a profile record (even if no org_id yet) or we'll just get the IDs and fetch profiles.
  // Actually, let's just get the user_id and then fetch names.
  
  const { data: requests, error } = await supabase
    .from("access_requests")
    .select(`
      id,
      user_id,
      status,
      created_at
    `)
    .eq("org_id", profile.org_id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich with user names from profiles
  if (requests && requests.length > 0) {
    const userIds = requests.map(r => r.user_id);
    const { data: userProfiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds);

    const requestsWithUser = requests.map(r => {
      const u = userProfiles?.find(up => up.id === r.user_id);
      return {
        ...r,
        full_name: u?.full_name ?? "Unknown User",
        email: u?.email ?? "Unknown Email",
      };
    });
    return NextResponse.json({ requests: requestsWithUser });
  }

  return NextResponse.json({ requests: [] });
}
