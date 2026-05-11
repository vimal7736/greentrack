import { requireSuperadmin } from "@/lib/admin/auth";
import { logAdminAction } from "@/lib/admin/audit";
import { NextResponse } from "next/server";

/**
 * POST /api/admin/users/[id]/reset-password
 * Triggers a password reset email for the given user.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireSuperadmin();
  if ("error" in result) return result.error;
  const admin = result.admin;
  const { id } = await params;

  // Get user email
  const { data: authUser } = await admin.auth.admin.getUserById(id);
  if (!authUser?.user?.email) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Generate password reset link
  const { error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: authUser.user.email,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAdminAction(admin, {
    adminId: result.userId,
    action: "password_reset",
    targetType: "user",
    targetId: id,
    metadata: { email: authUser.user.email },
  });

  return NextResponse.json({ success: true });
}
