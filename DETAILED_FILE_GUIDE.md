# Detailed File Guide - GreenTrack AI

This guide explains the purpose of every major file in the project and how they work together to deliver the carbon tracking platform.

---

## 📂 Root Directory
| File | Purpose |
| :--- | :--- |
| `proxy.ts` | The application's **Middleware**. It intercepts every request to check if a user is logged in. It redirects unauthenticated users to `/login` and authenticated users away from public pages. |
| `PROJECT_STRUCTURE.md` | A high-level overview of the folder layout. |
| `tailwind.config.mjs` | Defines the **Design System** (colors, rounded corners, shadows) used by the entire app. |
| `next.config.mjs` | Next.js configuration, including environment variable handling and experimental features (Turbopack). |
| `.env.local` | Stores sensitive **Secrets** and API keys. Never commit this to Git. |

---

## 📂 app/ (The App Router)
Next.js uses folder-based routing. Each folder with a `page.tsx` becomes a web route.

### 🛡️ (app) - Authenticated Area
Routes inside this parentheses-named folder share the same protected layout.
- **`dashboard/page.tsx`**: The main interface. Fetches CO2 metrics, energy usage, and recent bills from Supabase.
- **`dashboard/DashboardCharts.tsx`**: A client-side component that uses **Recharts** to draw the Greenhouse Gas emission trends.
- **`dashboard/actions.ts`**: Contains **Server Actions**. Currently handles the "One-Click Onboarding" logic to create organisations.
- **`admin/page.tsx`**: A restricted view for site owners to monitor total revenue (MRR) and platform growth.
- **`upload/page.tsx`**: Where users drop their PDF/Image bills. Communicates with the OCR API.

### 🔐 (auth) - Authentication pages
- **`login/page.tsx`**: The sign-in form. Uses Supabase Auth to verify credentials.
- **`signup/page.tsx`**: The registration form. Creates a new user in Supabase.

### 🌐 api/ - Backend Endpoints
- **`api/webhooks/stripe/`**: Listens for Stripe events (payment success/fail) to update the organization's subscription tier automatically.

---

## 📂 components/ (The UI Library)
- **`Sidebar.tsx`**: The primary navigation tool. It also displays the user's initials, email, and current organisation plan (Free/Pro).
- **`NoOrgState.tsx`**: The **Onboarding Wizard**. It detects if a user is "org-less" and provides the form to create a new company profile.
- **`CookieBanner.tsx`**: A GDPR-compliant banner that manages user consent for tracking.

---

## 📂 lib/ (External Integrations)
- **`supabase/server.ts`**: Functions to access the database from the server (securely).
- **`supabase/client.ts`**: Functions to access the database from the browser (e.g., for login forms).
- **`supabase/admin.ts`**: A high-privilege client using a "Service Role" key for tasks that bypass security rules (like creating the very first organisation).
- **`stripe.ts`**: Configuration for processing payments and managing subscriptions.

---

## 📂 types/ (The Source of Truth)
- **`index.ts`**: The most important file for developers. It defines the exact **Shape of the Data** for Organisations, Profiles, and Bills. This ensures that every file in the project uses the same names for database columns.
