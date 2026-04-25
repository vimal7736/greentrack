import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const user = data.user;
      const inviteOrgId = user.user_metadata?.org_id as string | undefined;

      if (inviteOrgId) {
        // Invited user — link their auto-created profile to the existing org
        await supabase
          .from("profiles")
          .update({ org_id: inviteOrgId })
          .eq("id", user.id)
          .is("org_id", null);
      } else {
        // New signup — check if org already exists (avoid duplicates on re-click)
        const { data: profile } = await supabase
          .from("profiles")
          .select("org_id")
          .eq("id", user.id)
          .single();

        if (!profile?.org_id) {
          const companyName =
            (user.user_metadata?.company_name as string) || "My Organisation";

          const { data: org } = await supabase
            .from("organisations")
            .insert({ name: companyName, tier: "free", seats_limit: 1 })
            .select("id")
            .single();

          if (org) {
            await supabase
              .from("profiles")
              .update({ org_id: org.id })
              .eq("id", user.id);
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=invalid_link`);
}
