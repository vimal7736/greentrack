# 📘 Deep Technical Specification - GreenTrack AI

This document serves as the comprehensive technical manual for the GreenTrack architecture. It describes the **Role** (architectural purpose) and **Functionality** (internal logic) of every core file within the system.

---

## 🏛️ 1. Core Platform Infrastructure

### `proxy.ts` (Application Middleware)
- **Role**: Identity Gateway & Session Manager.
- **Functionality**: 
    - Intercepts every HTTP request before it reaches the routes.
    - **Logic**: It uses a regex matcher (`/((?!_next/static|...).*)`) to exclude static assets. For all other requests, it initializes a Supabase Server Client, checks for an active JWT (session), and enforces redirects.
    - **Outcome**: Ensures that unauthenticated users can only see `/login` or `/signup`, while logged-in users are redirected away from those auth pages back to the `/dashboard`.

### `lib/supabase/server.ts`
- **Role**: Secure Data Access Layer (Server-Side).
- **Functionality**: 
    - Provides a standard function to initialize the Supabase client in a **Server Context**.
    - **Logic**: It automatically reads and writes to the `cookieStore`. It includes a `try-catch` on `setAll` to allow safe usage in both Layouts and Server Actions without triggering "headers already sent" errors.

### `lib/supabase/admin.ts`
- **Role**: High-Privilege Master Client.
- **Functionality**: 
    - Uses the `SUPABASE_SERVICE_ROLE_KEY` to bypass Row Level Security (RLS).
    - **Logic**: This client is strictly restricted to Server-Side logic. It is used primarily for the **Admin Panel** stats and the **Onboarding Action** where a user might not yet have permissions to write to their own profile.

---

## 🏗️ 2. User Lifecycle & Onboarding

### `app/(app)/dashboard/actions.ts`
- **Role**: User Onboarding Engine.
- **Functionality**: Performs a multi-table database transaction.
    - **Step 1**: Validates the organisation name.
    - **Step 2**: Inserts a new row into `organisations` with a default `free` tier.
    - **Step 3**: "Upserts" the current user's entry in `profiles`, assigning them the `org_id` of the new organisation and granting the `owner` role.
    - **Step 4**: Triggers a `revalidatePath` to clear the Next.js cache so the user immediately sees their new Dashboard.

### `components/NoOrgState.tsx`
- **Role**: Onboarding UI Framework.
- **Functionality**: A "Smart Fallback" component.
    - **Logic**: It detects when a user is in a "limbo" state (logged in but unassigned). It provides the interactive form that captures the Organisation Name and communicates with the `actions.ts` mentioned above.

---

## 📊 3. Dashboard & Data Visualisation

### `app/(app)/dashboard/page.tsx`
- **Role**: Primary Business Logic Aggregator.
- **Functionality**: Performs complex data transformation.
    - **Data Fetching**: Pulls the last 12 months of bills for the user's specific `org_id`.
    - **Aggregation Logic**: Iterates through the raw bill array to calculate:
        1. **Total CO2**: Sum of all `co2_kg`.
        2. **Monthly Comparison**: compares `thisMonth` vs `lastMonth` to determine the `% trend` and `trendDown` boolean.
        3. **Equivalency Logic**: Calculates "Miles Driven" by dividing CO2 by a factor (0.255).
    - **Data Mapping**: Groups bill totals by month string (e.g., "Jan") specifically for the Recharts client component.

### `components/DashboardCharts.tsx`
- **Role**: Client-Side Presentation Layer.
- **Functionality**: Interactive Data Rendering.
    - Uses **Recharts** to render `AreaChart` (emission trends) and `PieChart` (energy source breakdown). 
    - Implements custom Tooltips and responsive containers to ensure the charts look premium on all screen sizes.

---

## 👑 4. Administrative Control

### `app/(app)/admin/page.tsx`
- **Role**: Platform Governance Dashboard.
- **Functionality**: Multi-Tab Platform Management.
    - **Overview Tab**: Fetches aggregated system stats (MRR, Total Orgs, Total Bills).
    - **Organisations Tab**: Lists every company on the platform with their join date and seat usage.
    - **Emission Factors Tab**: Allows **live editing** of the CO2 calculation factors. It communicates with `PATCH` endpoints to update the calculation logic globally.

### `app/api/admin/stats/route.ts`
- **Role**: Secure Reporting Endpoint.
- **Functionality**: Performs platform-wide financial audit.
    - **Logic**: Uses a `Promise.all` to concurrently query counts from `organisations`, `profiles`, and `bills`.
    - **MRR Calculation**: Dynamically calculates the Monthly Recurring Revenue by summing the fixed costs associated with each organization's `tier` (e.g., Starter = £24, Business = £99).

---

## 📑 5. Core Data Structures

### `types/index.ts`
- **Role**: Technical Documentation as Code.
- **Functionality**: Global Type Safety.
    - Defines exactly what a `Bill`, `Organisation`, and `Profile` must contain.
    - **Impact**: Any developer changing a column in the database will see immediate "Red Underlines" across every component that uses that data, preventing runtime crashes.
