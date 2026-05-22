import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM    = process.env.SMTP_FROM    ?? '"GreenTrack AI" <noreply@greentrackai.com>';
const SUPPORT = process.env.CONTACT_EMAIL ?? "support@greentrack.ai";

export async function POST(request: Request) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { topic, message } = await request.json();
  if (!topic || !message) {
    return NextResponse.json({ error: "Missing topic or message" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, organisations(name, tier)")
    .eq("id", user.id)
    .single();

  const userName = profile?.full_name ?? user.email ?? "Unknown";
  const role     = profile?.role ?? "member";
  const org      = (profile?.organisations as unknown as { name: string; tier: string } | null);
  const orgName  = org?.name ?? "—";
  const orgTier  = org?.tier ?? "free";
  const tierLabel = orgTier.charAt(0).toUpperCase() + orgTier.slice(1);
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

  // ── Determine priority from topic ──────────────────────────────────────────
  let priority: "low" | "medium" | "high" | "urgent" = "medium";
  const topicLower = topic.toLowerCase();
  if (topicLower.includes("bug") || topicLower.includes("secr")) priority = "high";
  else if (topicLower.includes("billing") || topicLower.includes("subscription")) priority = "high";
  else if (topicLower.includes("feedback") || topicLower.includes("general")) priority = "low";

  // ── Save ticket to Supabase ────────────────────────────────────────────────
  const { data: ticket, error: dbError } = await supabase
    .from("support_tickets")
    .insert({
      user_id: user.id,
      user_name: userName,
      user_email: user.email ?? "—",
      org_name: orgName,
      org_tier: orgTier,
      topic,
      message,
      status: "open",
      priority,
    })
    .select("id")
    .single();

  if (dbError) {
    console.error("Failed to save support ticket:", dbError);
    // Continue to send email even if DB insert fails
  }

  const ticketId = ticket?.id ? `#${ticket.id.slice(0, 8).toUpperCase()}` : "";

  try {
    await transporter.sendMail({
      from: FROM,
      to: SUPPORT,
      replyTo: `"${userName}" <${user.email}>`,
      subject: `[Support] ${ticketId ? ticketId + " — " : ""}${topic} — ${userName} (${orgName})`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
          <div style="background:#14532d;padding:24px 32px;border-radius:12px 12px 0 0">
            <h1 style="color:#fff;margin:0;font-size:18px">In-App Support Request — GreenTrack AI</h1>
          </div>
          <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
            <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px">
              ${[
                ["Ticket",       ticketId || "—"],
                ["Name",         userName],
                ["Email",        user.email ?? "—"],
                ["Role",         roleLabel],
                ["Organisation", orgName],
                ["Plan",         tierLabel],
                ["Topic",        topic],
              ].map(([k, v]) => `
                <tr>
                  <td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:700;width:130px;color:#374151">${k}</td>
                  <td style="padding:8px 12px;border:1px solid #e5e7eb;color:#1a1a1a">${v}</td>
                </tr>`).join("")}
            </table>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px">
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#166534">Message</p>
              <p style="margin:0;font-size:14px;color:#1a1a1a;white-space:pre-wrap;line-height:1.6">${message}</p>
            </div>
            <p style="margin-top:24px;font-size:12px;color:#6b7280">
              Reply directly to this email to respond to ${userName}.
            </p>
          </div>
          <p style="text-align:center;color:#9ca3af;font-size:11px;margin-top:16px">
            GreenTrack AI · In-App Support Submission
          </p>
        </div>`,
    });

    return NextResponse.json({ success: true, ticketId: ticket?.id ?? null });
  } catch (err) {
    console.error("Support email failed:", err);
    // If email fails but ticket was saved, still return success
    if (ticket?.id) {
      return NextResponse.json({ success: true, ticketId: ticket.id, emailSent: false });
    }
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
