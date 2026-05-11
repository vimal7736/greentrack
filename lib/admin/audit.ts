import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Log an admin action to the admin_audit_log table.
 * This is a best-effort log — failures are silently caught so the
 * primary action always completes.
 */
export async function logAdminAction(
  admin: SupabaseClient,
  params: {
    adminId: string;
    action: string;
    targetType: "organisation" | "user" | "subscription";
    targetId: string;
    metadata?: Record<string, unknown>;
  }
) {
  try {
    await admin.from("admin_audit_log").insert({
      admin_id: params.adminId,
      action: params.action,
      target_type: params.targetType,
      target_id: params.targetId,
      metadata: params.metadata ?? {},
    });
  } catch {
    // Best-effort logging — don't fail the primary operation
    console.error("[audit] Failed to log admin action:", params.action);
  }
}
