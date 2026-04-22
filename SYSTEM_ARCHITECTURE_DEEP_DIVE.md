# 🛰️ GreenTrack AI: System Architecture & Data Flow

This document provides a "Very Deep" technical breakdown of how the Frontend (Next.js), Backend (Server Actions/API), and Database (Supabase) coordinate to deliver the GreenTrack experience.

---

## 1. The Frontend-Backend Hybrid (Next.js 16)
GreenTrack is built on the **App Router**, which removes the traditional line between "Frontend" and "Backend."

### **Server-First Rendering**
Most of your project (e.g., `app/(app)/dashboard/page.tsx`) uses **React Server Components (RSC)**.
- **The Backend Role**: When a user visits the dashboard, the "Backend" part of the code runs on the server. It directly talks to Supabase using the `createClient()` from `lib/supabase/server.ts`. 
- **The Performance**: Because the data fetching happens on the server (close to the database), the browser receives a finished HTML page with all the text already inside. This is why the dashboard feels fast.

### **Interactive Client Islands**
Components like `DashboardCharts.tsx` have the `"use client"` directive at the top.
- **The Frontend Role**: These are "Islands of Interactivity." They are sent to the browser as JavaScript. Recharts (your charting library) needs access to the browser's "Window" object to draw pixels and handle hover effects, which is why they cannot be server components.

---

## 2. The Identity Glue (Supabase + Middleware)
How does the app know who you are in every file?

### **The Redirect Guard (`proxy.ts`)**
This is your **Middleware**. Every single time a browser asks for a page, this file runs **before** the page is even considered.
1. It looks at the **Cookies** sent by the browser.
2. It asks Supabase: *"Is there a valid session for this specific cookie?"*
3. If no session exists, it intercepts the request and sends a `307 Redirect` to `/login`.
4. This ensures that your "Backend" logic is never executed by unauthorized users.

### **Server-Side Cookies**
Unlike traditional apps that store "Tokens" in LocalStorage, GreenTrack uses **Encrypted Cookies**. 
- **Security**: This prevents "Cross-Site Scripting" (XSS) attacks because JavaScript cannot easily steal your session from a cookie if it is marked as `httpOnly`.

---

## 3. The Database Engine (Supabase Relational Logic)
Your project relies on a **Relational Graph** between three main tables:

### **The Profile-Org Link**
Every user in your Auth system has a corresponding entry in the `profiles` table.
- **Foreign Key**: `profiles.org_id` → `organisations.id`.
- **The Logic**: When you log in, the app fetches your profile. If `org_id` is null, the code branches into the **Onboarding Flow** (`NoOrgState`). Once you create an organisation, a UUID is generated, and your profile is updated to "point" to that organisation.

### **Calculated States (Bills)**
The `bills` table doesn't just store raw data; it stores **Derived Intelligence**.
- When you upload a bill, the app calculates the `co2_kg` value immediately using the factors in the `emission_factors` table.
- **Functionality**: We store the result instead of calculating it every time the user refreshes. This is called **Data Normalization**, and it ensures your charts load in milliseconds even with thousands of bills.

---

## 4. The Request Waterfall (Deep Timeline)
What happens when you click "Refresh" on the Dashboard?

1. **Step 1 (Middleware)**: `proxy.ts` verifies your session.
2. **Step 2 (Root Layout)**: `app/layout.tsx` initializes the Global CSS and fonts.
3. **Step 3 (App Layout)**: `app/(app)/layout.tsx` fetches your profile. It checks your **Role** (`owner` vs `member`) and passed it to the `Sidebar.tsx`.
4. **Step 4 (Dashboard Page)**: `app/(app)/dashboard/page.tsx` starts its "Waterfall":
    - It queries Supabase for `bills` WHERE `org_id` = YOUR_ORG.
    - It loops through those bills to build the `monthlyChart` data array.
5. **Step 5 (Client Render)**: The server sends the HTML to your browser. The browser then "Hydrates" (activates) the `DashboardCharts.tsx` to animate the lines on the screen.

---

## 5. Server Actions: The Modern API
In the past, you would need a separate `POST /api/create-org` endpoint. In this project, we use **Server Actions** (`app/(app)/dashboard/actions.ts`).

- **Functionality**: When the user clicks "Create Organisation," the browser directly calls the `createOrganisationAction` function. 
- **Security**: Even though it looks like a standard JavaScript function, it executes **entirely on the server**. This is why we can safely use the `createAdminClient` inside it without exposing your secret service keys to the user's browser.
