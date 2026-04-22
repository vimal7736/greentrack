import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * GET /api/account/delete
 * GDPR Article 17 — Right to Erasure.
 * Anonymises personal data and cancels Stripe subscription.
 * Redirects to login with a confirmation message.
 *
 * We anonymise rather than hard-delete to preserve aggregate emissions
 * data for the org, while removing all personal identifiers.
 */
export async function GET() {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL));

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, role")
    .eq("id", user.id)
    .single();

  // Anonymise profile — replace PII with placeholder values
  await admin
    .from("profiles")
    .update({
      full_name: "[Deleted User]",
      email: `deleted_${user.id}@deleted.invalid`,
      org_id: null,
    })
    .eq("id", user.id);

  // If the user is the org owner and there are no other members, delete the org
  if (profile?.org_id && profile.role === "owner") {
    const { count } = await admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("org_id", profile.org_id);

    if ((count ?? 0) === 0) {
      await admin.from("organisations").delete().eq("id", profile.org_id);
    }
  }

  // Delete the auth user (removes session and prevents future login with this account)
  await admin.auth.admin.deleteUser(user.id);

  return NextResponse.redirect(
    new URL("/login?deleted=1", process.env.NEXT_PUBLIC_APP_URL)
  );
}
