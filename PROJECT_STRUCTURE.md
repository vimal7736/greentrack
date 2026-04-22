# Project Structure - GreenTrack AI

This document provides an overview of the directory structure and the purpose of key files in the GreenTrack project.

## Root Directory
- `app/`: Next.js 16 App Router directory containing all routes and server components.
- `components/`: Reusable UI components used across the application.
- `lib/`: Utility libraries and shared configurations (e.g., Supabase, Stripe).
- `public/`: Static assets such as images and icons.
- `types/`: TypeScript definitions and database schemas.
- `proxy.ts`: The main application middleware (handling auth redirects).
- `.env.local`: Environment variables (API keys, DB URLs).
- `tailwind.config.mjs`: Tailwind CSS configuration.
- `next.config.mjs`: Next.js configuration.

## App Router (`app/`)
- `(app)/`: A route group for authenticated sections of the application.
    - `dashboard/`: The main metrics and carbon footprint overview.
        - `actions.ts`: Server Actions (e.g., creating an organisation).
        - `page.tsx`: The main dashboard view.
        - `DashboardCharts.tsx`: Client-side Recharts component.
    - `admin/`: Administrative panel for monitoring organisations and MRR.
    - `upload/`: Page for uploading bills for OCR processing.
    - `team/`: Team management and seat allocation.
    - `billing/`: Stripe subscription management.
- `(auth)/`: Route group for authentication pages.
    - `login/`: User sign-in page.
    - `signup/`: User registration page.
- `api/`: Backend API routes (webhooks, data fetching).
- `layout.tsx`: Root layout with global providers and styling.

## Components (`components/`)
- `Sidebar.tsx`: The main navigation menu with user profile information.
- `NoOrgState.tsx`: Onboarding component for users without an organization.
- `CookieBanner.tsx`: GDPR compliant cookie consent banner.

## Key Configuration Files
- `lib/supabase/client.ts`: Browser-side Supabase client.
- `lib/supabase/server.ts`: Server-side Supabase client (for layouts/pages).
- `lib/supabase/admin.ts`: Service Role Supabase client (for admin tasks).

## Database Schema (Supabase)
Defined in `types/index.ts`:
- `profiles`: User information linked to Auth ID and Org ID.
- `organisations`: Company profiles and subscription tiers.
- `bills`: Processed bill data with CO2 calculations.
- `emission_factors`: Reference data for carbon footprint estimation.
