# 📓 Comprehensive Supplementary Guide - GreenTrack AI

This document covers all remaining technical and business information not found in the previous manuals. It includes external integrations, environmental configurations, and the "Math" behind your platform.

---

## 1. External API Ecosystem

### 💳 Stripe Integration (Payments)
- **Checkout Flow**: Handled in `api/billing/checkout/route.ts`. It redirects the user to a secure Stripe-hosted page.
- **Webhook Logic**: Located in `api/webhooks/stripe/route.ts`.
    - **Security**: It uses `stripe.webhooks.constructEvent` with a secret signature to ensure only Stripe can trigger these updates.
    - **Logic**: It reacts to `checkout.session.completed` to instantly bump a free organisation to "Starter" or "Business" without human intervention.
- **Portal**: The "Manage Billing" button in the Sidebar uses `api/billing/portal/route.ts` to generate a direct link for users to update their cards.

### 📄 Mindee OCR (Bill Extraction)
- **Engine**: The app uses the **Mindee API** for document intelligence.
- **Process**: When a user uploads a PDF in `/upload`, the server sends the image buffer to Mindee. 
- **The Intelligence**: Mindee returns a "JSON Prediction." The app parses this to find the `usage` (number) and `usage_unit` (e.g., kWh) automatically so the user doesn't have to type it manually.

---

## 2. The Calculation Math (Business Logic)

GreenTrack uses a **Linear Emission Model** for carbon estimation.

### **The Formula**
Every bill is calculated at the moment of ingestion using this logic:
$$CO_2\text{ (kg)} = \text{Usage Amount} \times \text{Emission Factor}$$

### **Example Data**
*   **Electricity**: Factor ~0.193 (UK Grid Avg). 1,000 kWh = **193 kg CO2e**.
*   **Natural Gas**: Factor ~0.183. 1,000 kWh = **183 kg CO2e**.
*   **Miles Comparison**: The "Real-World Equivalent" card on the Dashboard uses a baseline of **0.255 kg CO2e per Mile** (averaging a mid-sized UK diesel car).

---

## 3. Environment Variable Guide (`.env.local`)

| Variable | Source | Purpose |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard | The address of your database/auth server. |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard | **Critical Secret**. Used by Server Actions to bypass security. **Never leak this.** |
| `MINDEE_API_KEY` | Mindee Dashboard | Required for the "Upload Bill" page to work. |
| `STRIPE_WEBHOOK_SECRET` | Stripe CLI/Dashboard | Validates that payment notifications are real. |
| `RESEND_API_KEY` | Resend.com | Used to send "Invitation" and "Password Reset" emails. |

---

## 4. Deployment & Production Readiness

Before you move this project from `localhost` to a live server (Vercel/Netlify), you must perform these steps:

1.  **Enable RLS Policies**: Go to your Supabase Dashboard and ensure every table has Row Level Security enabled.
2.  **Add Production Domains**: Add your live URL (e.g., `app.greentrack.ai`) to the "Redirect URLs" in Supabase Auth settings.
3.  **Sync Secrets**: Copy all values from `.env.local` into the Deployment platform's Environment Variable settings.
4.  **Connect Stripe Webhook**: You must provide Stripe with your live webhook URL: `https://your-domain.com/api/webhooks/stripe`.

---

## 5. Developer "Gotchas" & Troubleshooting
- **Local Dev Loop**: If redirects are looping, check your **Middleware (`proxy.ts`)**. This usually happens if the Auth cookie name doesn't match between the server and the client.
- **OCR Failure**: If OCR isn't extracting usage correctly, it's usually because the bill PDF has a complex layout Mindee doesn't recognize. We handle this with a fallback "Manual Entry" form.
- **Chart Empty**: If charts don't show, verify your `bill_date` format. It must be `YYYY-MM-DD` for the aggregator logic to group it correctly by month.
