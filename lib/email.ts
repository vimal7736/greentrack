import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_PORT === "465", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.SMTP_FROM ?? '"GreenTrack AI" <noreply@greentrackai.com>';

const BILL_TYPE_LABELS: Record<string, string> = {
  electricity: "Electricity",
  gas: "Gas",
  water: "Water",
  fuel_diesel: "Diesel",
  fuel_petrol: "Petrol",
};

export async function sendWelcomeEmail({
  to,
  orgName,
  adminName,
}: {
  to: string;
  orgName: string;
  adminName: string;
}) {
  try {
    await transporter.sendMail({
      from: FROM,
      to,
      subject: `Welcome to GreenTrack AI — ${orgName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
          <div style="background:#14532d;padding:24px 32px;border-radius:12px 12px 0 0">
            <h1 style="color:#fff;margin:0;font-size:20px">GreenTrack AI</h1>
          </div>
          <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
            <h2 style="margin:0 0 8px;font-size:18px">Welcome to the platform, ${adminName}! 🎉</h2>
            <p style="color:#6b7280;margin:0 0 24px">
              We're excited to help <strong>${orgName}</strong> start its journey toward carbon transparency.
            </p>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin-bottom:24px">
              <p style="margin:0;font-size:14px;color:#166534">
                <strong>Next Steps:</strong><br />
                • Upload your first utility bill (Electricity, Gas, or Fuel)<br />
                • Invite your team members to collaborate<br />
                • Generate your first SECR-compliant report
              </p>
            </div>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
               style="display:inline-block;background:#16a34a;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
              Go to Dashboard
            </a>
          </div>
          <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:16px">
            GreenTrack AI · Carbon Management for UK Businesses
          </p>
        </div>`,
    });
  } catch (error) {
    console.error("Failed to send welcome email:", error);
  }
}

export async function sendBillProcessedEmail({
  to,
  orgName,
  billType,
  co2Kg,
}: {
  to: string;
  orgName: string;
  billType: string;
  co2Kg: number;
}) {
  const typeLabel = BILL_TYPE_LABELS[billType] ?? billType;
  try {
    await transporter.sendMail({
      from: FROM,
      to,
      subject: `Bill processed — ${co2Kg.toFixed(1)} kg CO₂e | GreenTrack AI`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
          <div style="background:#14532d;padding:24px 32px;border-radius:12px 12px 0 0">
            <h1 style="color:#fff;margin:0;font-size:20px">GreenTrack AI</h1>
          </div>
          <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
            <h2 style="margin:0 0 8px;font-size:18px">Bill processed ✓</h2>
            <p style="color:#6b7280;margin:0 0 24px">Your ${typeLabel} bill has been analysed for <strong>${orgName}</strong>.</p>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin-bottom:24px">
              <p style="margin:0;font-size:14px;color:#166534">
                <strong>CO₂ emissions calculated:</strong> ${co2Kg.toFixed(2)} kg CO₂e
              </p>
            </div>
            <p style="color:#6b7280;font-size:14px;margin:0">
              Log in to view your updated carbon dashboard and cumulative emissions.
            </p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
               style="display:inline-block;margin-top:20px;background:#16a34a;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
              View Dashboard
            </a>
          </div>
          <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:16px">
            GreenTrack AI · Carbon Management for UK Businesses
          </p>
        </div>`,
    });
  } catch (error) {
    console.error("Failed to send bill processed email:", error);
  }
}

export async function sendSubscriptionChangedEmail({
  to,
  orgName,
  newTier,
}: {
  to: string;
  orgName: string;
  newTier: string;
}) {
  const tierLabel = newTier.charAt(0).toUpperCase() + newTier.slice(1);
  const isUpgrade = newTier !== "free";
  try {
    await transporter.sendMail({
      from: FROM,
      to,
      subject: `Your GreenTrack AI plan has been updated — ${tierLabel}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
          <div style="background:#14532d;padding:24px 32px;border-radius:12px 12px 0 0">
            <h1 style="color:#fff;margin:0;font-size:20px">GreenTrack AI</h1>
          </div>
          <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
            <h2 style="margin:0 0 8px;font-size:18px">
              ${isUpgrade ? "Plan upgraded 🎉" : "Plan updated"}
            </h2>
            <p style="color:#6b7280;margin:0 0 24px">
              The subscription for <strong>${orgName}</strong> has been updated to the
              <strong>${tierLabel} plan</strong>.
            </p>
            ${isUpgrade ? `
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin-bottom:24px">
              <p style="margin:0;font-size:14px;color:#166534">
                Your new features and limits are now active. Log in to start using them.
              </p>
            </div>` : `
            <div style="background:#fef9c3;border:1px solid #fde68a;border-radius:8px;padding:16px 20px;margin-bottom:24px">
              <p style="margin:0;font-size:14px;color:#92400e">
                Your plan has been downgraded to Free. Some features may no longer be available.
              </p>
            </div>`}
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/billing"
               style="display:inline-block;background:#16a34a;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
              View Billing
            </a>
          </div>
          <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:16px">
            GreenTrack AI · Carbon Management for UK Businesses
          </p>
        </div>`,
    });
  } catch (error) {
    console.error("Failed to send subscription email:", error);
  }
}

export async function sendAccountDeletedEmail({ to }: { to: string }) {
  try {
    await transporter.sendMail({
      from: FROM,
      to,
      subject: "Your GreenTrack AI account has been deleted",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
          <div style="background:#14532d;padding:24px 32px;border-radius:12px 12px 0 0">
            <h1 style="color:#fff;margin:0;font-size:20px">GreenTrack AI</h1>
          </div>
          <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
            <h2 style="margin:0 0 8px;font-size:18px">Account deleted</h2>
            <p style="color:#6b7280;margin:0 0 24px">
              Your GreenTrack AI account and personal data have been deleted in accordance
              with your request under GDPR Article 17 (Right to Erasure).
            </p>
            <p style="color:#6b7280;font-size:14px;margin:0">
              Aggregated, anonymised emissions data may be retained for reporting purposes
              as permitted under GDPR. No personally identifiable information is retained.
            </p>
            <p style="color:#6b7280;font-size:14px;margin-top:16px">
              If you did not request this deletion, please contact
              <a href="mailto:support@greentrackai.com" style="color:#16a34a">support@greentrackai.com</a>
              immediately.
            </p>
          </div>
          <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:16px">
            GreenTrack AI · Carbon Management for UK Businesses
          </p>
        </div>`,
    });
  } catch (error) {
    console.error("Failed to send account deleted email:", error);
  }
}

export async function sendJoinRequestEmail({
  to,
  orgName,
  userName,
  userEmail,
}: {
  to: string;
  orgName: string;
  userName: string;
  userEmail: string;
}) {
  try {
    await transporter.sendMail({
      from: FROM,
      to,
      subject: `Action Required: New Join Request for ${orgName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
          <div style="background:#14532d;padding:24px 32px;border-radius:12px 12px 0 0">
            <h1 style="color:#fff;margin:0;font-size:20px">GreenTrack AI</h1>
          </div>
          <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
            <h2 style="margin:0 0 8px;font-size:18px">New Join Request ✓</h2>
            <p style="color:#6b7280;margin:0 0 24px">
              <strong>${userName}</strong> (${userEmail}) has requested to join your organisation on GreenTrack AI.
            </p>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin-bottom:24px">
              <p style="margin:0;font-size:14px;color:#166534">
                You can approve or reject this request from your Team Management dashboard.
              </p>
            </div>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/team"
               style="display:inline-block;background:#16a34a;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
              Review Request
            </a>
          </div>
          <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:16px">
            GreenTrack AI · Carbon Management for UK Businesses
          </p>
        </div>`,
    });
  } catch (error) {
    console.error("Failed to send join request email:", error);
  }
}
