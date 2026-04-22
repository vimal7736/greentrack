import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Supabase calls this URL after:
 * - Email verification (signup)
 * - Team invite link click
 * We exchange the code for a session, then redirect to dashboard.
 *
 * For invited users, the invite metadata contains org_id — we assign it.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // If the user was invited, their auth metadata has an org_id
      const inviteOrgId = data.user.user_metadata?.org_id as string | undefined;

      if (inviteOrgId) {
        // Assign the invited user to the org (their profile was created by the DB trigger)
        await supabase
          .from("profiles")
          .update({ org_id: inviteOrgId })
          .eq("id", data.user.id)
          .is("org_id", null); // only set if not already assigned
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=invalid_link`);
}
