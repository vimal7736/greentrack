import { NextResponse } from "next/server";
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
const TO   = process.env.CONTACT_EMAIL ?? "support@greentrack.ai";

export async function POST(request: Request) {
  const { name, email, company, subject, message } = await request.json();

  if (!name || !email || !subject || !message) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    await transporter.sendMail({
      from: FROM,
      to: TO,
      replyTo: `"${name}" <${email}>`,
      subject: `[Contact] ${subject} — ${name}${company ? ` (${company})` : ""}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
          <div style="background:#14532d;padding:24px 32px;border-radius:12px 12px 0 0">
            <h1 style="color:#fff;margin:0;font-size:18px">New Contact Enquiry — GreenTrack AI</h1>
          </div>
          <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
            <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px">
              ${[
                ["Name",    name],
                ["Email",   email],
                ["Company", company || "—"],
                ["Topic",   subject],
              ].map(([k, v]) => `
                <tr>
                  <td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:700;width:100px;color:#374151">${k}</td>
                  <td style="padding:8px 12px;border:1px solid #e5e7eb;color:#1a1a1a">${v}</td>
                </tr>`).join("")}
            </table>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px">
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#166534">Message</p>
              <p style="margin:0;font-size:14px;color:#1a1a1a;white-space:pre-wrap;line-height:1.6">${message}</p>
            </div>
            <p style="margin-top:24px;font-size:12px;color:#6b7280">
              Reply directly to this email to respond to ${name}.
            </p>
          </div>
          <p style="text-align:center;color:#9ca3af;font-size:11px;margin-top:16px">
            GreenTrack AI · Contact Form Submission
          </p>
        </div>`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact email failed:", err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
