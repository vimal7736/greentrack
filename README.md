# GreenTrack AI — Full Project README

Carbon footprint tracking platform for UK Small & Medium Businesses (SMEs).
Built with Next.js 16 · Supabase · Stripe · Mindee OCR · Resend · Vercel

---

## Current State

The UI is fully built with **mock data** across all 9 pages:
Login / Signup / Dashboard / Upload / History / Reports / Team / Billing / Admin

**What's left:** Replace every mock import with real API calls, Supabase database, and third-party services.

---

## Tech Stack

| Layer | Tool | Purpose |
|-------|------|---------|
| Frontend | Next.js 16 (App Router) | Pages, routing, server components |
| Styling | Tailwind CSS v4 | UI styling |
| Charts | Recharts | CO2 trend charts |
| Database | Supabase (PostgreSQL) | All data storage |
| Auth | Supabase Auth | Login, signup, email verification |
| File Storage | Supabase Storage | PDF bill uploads |
| OCR | Mindee API | Extract data from PDF bills |
| Payments | Stripe + Stripe Tax | Subscriptions + 20% UK VAT |
| Email | Resend | Email verification + report delivery |
| PDF Reports | react-pdf | Generate SECR-compliant PDFs |
| Deployment | Vercel | Production hosting |

---

## Environment Variables Needed

Create a `.env.local` file in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Mindee OCR
MINDEE_API_KEY=your_mindee_api_key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_BUSINESS_PRICE_ID=price_...

# Resend
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@greentrack.ai

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> All keys above will be provided by the client (Suhail). Work on staging only — never touch production keys.

---

## Database Schema (Supabase)

Run these SQL migrations in Supabase SQL editor in order.

### 1. Organisations
```sql
CREATE TABLE organisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'starter', 'business')),
  stripe_customer_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. Profiles (extends Supabase auth.users)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member', 'super_admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. Bills (core table)
```sql
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
```

### 4. Emission Factors (admin-editable, DEFRA 2025)
```sql
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

-- Seed with official 2025 DEFRA factors (non-negotiable)
INSERT INTO emission_factors (fuel_type, unit, kg_co2e_per_unit, scope, valid_from, valid_to) VALUES
('electricity', 'kWh',   0.177, 2, '2025-01-01', '2025-12-31'),
('gas',         'kWh',   0.182, 1, '2025-01-01', '2025-12-31'),
('gas',         'm3',    2.066, 1, '2025-01-01', '2025-12-31'),
('fuel_diesel', 'litre', 2.571, 1, '2025-01-01', '2025-12-31'),
('fuel_petrol', 'litre', 2.31,  1, '2025-01-01', '2025-12-31');
```

### 5. Subscriptions
```sql
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
```

### 6. Invitations
```sql
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
```

### 7. Row Level Security — MANDATORY (UK GDPR)
```sql
ALTER TABLE organisations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills           ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions   ENABLE ROW LEVEL SECURITY;

-- Users can only see data belonging to their own org
CREATE POLICY "org_isolation_bills" ON bills
  USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "org_isolation_profiles" ON profiles
  USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));
```

---

## Supabase Setup Checklist

- [ ] Create Supabase project — Region: **eu-west-2 (London)** — mandatory for UK GDPR
- [ ] Run all 7 SQL migrations above
- [ ] Enable Email Auth + Email Confirmation in Auth settings
- [ ] Create Storage bucket named `bills` — set to **private**
- [ ] Add storage RLS policy: org members can only access their own org's files

---

## What to Replace: Mock Data to Real API

Every page currently imports from `app/mock-data.ts`. Here is what each page needs:

---

### Dashboard (`app/dashboard/page.tsx`)
**Replace:**
- `mockBills` — Supabase query: bills for this org, last 6 months
- `mockMonthlyData` — Supabase aggregation: `SUM(co2_kg)` grouped by month

**New API route:** `GET /api/dashboard/summary`
Returns: total CO2, this month CO2, total kWh, monthly chart data, recent 5 bills

---

### Upload Bill (`app/upload/page.tsx`)
**Replace mock OCR with real 3-step flow:**

**Step 1 — Upload PDF to Supabase Storage:**
```
POST /api/bills/upload
Body: FormData with PDF file
Returns: { storagePath, publicUrl }
```

**Step 2 — Mindee OCR:**
```
POST /api/bills/ocr
Body: { storagePath }
Calls: Mindee InvoiceV4 API
Returns: { supplier, usage, unit, amount_due, bill_period, account_number }
```

**Step 3 — Save + Calculate CO2:**
```
POST /api/bills/save
Body: { orgId, billType, billDate, usage, unit, supplier, pdfUrl }
Logic: SELECT kg_co2e_per_unit FROM emission_factors
       WHERE fuel_type = $billType
       AND valid_from <= $billDate AND valid_to >= $billDate
       co2_kg = usage * factor
Returns: saved bill with co2_kg
```

**Tier enforcement (check before upload):**
```typescript
if (org.tier === 'free' && billsThisMonth >= 3) → 403 + upgrade prompt
if (org.tier === 'free' && billType !== 'electricity') → 403 + upgrade prompt
```

---

### History (`app/history/page.tsx`)
**Replace:**
- `mockBills` — `GET /api/bills?page=1&filter=all` with Supabase pagination
- CSV Export button — `GET /api/bills/export` streams CSV file (Business tier only)

---

### Reports (`app/reports/page.tsx`)
**Replace:**
- Static preview — live data from `GET /api/reports/summary`
- Download PDF — `POST /api/reports/generate` using react-pdf, streams PDF file
- Email Report — `POST /api/reports/email` sends PDF via Resend
- Benchmark chart — `GET /api/benchmarks?sector=` (anonymous, 5+ orgs minimum)

**PDF must include for SECR compliance:**
- Company name + logo (Business tier)
- Total CO2e in tonnes (Scope 1 + Scope 2 separate)
- Total energy consumption in kWh
- DEFRA factor version and source
- Year-on-Year comparison table

---

### Team (`app/team/page.tsx`)
**Replace:**
- `mockTeamMembers` — `GET /api/team`
- Send Invite — `POST /api/team/invite` inserts into `invitations` table + sends email via Resend
- Accept invite link — `GET /api/team/accept?token=` validates token, creates profile
- Remove member — `DELETE /api/team/member/:userId`

---

### Billing (`app/billing/page.tsx`)
**Replace:**
- Current plan banner — read from `subscriptions` table
- Plan cards upgrade/downgrade — `POST /api/billing/checkout` creates Stripe Checkout Session
- Invoice history — Stripe API: `stripe.invoices.list({ customer: stripeCustomerId })`
- Cancel — `POST /api/billing/cancel`

**Stripe Webhooks (`POST /api/webhooks/stripe`):**
```
checkout.session.completed      → set org.tier, create subscription record
customer.subscription.updated   → update tier if plan changed  
customer.subscription.deleted   → downgrade org to 'free'
invoice.payment_failed          → send email alert via Resend
```

---

### Admin (`app/admin/page.tsx`)
**Replace:**
- `mockAdminStats` — `GET /api/admin/stats` (super_admin role check required)
- `mockAdminOrgs` — `GET /api/admin/orgs`
- Suspend org — `PATCH /api/admin/orgs/:id` `{ status: 'suspended' }`
- Emission factors save — `PATCH /api/admin/factors/:id` `{ kg_co2e_per_unit }`

---

## All API Routes to Build

```
app/api/
├── auth/
│   └── callback/route.ts            ← Supabase email verification redirect
├── bills/
│   ├── upload/route.ts              ← Upload PDF to Supabase Storage
│   ├── ocr/route.ts                 ← Call Mindee API
│   ├── save/route.ts                ← Save bill + calculate CO2
│   ├── export/route.ts              ← CSV export (Business tier only)
│   └── route.ts                     ← GET paginated bill list
├── dashboard/
│   └── summary/route.ts             ← Aggregated stats + chart data
├── reports/
│   ├── generate/route.ts            ← Build and stream PDF
│   ├── email/route.ts               ← Send PDF via Resend
│   └── summary/route.ts             ← Data for report preview
├── benchmarks/
│   └── route.ts                     ← Anonymous industry comparison
├── team/
│   ├── route.ts                     ← GET members, POST invite
│   ├── accept/route.ts              ← Accept invite token
│   └── [userId]/route.ts            ← DELETE member
├── billing/
│   ├── checkout/route.ts            ← Create Stripe Checkout Session
│   ├── portal/route.ts              ← Stripe Customer Portal
│   └── cancel/route.ts              ← Cancel subscription
├── webhooks/
│   └── stripe/route.ts              ← All Stripe webhook events
├── account/
│   └── delete/route.ts              ← GDPR erasure (anonymise + delete)
└── admin/
    ├── stats/route.ts               ← KPI overview
    ├── orgs/route.ts                ← List + suspend orgs
    └── factors/[id]/route.ts        ← Edit emission factors
```

---

## Packages to Install

```bash
# Supabase
npm install @supabase/supabase-js @supabase/ssr

# Stripe
npm install stripe @stripe/stripe-js

# Mindee OCR
npm install mindee

# Email
npm install resend

# PDF generation
npm install @react-pdf/renderer

# Cookie consent (PECR)
npm install react-cookie-consent
```

---

## Key Files to Create

### `lib/supabase/client.ts` — browser client
```typescript
import { createBrowserClient } from '@supabase/ssr'
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### `lib/supabase/server.ts` — server components
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (c) => c.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options))
      }
    }
  )
}
```

### `lib/stripe.ts`
```typescript
import Stripe from 'stripe'
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
})
```

### `middleware.ts` — protect all routes
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // Refresh Supabase session
  // Redirect unauthenticated users to /login
  // Redirect non-super_admin users away from /admin
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login|signup).*)']
}
```

---

## Milestone Build Order

### Milestone 1 — Foundation (Week 1–2)
- [ ] Supabase project setup (London region)
- [ ] Run all SQL migrations + seed emission factors
- [ ] Install Supabase packages
- [ ] Replace Login page — real Supabase signInWithPassword
- [ ] Replace Signup page — real Supabase signUp + org creation
- [ ] Add middleware.ts — session refresh + route protection
- [ ] Replace mockUser/mockOrg — pull from profiles + organisations tables
- [ ] Deploy to Vercel staging

### Milestone 2 — Core Feature: Bills (Week 2–3)
- [ ] Build POST /api/bills/upload — Supabase Storage
- [ ] Build POST /api/bills/ocr — Mindee API
- [ ] Build POST /api/bills/save — CO2 calculation + DB insert
- [ ] Replace Upload page — real API calls
- [ ] Replace Dashboard — real Supabase queries
- [ ] Replace History — paginated Supabase query
- [ ] Add tier enforcement on upload

### Milestone 3 — Billing + Teams (Week 3–5)
- [ ] Create Stripe products + prices (enable Stripe Tax)
- [ ] Build POST /api/billing/checkout
- [ ] Build POST /api/webhooks/stripe — all 4 events
- [ ] Update org.tier on webhook
- [ ] Build team invite flow (Resend email + token)
- [ ] Build DELETE /api/team/member/:id
- [ ] Replace Billing page — real Stripe data + invoices

### Milestone 4 — Reports (Week 5–6)
- [ ] Build PDF template with react-pdf (SECR fields)
- [ ] Build POST /api/reports/generate — stream PDF
- [ ] Build POST /api/reports/email — Resend attachment
- [ ] Build benchmark query (GROUP BY sector HAVING COUNT >= 5)
- [ ] Build GET /api/bills/export — CSV stream (Business only)

### Milestone 5 — Admin + QA (Week 6–8)
- [ ] Build all /api/admin/* routes with role checks
- [ ] Replace Admin page mock data
- [ ] Build DELETE /api/account — GDPR erasure
- [ ] Add PECR cookie consent banner to layout
- [ ] Add /privacy and /terms pages
- [ ] Write integration tests (upload → calculate, billing, reports)
- [ ] Record Loom walkthrough for client
- [ ] Final QA — test all 3 tiers, all roles

---

## Compliance Checklist (Mandatory — Do Not Skip)

- [ ] Supabase in eu-west-2 (London) region
- [ ] Row Level Security on all tables
- [ ] /privacy page (UK GDPR privacy policy)
- [ ] /terms page (Terms of service)
- [ ] Cookie consent banner (PECR)
- [ ] Account deletion endpoint (anonymise personal data)
- [ ] Emission factors in DB — never hardcoded
- [ ] Factor lookup uses bill date (not always latest factor)
- [ ] Benchmarks anonymised — minimum 5 orgs per sector

---

## Important Client Rules

1. Work on **staging environment only** — never access production DB
2. Use **fake/anonymised test data** — never real customer bills
3. GitHub repo is in **client's (Suhail's) name** — push to his repo
4. Client handles **all Vercel production deployments**
5. All API keys provided by client — do not create your own production accounts
6. Sign **NDA + DPA + UK IDTA** before starting any work

---

## Post-MVP (Not in this contract — future phases)

- Gmail auto-forward (bills emailed directly to the app)
- Full Scope 3 emissions breakdown
- Accountant white-label portal
- Multi-currency support
- Mobile app

---

*Client: Suhail — GreenTrack AI*
*Developer: Rizan*
*Timeline: 4–8 weeks*
