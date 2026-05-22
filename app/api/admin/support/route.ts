import { NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/admin/auth";
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

const FROM = process.env.SMTP_FROM ?? '"GreenTrack AI" <noreply@greentrackai.com>';

// ── GET: Fetch all tickets with their replies ───────────────────────────────
export async function GET() {
  const auth = await requireSuperadmin();
  if ("error" in auth) return auth.error;

  const { admin } = auth;

  const { data: tickets, error } = await admin
    .from("support_tickets")
    .select("*, ticket_replies(*)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("Failed to fetch tickets:", error);
    return NextResponse.json({ tickets: [], error: error.message });
  }

  // Sort replies within each ticket by created_at ascending
  const sorted = (tickets ?? []).map((t: Record<string, unknown>) => ({
    ...t,
    ticket_replies: Array.isArray(t.ticket_replies)
      ? (t.ticket_replies as Record<string, unknown>[]).sort(
        (a, b) =>
          new Date(a.created_at as string).getTime() - new Date(b.created_at as string).getTime()
      )
      : [],
  }));

  return NextResponse.json({ tickets: sorted });
}

// ── PATCH: Update ticket status or priority ─────────────────────────────────
export async function PATCH(request: Request) {
  const auth = await requireSuperadmin();
  if ("error" in auth) return auth.error;

  const { admin } = auth;

  const body = await request.json();
  const { ticketId, status, priority } = body;

  if (!ticketId) {
    return NextResponse.json({ error: "Missing ticketId" }, { status: 400 });
  }

  const updates: Record<string, string> = {};
  if (status && ["open", "in_progress", "resolved", "closed"].includes(status)) {
    updates.status = status;
  }
  if (priority && ["low", "medium", "high", "urgent"].includes(priority)) {
    updates.priority = priority;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid updates" }, { status: 400 });
  }

  const { data: ticket, error } = await admin
    .from("support_tickets")
    .update(updates)
    .eq("id", ticketId)
    .select("*")
    .single();

  if (error) {
    console.error("Failed to update ticket:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ticket });
}

// ── POST: Send a reply (save to DB + email to user) ─────────────────────────
export async function POST(request: Request) {
  const auth = await requireSuperadmin();
  if ("error" in auth) return auth.error;

  const { admin, userId } = auth;

  const body = await request.json();
  const { ticketId, message } = body;

  if (!ticketId || !message) {
    return NextResponse.json(
      { error: "Missing ticketId or message" },
      { status: 400 }
    );
  }

  // Fetch the ticket
  const { data: ticket, error: ticketErr } = await admin
    .from("support_tickets")
    .select("*")
    .eq("id", ticketId)
    .single();

  if (ticketErr || !ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  // Get admin profile
  const { data: adminProfile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .single();

  const adminName = adminProfile?.full_name ?? "GreenTrack Admin";
  const ticketRef = `#${(ticket.id as string).slice(0, 8).toUpperCase()}`;

  // Save reply to DB
  let emailed = false;
  const { data: reply, error: replyErr } = await admin
    .from("ticket_replies")
    .insert({
      ticket_id: ticketId,
      admin_id: userId,
      admin_name: adminName,
      message,
      emailed: false,
    })
    .select("*")
    .single();

  if (replyErr) {
    console.error("Failed to save reply:", replyErr);
    return NextResponse.json({ error: "Failed to save reply" }, { status: 500 });
  }

  // Send email to user
  try {
    await transporter.sendMail({
      from: FROM,
      to: ticket.user_email,
      subject: `Re: [Support ${ticketRef}] ${ticket.topic} — GreenTrack AI`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
          <div style="background:#14532d;padding:24px 32px;border-radius:12px 12px 0 0">
            <h1 style="color:#fff;margin:0;font-size:18px">Support Reply — GreenTrack AI</h1>
          </div>
          <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
            <p style="margin:0 0 4px;font-size:12px;color:#6b7280">
              Ticket ${ticketRef} · ${ticket.topic}
            </p>
            <h2 style="margin:0 0 20px;font-size:18px;color:#1a1a1a">
              Hi ${ticket.user_name.split(" ")[0]},
            </h2>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin-bottom:20px">
              <p style="margin:0;font-size:14px;color:#1a1a1a;white-space:pre-wrap;line-height:1.7">${message}</p>
            </div>
            <p style="font-size:13px;color:#6b7280;margin:0 0 4px">— ${adminName}</p>
            <p style="font-size:12px;color:#9ca3af;margin:0">GreenTrack AI Support Team</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0 16px" />
            <div style="background:#f9fafb;border-radius:8px;padding:14px 16px">
              <p style="margin:0 0 4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#9ca3af">Your original message</p>
              <p style="margin:0;font-size:13px;color:#6b7280;white-space:pre-wrap;line-height:1.5">${ticket.message}</p>
            </div>
          </div>
          <p style="text-align:center;color:#9ca3af;font-size:11px;margin-top:16px">
            GreenTrack AI · Carbon Management for UK Businesses
          </p>
        </div>`,
    });
    emailed = true;

    // Mark reply as emailed
    await admin
      .from("ticket_replies")
      .update({ emailed: true })
      .eq("id", reply.id);
  } catch (err) {
    console.error("Failed to send reply email:", err);
  }

  // Auto-update ticket status to in_progress if it was open
  if (ticket.status === "open") {
    await admin
      .from("support_tickets")
      .update({ status: "in_progress" })
      .eq("id", ticketId);
  }

  return NextResponse.json({
    reply: { ...reply, emailed },
    emailSent: emailed,
  });
}
