# 📖 The GreenTrack AI Encyclopedia

This is the ultimate, exhaustive guide to every file and folder in the GreenTrack project. Use this for deep auditing, architectural review, or onboarding new developers.

---

## 🛠️ Root Configuration Files
| File | Role | Detailed Functionality |
| :--- | :--- | :--- |
| `proxy.ts` | **Security Orchestrator** | Next.js Middleware that executes on edge. It uses the `createServerClient` to check for a valid session cookie. If missing, it uses `NextResponse.redirect` to force users to `/login`. It also handles the logic for preventing logged-in users from accessing the signup page. |
| `next.config.mjs` | **Build Config** | Configures the Next.js compiler. It enables experimental features like **Turbopack** and strictly enforces that all `process.env` variables are available during server-side execution. |
| `tailwind.config.mjs` | **Visual DNA** | The source of truth for the CSS system. Every "Green" or "Rounded" corner in the app is defined here. It maps standard Tailwind values to the custom GreenTrack palette (Green-900 for headers, Green-400 for accents). |
| `package.json` | **Dependency Map** | Lists all 3rd party engines (Next.js, Recharts, Lucide, Supabase). It also defines the `dev` script we use to run the project. |

---

## 🏗️ The `app/` Directory (The Logic Core)
The App Router handles the entire request-response lifecycle.

### 🛡️ `app/(app)/` - Protected Workspace
This folder uses a "Route Group" (parentheses) to apply a shared security layout without affecting the URL structure.

#### 📊 `dashboard/`
- **`page.tsx`**: The heart of the app. It fetcher data for the last 12 months. **Logic**: It performs array reductions to calculate total CO2 metrics and handles "Empty State" logic by showing the `NoOrgState` component if no organisation is found.
- **`DashboardCharts.tsx`**: A Client Component because it uses interactive Recharts. It handles tooltips, axis scaling, and dynamic resizing for the carbon footprint area charts.
- **`actions.ts`**: The "First-Run" engine. It contains the Server Action used to create a company's first profile. It bridges the gap between the Auth user and the Database.

#### 👑 `admin/`
- **`page.tsx`**: A dashboard for platform owners. **Functionality**: It allows superadmins to live-edit the `emission_factors` table. It also performs financial calculations for MRR (Monthly Recurring Revenue) based on subscription distribution.
- **`layout.tsx`**: Enforces secondary authorization. It checks if the user's role is specifically `superadmin` before rendering anything.

#### 📁 `upload/`
- **`page.tsx`**: The ingestion portal. It handles drag-and-drop file inputs and coordinates with the Mindee OCR endpoints to extract data from utility bills.

#### 💳 `billing/`
- **`page.tsx`**: The money gate. It integrates with the **Stripe Customer Portal**. Logic: It checks the organisation's `stripe_customer_id` and generates a secure link to manage payment methods.

---

## 🧩 The `components/` Directory (Reusable UI)
These are independent LEGO blocks that keep the code clean.

- **`Sidebar.tsx`**: The main navigation hub. **Functionality**: It dynamically renders navigation items based on the user's role. It also contains the **Sign Out** logic which clears the Supabase cache and session.
- **`NoOrgState.tsx`**: A transitional component. It converts from a static "No Org" warning into an interactive setup form once a user clicks "Create Organisation."
- **`CookieBanner.tsx`**: Handles GDPR compliance. It stores the "Accepted" state in local storage to prevent the banner from reappearing every time.

---

## 🔌 The `lib/` Directory (Integrations)
Where GreenTrack talks to the outside world.

- **`supabase/server.ts`**: Used for fetching data inside pages. It is "Server Only" for maximum security.
- **`supabase/client.ts`**: Used for browser interaction (Auth forms).
- **`supabase/admin.ts`**: The "Master Key" client. It uses the Service Role to perform high-level database mutations that standard users cannot do.
- **`stripe.ts`**: Sets up the Stripe Node.js SDK with the secret key found in `.env.local`.

---

---

## 🛰️ 4. The API Layer (The Back-End)
These are hidden endpoints used by the front-end to perform operations.

| Segment | Path | Purpose & Functionality |
| :--- | :--- | :--- |
| **Auth** | `api/auth/callback/` | Handles the code-exchange after a user confirms their email or signs in via OAuth. It translates the Supabase code into a permanent browser session. |
| **Billing** | `api/billing/checkout/` | Generates a Stripe Checkout Session. **Logic**: It identifies the user's organisation and redirects them to a secure Stripe-hosted payment page. |
| **Bills** | `api/bills/ocr/` | The complex "Vision" route. **Functionality**: It accepts a file buffer, sends it to Mindee OCR, and parses the extracted text into the structured format (usage, cost, date) defined in `types/index.ts`. |
| **Admin** | `api/admin/stats/` | **Restricted Route**. It checks the user's role in Supabase. Only allows execution if `role === 'superadmin'`. It calculates aggregate KPI counts for the entire platform. |
| **Team** | `api/team/` | Manages organisation members. **Logic**: It calculates if the organisation has exceeded its "Seats Limit" (based on their tier) before allowing a new user to be invited. |

---

## 🧬 5. The State Logic (How it flows)

### **The Authentication Loop**
1. **Request**: User visits `/dashboard`.
2. **Middleware (`proxy.ts`)**: Checks `auth.getSession()`.
3. **Database (`profiles`)**: Next.js fetches the `profile.org_id`.
4. **Logic Branch**:
    - If `org_id` exists: Render `DashboardPage` logic.
    - If `org_id` is null: Render `NoOrgState` component.

### **The Bill Calculation Flow**
1. **Raw Input**: `usage_amount` (e.g., 500) and `unit` (e.g., "kWh").
2. **Reference Check**: Look up the `emission_factors` table for the matching `fuel_type`.
3. **Math**: `usage_amount` * `kg_co2e_per_unit`.
4. **Storage**: The resulting `co2_kg` value is stored permanently in the `bills` table to avoid re-calculating on every page load.

