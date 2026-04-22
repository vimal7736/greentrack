# GreenTrack AI — Full Project Handoff Prompt
# Copy this entire file and give it to your AI assistant to continue the project.

---

## WHAT IS THIS PROJECT

GreenTrack AI is a SaaS web app for UK Small & Medium Businesses (SMEs).

**Core flow:**
User signs up → uploads PDF utility bill (electricity/gas/water/fuel) → AI (Mindee OCR) reads the bill → official 2025 UK DEFRA emission factors are applied → carbon footprint is calculated → shown on dashboard → professional SECR-compliant PDF report is generated.

**Client:** Suhail (founder of GreenTrack AI)
**Developer:** Rizan
**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase · Stripe · Mindee OCR · Resend · Vercel

---

## IMPORTANT: NEXT.JS VERSION NOTES

This project uses **Next.js 16.2.4** with **React 19** and **Tailwind CSS v4**.

Key differences from older Next.js versions:
- CSS uses `@import "tailwindcss"` (not `@tailwind base/components/utilities`)
- `@theme inline` block is required in globals.css for Tailwind v4
- React 19 uses `action={asyncFunction}` on forms instead of `onSubmit` — no `e.preventDefault()` needed
- `React.FormEvent` is deprecated — use form `action` prop or `React.FormEvent<HTMLFormElement>`
- Supabase SSR uses `@supabase/ssr` package (not `@supabase/auth-helpers-nextjs`)
- `cookies()` from `next/headers` is async — must `await cookies()`

---

## TECH STACK

| Layer | Tool | Version |
|-------|------|---------|
| Framework | Next.js | 16.2.4 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | v4 |
| Icons | lucide-react | 1.8.0 |
| Charts | Recharts | 3.8.1 |
| Database + Auth | Supabase | @supabase/supabase-js + @supabase/ssr |
| Payments | Stripe | (not installed yet) |
| OCR | Mindee | (not installed yet) |
| Email | Resend | (not installed yet) |
| PDF Generation | @react-pdf/renderer | (not installed yet — NOTE: causes build error if installed wrong, use carefully) |

**Already installed:**
```
npm install @supabase/supabase-js @supabase/ssr
```

**Still needs to be installed:**
```
npm install stripe @stripe/stripe-js
npm install resend
npm install mindee
```

---

## FOLDER STRUCTURE (current state)

```
greentrack/
├── app/
│   ├── api/
│   │   ├── auth/callback/route.ts        ✅ DONE — Supabase email verification
│   │   ├── bills/
│   │   │   ├── upload/route.ts           ✅ DONE — Upload PDF to Supabase Storage
│   │   │   ├── ocr/route.ts              ✅ DONE — Mindee OCR extraction
│   │   │   └── save/route.ts             ✅ DONE — CO2 calculation + DB save
│   │   └── dashboard/route.ts            ✅ DONE — Aggregated stats for dashboard
│   │
│   ├── admin/
│   │   ├── layout.tsx                    ✅ DONE (mock data — needs real API)
│   │   └── page.tsx                      ✅ DONE (mock data — needs real API)
│   │
│   ├── billing/
│   │   ├── layout.tsx                    ✅ DONE (mock data — needs Stripe)
│   │   └── page.tsx                      ✅ DONE (mock data — needs Stripe)
│   │
│   ├── dashboard/
│   │   ├── layout.tsx                    ✅ DONE
│   │   └── page.tsx                      ⚠️ STILL USES MOCK DATA — needs to call /api/dashboard
│   │
│   ├── history/
│   │   ├── layout.tsx                    ✅ DONE
│   │   └── page.tsx                      ⚠️ STILL USES MOCK DATA — needs /api/bills route
│   │
│   ├── reports/
│   │   ├── layout.tsx                    ✅ DONE
│   │   └── page.tsx                      ⚠️ STILL USES MOCK DATA — needs /api/reports
│   │
│   ├── team/
│   │   ├── layout.tsx                    ✅ DONE
│   │   └── page.tsx                      ⚠️ STILL USES MOCK DATA — needs /api/team
│   │
│   ├── upload/
│   │   ├── layout.tsx                    ✅ DONE
│   │   └── page.tsx                      ⚠️ STILL USES MOCK DATA — needs to call real API routes
│   │
│   ├── login/page.tsx                    ✅ DONE — Real Supabase auth (signInWithPassword)
│   ├── signup/page.tsx                   ✅ DONE — Real Supabase auth (signUp)
│   ├── layout.tsx                        ✅ DONE
│   ├── page.tsx                          ✅ DONE — redirects to /login
│   ├── globals.css                       ✅ DONE
│   └── mock-data.ts                      ✅ EXISTS — used by pages not yet converted
│
├── components/
│   └── Sidebar.tsx                       ✅ DONE (uses mock data for user/org name)
│
├── lib/
│   └── supabase/
│       ├── client.ts                     ✅ DONE — browser Supabase client
│       └── server.ts                     ✅ DONE — server Supabase client
│
├── types/
│   └── index.ts                          ✅ DONE — all TypeScript types
│
├── middleware.ts                         ✅ DONE — auth protection + session refresh
├── .env.local                            ✅ DONE (template — needs real keys filled in)
├── next.config.ts                        ✅ DONE
└── README.md                             ✅ DONE
```

---

## ENVIRONMENT VARIABLES

The `.env.local` file exists with placeholder values. Fill in real values:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

MINDEE_API_KEY=your_mindee_api_key

STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_BUSINESS_PRICE_ID=price_...

RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@greentrack.ai

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## DATABASE SCHEMA

Run these SQL scripts in Supabase SQL editor in this exact order.
**IMPORTANT: Supabase project MUST be in eu-west-2 (London) region for UK GDPR compliance.**

```sql
-- 1. Organisations
CREATE TABLE organisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'starter', 'business')),
  stripe_customer_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member', 'super_admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Bills
CREATE TABLE bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES profiles(id),
  bill_type TEXT NOT NULL CHECK (bill_type IN ('electricity', 'gas', 'water', 'fuel_diesel', 'fuel_petrol')),
  bill_date DATE NOT NULL,
  usage_amount NUMERIC NOT NULL,
  usage_unit TEXT NOT NULL,
  co2_kg NUMERIC NOT NULL,
  cost_gbp NUMERIC,
  supplier TEXT,
  account_number TEXT,
  pdf_url TEXT,
  ocr_raw JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Emission Factors (admin-editable, stores official DEFRA values)
CREATE TABLE emission_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fuel_type TEXT NOT NULL,
  unit TEXT NOT NULL,
  kg_co2e_per_unit NUMERIC NOT NULL,
  scope INTEGER NOT NULL CHECK (scope IN (1, 2, 3)),
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  source TEXT DEFAULT 'DEFRA 2025',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SEED: 2025 DEFRA Emission Factors (these are non-negotiable official values)
INSERT INTO emission_factors (fuel_type, unit, kg_co2e_per_unit, scope, valid_from, valid_to) VALUES
('electricity', 'kWh',   0.177, 2, '2025-01-01', '2025-12-31'),
('gas',         'kWh',   0.182, 1, '2025-01-01', '2025-12-31'),
('gas',         'm3',    2.066, 1, '2025-01-01', '2025-12-31'),
('fuel_diesel', 'litre', 2.571, 1, '2025-01-01', '2025-12-31'),
('fuel_petrol', 'litre', 2.31,  1, '2025-01-01', '2025-12-31');

-- 5. Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  status TEXT NOT NULL DEFAULT 'inactive',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Invitations (for team members)
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::TEXT,
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Row Level Security (MANDATORY — UK GDPR)
ALTER TABLE organisations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills           ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations     ENABLE ROW LEVEL SECURITY;

-- Policies: users only see their own org's data
CREATE POLICY "org_isolation_bills" ON bills
  USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "org_isolation_profiles" ON profiles
  USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "org_isolation_subs" ON subscriptions
  USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- 8. Auto-create profile after signup (Supabase function)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Create a new organisation for this user
  INSERT INTO organisations (name)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'company_name', 'My Organisation'))
  RETURNING id INTO new_org_id;

  -- Create their profile linked to the org, as owner
  INSERT INTO profiles (id, org_id, full_name, role)
  VALUES (
    NEW.id,
    new_org_id,
    NEW.raw_user_meta_data->>'full_name',
    'owner'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: fires after every new user is created in auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## WHAT IS ALREADY BUILT (DO NOT REBUILD)

### Foundation — COMPLETE
- `lib/supabase/client.ts` — Supabase browser client
- `lib/supabase/server.ts` — Supabase server client (async cookies)
- `middleware.ts` — Protects all routes, refreshes session, redirects unauthenticated users
- `types/index.ts` — All TypeScript types (Organisation, Profile, Bill, EmissionFactor, etc.)
- `.env.local` — Template with all required environment variable keys

### Auth Pages — COMPLETE (real Supabase auth)
- `app/login/page.tsx` — Real login with `supabase.auth.signInWithPassword()`
- `app/signup/page.tsx` — Real signup with `supabase.auth.signUp()`, shows email verification step
- `app/api/auth/callback/route.ts` — Handles Supabase email verification redirect

### API Routes — COMPLETE
- `app/api/dashboard/route.ts` — GET, returns aggregated CO2 stats, monthly chart, recent bills
- `app/api/bills/upload/route.ts` — POST, uploads PDF to Supabase Storage, enforces tier limits
- `app/api/bills/ocr/route.ts` — POST, calls Mindee API, extracts usage from PDF
- `app/api/bills/save/route.ts` — POST, looks up DEFRA factor by bill date, calculates CO2, saves bill

### UI Pages (all use mock data currently — need to be connected to real APIs)
- `app/dashboard/page.tsx` — Dashboard with CO2 cards, area chart, scope breakdown
- `app/upload/page.tsx` — 4-step upload flow (Upload → Processing → Review → Result)
- `app/history/page.tsx` — Bill history table with search, filter, pagination
- `app/reports/page.tsx` — PDF report preview, YoY chart, industry benchmark
- `app/team/page.tsx` — Team member management, invite form
- `app/billing/page.tsx` — Subscription tiers, payment method, invoice history
- `app/admin/page.tsx` — Super admin: KPI overview, org management, emission factors editor
- `components/Sidebar.tsx` — Navigation sidebar with all links

---

## WHAT STILL NEEDS TO BE BUILT

Work through these in order. Each section depends on the previous.

---

### TASK 1: Connect Dashboard to Real API
**File:** `app/dashboard/page.tsx`

Convert from mock data to real data. This page should be a **Server Component** (remove "use client").

Replace `import { mockBills, mockMonthlyData } from "@/app/mock-data"` with a fetch call:

```typescript
// In the Server Component:
const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/dashboard`, {
  cache: "no-store", // always fresh data
});
const data = await res.json();
// Use data.total_co2_kg, data.monthly_chart, data.recent_bills etc.
```

The Recharts components must stay in a separate "use client" component file since charts need the browser.
Create `app/dashboard/DashboardCharts.tsx` as a client component for the charts only.

---

### TASK 2: Connect Upload Page to Real API
**File:** `app/upload/page.tsx`

Replace the mock OCR result and fake processing with real API calls.

The 4-stage flow should call:

**Stage: Upload → Processing**
```typescript
// 1. Upload file
const formData = new FormData();
formData.append("file", selectedFile);
formData.append("bill_type", billType);
const uploadRes = await fetch("/api/bills/upload", { method: "POST", body: formData });
const { storagePath, signedUrl } = await uploadRes.json();

// 2. Run OCR
const ocrRes = await fetch("/api/bills/ocr", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ signedUrl, billType }),
});
const ocrData = await ocrRes.json();
// ocrData has: supplier, usage, unit, amount_due, bill_period, account_number
```

**Stage: Review → Result (on Calculate click)**
```typescript
// 3. Save bill + calculate CO2
const saveRes = await fetch("/api/bills/save", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    bill_type: billType,
    bill_date: selectedDate,
    usage_amount: usage,  // user-editable
    usage_unit: unit,
    supplier: ocrData.supplier,
    cost_gbp: ocrData.amount_due,
    pdf_url: storagePath,
    ocr_raw: ocrData.raw,
  }),
});
const result = await saveRes.json();
// result has: co2_kg, factor_used, scope, equivalents
```

---

### TASK 3: Connect History Page to Real API
**File:** `app/history/page.tsx`

Build the API route first, then connect the page.

**Build:** `app/api/bills/route.ts`
```typescript
// GET /api/bills?page=1&filter=all&search=
// Returns paginated bills for the logged-in org
// Support: filter by bill_type, search by supplier/date, page/limit
```

Then update `app/history/page.tsx`:
- Make it a Server Component
- Fetch from `/api/bills?page=1&filter=all`
- Pass data as props to a client component for the interactive filter/search

---

### TASK 4: Build Stripe Billing
**Install first:** `npm install stripe @stripe/stripe-js`

**Build these API routes:**

`app/api/billing/checkout/route.ts`
```typescript
// POST — creates a Stripe Checkout Session
// Body: { priceId } (STRIPE_STARTER_PRICE_ID or STRIPE_BUSINESS_PRICE_ID)
// Returns: { url } — redirect user to this Stripe-hosted page
// After payment: Stripe redirects to /dashboard?success=true
```

`app/api/billing/cancel/route.ts`
```typescript
// POST — cancels the active Stripe subscription
// Updates subscriptions table status to 'canceled'
// Downgrades org.tier to 'free'
```

`app/api/webhooks/stripe/route.ts` — CRITICAL
```typescript
// POST — receives all Stripe webhook events
// MUST verify webhook signature using STRIPE_WEBHOOK_SECRET
// Handle these 4 events:
// 1. checkout.session.completed → set org.tier, save subscription
// 2. customer.subscription.updated → update tier if plan changed
// 3. customer.subscription.deleted → downgrade to 'free'
// 4. invoice.payment_failed → send warning email via Resend
//
// IMPORTANT: use raw body for signature verification
// export const config = { api: { bodyParser: false } }  ← for Pages Router
// In App Router: read raw body with request.text() before parsing
```

Then update `app/billing/page.tsx`:
- Read current plan from Supabase `subscriptions` table
- Upgrade button → calls `/api/billing/checkout` → redirects to Stripe
- Invoice history → fetch from Stripe API: `stripe.invoices.list({ customer: stripeCustomerId })`

---

### TASK 5: Build Team Management
**File:** `app/team/page.tsx` + new API routes

**Build these API routes:**

`app/api/team/route.ts`
```typescript
// GET — returns all profiles in the logged-in user's org
// POST — sends team invite
//   Body: { email, role }
//   Logic: insert into invitations table, send invite email via Resend
```

`app/api/team/accept/route.ts`
```typescript
// GET /api/team/accept?token=xxx
// Validates the invitation token (check not expired, not already accepted)
// Creates a new profile for the invited user in the same org
// Updates invitations.accepted_at
```

`app/api/team/[userId]/route.ts`
```typescript
// DELETE — removes a member from the org
// Only owners can do this
// Cannot delete yourself
```

Install Resend: `npm install resend`

Create `lib/email.ts`:
```typescript
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendInviteEmail(to: string, orgName: string, token: string) {
  const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/team/accept?token=${token}`;
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to,
    subject: `You've been invited to ${orgName} on GreenTrack AI`,
    html: `<p>Click <a href="${acceptUrl}">here</a> to join ${orgName}.</p>`,
  });
}
```

Then update `app/team/page.tsx` to use real API calls.

---

### TASK 6: Build Reports + PDF
**File:** `app/reports/page.tsx` + new API routes

**Build these API routes:**

`app/api/reports/summary/route.ts`
```typescript
// GET — returns full report data for the logged-in org
// Includes: all bills grouped by scope, YoY comparison, total energy, intensity ratio
```

`app/api/reports/generate/route.ts`
```typescript
// POST — generates a PDF using @react-pdf/renderer and streams it
// IMPORTANT: @react-pdf/renderer must be used server-side only
// Use dynamic import: const { renderToBuffer } = await import("@react-pdf/renderer")
// Return as: new Response(buffer, { headers: { "Content-Type": "application/pdf" } })
```

`app/api/reports/email/route.ts`
```typescript
// POST — generates PDF and sends it as email attachment via Resend
```

`app/api/benchmarks/route.ts`
```typescript
// GET /api/benchmarks?sector=retail
// Returns anonymous industry comparison (only if 5+ orgs in sector)
// Uses PERCENTILE_CONT SQL function in Supabase
```

**Note on react-pdf:** Do NOT install `react-pdf` (browser package). Install `@react-pdf/renderer` (server renderer). It conflicts with Next.js if imported on the client side. Always use dynamic import inside API routes.

---

### TASK 7: Build Admin Panel API
**File:** `app/admin/page.tsx` + new API routes

All admin routes MUST check `role === 'super_admin'` before doing anything.

`app/api/admin/stats/route.ts`
```typescript
// GET — KPI overview
// Returns: total_orgs, total_users, mrr (from Stripe), bills_today, ocr_error_rate
// MRR: fetch from Stripe API active subscriptions
```

`app/api/admin/orgs/route.ts`
```typescript
// GET — list all organisations with user count, bill count, tier
// PATCH /:id — suspend/unsuspend org { status: 'suspended' | 'active' }
```

`app/api/admin/factors/[id]/route.ts`
```typescript
// PATCH — update an emission factor value
// Body: { kg_co2e_per_unit: number }
// Only super_admin can do this
```

---

### TASK 8: GDPR Account Deletion
`app/api/account/delete/route.ts`
```typescript
// DELETE — GDPR right to erasure
// 1. Anonymise personal data in profiles table (name → "Deleted User", etc.)
// 2. Cancel active Stripe subscription
// 3. Delete files from Supabase Storage (bills bucket)
// 4. Delete auth user: supabase.auth.admin.deleteUser(userId) — needs SERVICE_ROLE_KEY
// 5. Keep bills records but set uploaded_by = null (for aggregate stats)
```

---

### TASK 9: Connect Sidebar to Real User Data
**File:** `components/Sidebar.tsx`

Currently uses `mockUser` and `mockOrg`. Replace with real data.

Make the layout files Server Components that fetch the user profile:
```typescript
// In app/dashboard/layout.tsx (Server Component):
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
const { data: profile } = await supabase
  .from("profiles")
  .select("*, organisations(*)")
  .eq("id", user.id)
  .single();
// Pass profile + org as props to Sidebar
```

Update Sidebar to accept `profile` and `org` as props instead of importing mock data.

---

### TASK 10: Add Privacy and Terms Pages
`app/privacy/page.tsx` — UK GDPR Privacy Policy (Server Component, static content)
`app/terms/page.tsx` — Terms of Service (Server Component, static content)

---

### TASK 11: Cookie Consent Banner (PECR — UK Law)
```
npm install react-cookie-consent
```

Add to `app/layout.tsx` as a client component. Only load analytics/tracking after consent.

---

### TASK 12: CSV Export (Business Tier Only)
`app/api/bills/export/route.ts`
```typescript
// GET — streams CSV of all bills for the org
// Check tier === 'business' first
// Map bill records to CSV columns matching SECR report fields
// Return as: new Response(csvString, { headers: { "Content-Type": "text/csv" } })
```

---

## CODING RULES (follow strictly)

1. **App Router only** — no Pages Router
2. **Server Components by default** — only add "use client" when you need useState/useEffect/browser APIs
3. **TypeScript strict** — use types from `types/index.ts`, no `any`
4. **Supabase client rules:**
   - Browser/client components → `import { createClient } from "@/lib/supabase/client"`
   - Server components/API routes → `import { createClient } from "@/lib/supabase/server"` (async)
5. **Auth on every API route** — always check `supabase.auth.getUser()` first, return 401 if no user
6. **Emission factors NEVER hardcoded** — always query from `emission_factors` table using bill date
7. **Tier enforcement** — always check org tier before allowing uploads, PDF, CSV, team features
8. **RLS is active** — Supabase will block cross-org data access automatically, but still filter by org_id for performance
9. **No mock data imports in production code** — `mock-data.ts` is only for reference

---

## SUPABASE STORAGE SETUP

After creating the Supabase project:
1. Go to Storage → Create bucket named `bills`
2. Set bucket to **Private** (not public)
3. Add RLS policy:
```sql
-- Only allow users to access files in their own org's folder
CREATE POLICY "org_folder_access" ON storage.objects
  FOR ALL USING (
    bucket_id = 'bills' AND
    (storage.foldername(name))[1] = (
      SELECT org_id::TEXT FROM profiles WHERE id = auth.uid()
    )
  );
```

---

## SUBSCRIPTION TIERS — ENFORCEMENT RULES

| Feature | Free | Starter | Business |
|---------|------|---------|---------|
| Bill types | electricity only | all types | all types |
| Bills per month | max 3 | unlimited | unlimited |
| PDF reports | blocked | allowed | allowed (branded) |
| CSV export | blocked | blocked | allowed |
| Team seats | 1 | 1 | up to 5 |
| History | limited | 12 months | 12 months |

Enforcement happens in API routes (server-side), never just on the frontend.

---

## 2025 DEFRA EMISSION FACTORS (non-negotiable official values)

These are seeded into the database. Never hardcode these in application logic.

| Fuel | Unit | kgCO₂e | Scope |
|------|------|--------|-------|
| electricity | kWh | 0.177 | 2 |
| gas | kWh | 0.182 | 1 |
| gas | m3 | 2.066 | 1 |
| fuel_diesel | litre | 2.571 | 1 |
| fuel_petrol | litre | 2.310 | 1 |

CO2 calculation: `co2_kg = usage_amount × kg_co2e_per_unit`

---

## CLIENT RULES

1. Work on **staging environment only** — never production database
2. Use **fake test data** — never real customer bills
3. GitHub repo is in **client's name** — push to client's repo
4. Client handles **all Vercel production deployments**
5. All API keys are provided by client
6. NDA + DPA + UK IDTA must be signed before starting

---

## PRIORITY ORDER (build in this sequence)

1. Set up Supabase project (London region) + run SQL migrations
2. Fill in `.env.local` with real staging keys
3. Task 1: Connect Dashboard to real API
4. Task 2: Connect Upload to real API (most critical feature)
5. Task 3: Connect History to real API
6. Task 9: Connect Sidebar to real user data
7. Task 4: Stripe billing
8. Task 5: Team management
9. Task 6: Reports + PDF
10. Task 7: Admin panel
11. Task 8: GDPR deletion
12. Task 10-12: Privacy page, Terms page, Cookie banner, CSV export

---

*This is a complete handoff document. All foundation files are built. Start from the Priority Order above.*
