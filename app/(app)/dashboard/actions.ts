"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Handles the creation of a new organisation and linking it to the current user.
 * Note: If you get a 'PGRST205' or permission error, ensure you have run the 
 * required SQL in your Supabase Dashboard to create the tables and set up RLS.
 */
export async function createOrganisationAction(formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;

  if (!name || name.trim().length < 2) {
    return { error: "Organisation name must be at least 2 characters long." };
  }

  // 1. Get Current User
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Authentication failed. Please log in again." };
  }

  try {
    // 2. Create Organisation
    const { data: org, error: orgError } = await supabase
      .from("organisations")
      .insert({
        name: name.trim(),
        tier: "free",
      })
      .select()
      .single();

    if (orgError) {
      console.error("Organisation creation error:", orgError);
      return { error: `Database error: ${orgError.message}. Please ensure the tables are created in Supabase.` };
    }

    // 3. Update User Profile
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        org_id: org.id,
        role: "owner",
        full_name: user.user_metadata?.full_name || "New User",
      });

    if (profileError) {
      console.error("Profile update error:", profileError);
      return { error: "Successfully created organisation, but failed to link your profile." };
    }

    // 4. Refresh Dashboard
    revalidatePath("/dashboard", "layout");
    
    return { success: true };
  } catch (err) {
    console.error("Unexpected error:", err);
    return { error: "An unexpected error occurred. Check server logs." };
  }
}
