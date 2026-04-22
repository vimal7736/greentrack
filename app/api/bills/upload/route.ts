import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/ratelimit";

/**
 * POST /api/bills/upload
 * Accepts a PDF file (FormData), uploads it to Supabase Storage.
 * Returns the storage path and a signed URL for Mindee to read.
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  // Rate limiting
  const { success } = await checkRateLimit("upload", user.id);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded. Please try again in a minute." }, { status: 429 });
  }

  // Get org_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, organisations(tier)")
    .eq("id", user.id)
    .single();

  if (!profile?.org_id) {
    return NextResponse.json({ error: "No organisation found" }, { status: 404 });
  }

  // Parse the uploaded file from FormData
  const formData = await request.formData();
  const file = formData.get("file") as File;
  const billType = formData.get("bill_type") as string;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  // Validate: PDF only, max 10 MB
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF files are accepted" }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File must be under 10 MB" }, { status: 400 });
  }

  // ── Tier enforcement ──────────────────────────────────────────────────────
  const org = (Array.isArray(profile.organisations) ? profile.organisations[0] : profile.organisations) as { tier: string } | null;
  const tier = org?.tier ?? "free";

  if (tier === "free") {
    // Free plan: electricity only
    if (billType !== "electricity") {
      return NextResponse.json(
        { error: "Free plan only supports electricity bills. Upgrade to upload gas, water, or fuel bills." },
        { status: 403 }
      );
    }

    // Free plan: max 3 bills per calendar month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from("bills")
      .select("*", { count: "exact", head: true })
      .eq("org_id", profile.org_id)
      .gte("created_at", startOfMonth.toISOString());

    if ((count ?? 0) >= 3) {
      return NextResponse.json(
        { error: "Free plan limit reached (3 bills/month). Upgrade to continue uploading." },
        { status: 403 }
      );
    }
  }

  // ── Upload to Supabase Storage ────────────────────────────────────────────
  // Store as: bills/{org_id}/{timestamp}_{filename}
  const fileName = `${profile.org_id}/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
  const fileBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("bills")
    .upload(fileName, fileBuffer, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Create a signed URL (valid for 1 hour) so Mindee can read the file
  const { data: signedUrl } = await supabase.storage
    .from("bills")
    .createSignedUrl(fileName, 3600);

  return NextResponse.json({
    storagePath: fileName,
    signedUrl: signedUrl?.signedUrl ?? null,
  });
}
