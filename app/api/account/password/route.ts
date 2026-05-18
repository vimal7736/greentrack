import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { current_password, new_password } = await request.json();

  if (!current_password || !new_password) {
    return NextResponse.json({ error: "Both passwords are required" }, { status: 400 });
  }
  if (new_password.length < 8) {
    return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
  }
  if (current_password === new_password) {
    return NextResponse.json({ error: "New password must differ from the current one" }, { status: 400 });
  }

  // Verify current password by re-authenticating
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email:    user.email!,
    password: current_password,
  });

  if (signInError) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  // Update via admin to avoid requiring a fresh session token
  const admin = createAdminClient();
  const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
    password: new_password,
  });

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
