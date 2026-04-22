import { createClient } from "@supabase/supabase-js";

/**
 * Admin client using the service role key.
 * Only use in API routes — never expose to the browser.
 * Required for: inviting users, reading all profiles, GDPR deletion.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
