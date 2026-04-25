"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function createOrganisationAction(formData: FormData) {
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();
  const name = formData.get("name") as string;

  if (!name || name.trim().length < 2) {
    return { error: "Organisation name must be at least 2 characters long." };
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Authentication failed. Please log in again." };
  }

  try {
    const { data: org, error: orgError } = await supabaseAdmin
      .from("organisations")
      .insert({ name: name.trim(), tier: "free" })
      .select()
      .single();

    if (orgError) {
      console.error("Organisation creation error:", orgError);
      return { error: `Database error: ${orgError.message}` };
    }

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: user.id,
        org_id: org.id,
        role: "owner",
        full_name: user.user_metadata?.full_name || "New User",
      });

    if (profileError) {
      console.error("Profile update error:", profileError);
      return { error: "Created organisation but failed to link profile." };
    }

    revalidatePath("/dashboard", "layout");
    return { success: true };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { error: "An unexpected error occurred." };
  }
}