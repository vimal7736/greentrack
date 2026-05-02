# 🌌 GreenTrack AI: Advanced Backend Documentation

This document serves as the definitive reference for the backend architecture, data flow, API structure, and database schema of GreenTrack AI. Designed for backend engineers, system architects, and maintainers, it details the internal mechanics that power the platform.

---

## 1. System Architecture Overview

GreenTrack AI utilizes a modern, hybrid architecture built on **Next.js 16 (App Router)**. This paradigm blurs the lines between traditional frontend and backend logic.

*   **Server-First Rendering**: Pages are predominantly React Server Components (RSC), meaning data fetching occurs securely on the server, communicating directly with the database.
*   **API Routes**: Used for complex client-side interactions, external webhooks (Stripe), third-party integrations (Mindee OCR), and specialized CRUD operations.
*   **Database & Identity**: **Supabase** acts as the core engine, handling PostgreSQL storage, authentication, and security via Row Level Security (RLS).

---

## 2. Authentication & Security Middleware

Identity is intrinsically tied to every backend operation. GreenTrack uses server-side, `httpOnly` encrypted cookies rather than exposed JWTs in `localStorage`.

### The Middleware (`proxy.ts`)
The edge middleware acts as a strict gatekeeper:
1.  Intercepts every incoming request.
2.  Validates the session cookie via Supabase `createServerClient`.
3.  If no valid session exists, it performs a `307 Redirect` to `/login`.
4.  Ensures authenticated users cannot access public auth pages (e.g., `/login`, `/signup`).

### Role-Based Access Control (RBAC)
Authorization is handled at two levels:
*   **Application Level**: API routes check the user's `role` (`owner`, `admin`, `member`) before allowing destructive actions (e.g., deleting a team member or updating billing).
*   **Database Level (RLS)**: PostgreSQL Row Level Security guarantees data isolation. A user can only read/write rows where the `org_id` matches their profile's `org_id`.

---

## 3. Database Schema (Supabase)

The relational graph revolves around the `organisations` table.

### Core Tables
*   **`organisations`**: The central entity. Stores `name`, `tier` (`free`, `starter`, `business`), and `stripe_customer_id`.
*   **`profiles`**: Maps a Supabase Auth User (`auth.users`) to an organisation. Contains `org_id`, `full_name`, and `role`.
*   **`bills`**: The primary data payload. Stores `usage_amount`, `co2_kg`, `cost_gbp`, `bill_type`, and `ocr_raw` (JSON from Mindee).
*   **`emission_factors`**: A reference table containing DEFRA multipliers. Used to dynamically calculate `co2_kg` during bill ingestion.
*   **`subscriptions`**: Mirrors Stripe state. Stores `stripe_subscription_id`, `status`, and period dates.
*   **`invitations`**: Tracks pending invites sent to new team members.

### Data Normalization Strategy
Calculated states (like total CO2 emissions) are normalized. When a bill is uploaded, the backend immediately multiplies the `usage_amount` by the active `kg_co2e_per_unit` from `emission_factors` and stores the resulting `co2_kg` in the `bills` table. This guarantees lightning-fast aggregation for dashboards.

---

## 4. Comprehensive API Reference (`app/api/`)

The backend exposes several specialized RESTful endpoints. All protected routes extract the user context via `supabase.auth.getUser()` and verify the associated `org_id`.

### Identity & Onboarding
*   **`GET /api/auth/callback`**: Handles the OAuth / Magic Link code exchange. Critically, it contains logic to auto-link a newly registered user to an organisation if they were invited, or create a default organisation if they are a raw signup.
*   **`POST /api/org/create`**: Creates a new organisation and promotes the requesting user to `owner` by updating their profile.
*   **`GET /api/account/delete`**: GDPR Article 17 compliant endpoint. Anonymizes the user's `profiles` record, deletes the Auth identity, and triggers cancellation of active Stripe subscriptions.

### Dashboard & Analytics
*   **`GET /api/dashboard`**: Aggregation engine. Fetches the last 12 months of bills for the user's organisation. Computes:
    *   `total_co2_kg`, `this_month_co2_kg`, `last_month_co2_kg`
    *   `monthly_chart`: A 6-month array for Recharts rendering.
    *   `by_type`: Categorical emissions breakdown.

### Billing & Subscriptions (Stripe)
*   **`GET /api/billing`**: Returns current tier, subscription ID, and seat limits.
*   **`POST /api/billing/checkout`**: Initiates a Stripe Checkout Session for plan upgrades. Implements **Rate Limiting** via Upstash Redis to prevent abuse. Automatically associates the `stripe_customer_id` with the organisation.
*   **`POST /api/billing/portal`**: Generates a secure Stripe Customer Portal session for invoice management and plan cancellation.

### Bill Ingestion & OCR
*   **`GET /api/bills`**: Returns paginated, filterable bills. Supports text search (`ilike`) across supplier names and dates.
*   **`DELETE /api/bills?id=[uuid]`**: Removes a specific bill. Protected by RLS (only deletes if within the user's org).
*   **`POST /api/bills/ocr`**: The ingestion pipeline. Receives a file buffer, sends it to the Mindee OCR API, parses the response, and standardizes the extracted fields (usage, cost, date) against the `types/index.ts` interfaces.

### Team Management
*   **`GET /api/team`**: Returns all profiles sharing the user's `org_id`.
*   **`POST /api/team`**: Invites a new user via Supabase's `inviteUserByEmail`. **Business Logic**: Validates the current member count against the organisation's `seats_limit` (defined by their billing tier) before dispatching the email.
*   **`PATCH /api/team/[userId]`**: Updates a team member's role (admin/owner only).
*   **`DELETE /api/team/[userId]`**: Removes a member from the organisation (sets `org_id` to null).

---

## 5. Third-Party Integrations

### Mindee OCR (`lib/mindee`)
Used to extract structured data from PDF/Image utility bills. The backend sends the file buffer to Mindee, receives a JSON layout, and extracts specific fields (Total Amount, Date, Consumption) based on a custom document model.

### Stripe Billing (`lib/stripe.ts`)
Handles the financial layer. 
*   **Webhooks (`/api/webhooks/stripe`)**: Essential for data consistency. Listens for `invoice.payment_succeeded`, `customer.subscription.updated`, and `customer.subscription.deleted`. Updates the `subscriptions` and `organisations` tables asynchronously to reflect true payment states without relying on client-side confirmation.

### Resend (`lib/email.ts`)
Handles transactional emails. Used for sending "Account Deleted" confirmations, welcome emails, or custom platform notifications beyond the default Supabase auth emails.

---

## 6. Performance & Optimization

*   **Caching & Revalidation**: Next.js App Router aggressively caches data. API routes use `Cache-Control: no-store` to ensure real-time accuracy for transactional data (like bills).
*   **Vercel Serverless Configurations**: `vercel.json` overrides maximum execution durations for heavy routes:
    *   `app/api/bills/upload/route.ts`: 60 seconds (accommodates slow OCR processing).
    *   `app/api/reports/summary/route.ts`: 30 seconds (accommodates heavy PDF report generation).
*   **Connection Pooling**: Database connections are managed via Supabase's built-in PgBouncer implementation, ensuring the serverless functions don't exhaust connection limits during traffic spikes.
