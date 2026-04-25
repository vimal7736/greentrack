# GreenTrack AI — Page Implementation Documentation

This document explains what has been built on the **Billing**, **Team**, and **Targets** pages in plain English — what each page does, how it works, and what shared building blocks it uses.

---

## 1. Billing Page (Financial Settlement)

**File:** `app/(app)/billing/page.tsx`

### What It Does

The Billing page lets users manage their GreenTrack subscription. It shows three pricing tiers (Free, Starter, Business) and handles the full upgrade flow through Stripe.

### Features Implemented

| Feature | How It Works |
|---|---|
| **Plan Comparison Cards** | Three side-by-side cards showing each plan's price, VAT breakdown, and feature list. The user's current plan is highlighted with a green ring and "Deployed Now" badge. |
| **Upgrade to Paid Plan** | When a user clicks "Upgrade Cluster" on a paid plan card, the app sends a request to `/api/billing/checkout` which creates a Stripe Checkout session. The user is redirected to Stripe to enter their card details. |
| **Stripe Billing Portal** | Paid users see a dark banner at the top with a "Manage Financials" button. Clicking it opens the Stripe self-service portal where they can view invoices, change payment method, or cancel. |
| **Success / Cancelled Alerts** | After returning from Stripe, the URL contains `?success=1` or `?cancelled=1`. The page reads these and shows a green "Subscription Activated" or orange "Transaction Interrupted" banner. |
| **Error Handling** | If any API call fails, a red error banner appears at the top of the page with the error message. |
| **GDPR Data Erasure** | A red-accented card at the bottom links to `/api/account/delete` for users who want to permanently delete all their data (UK GDPR Article 17 compliance). |
| **Payment Security Info** | An informational card confirms that all payments go through Stripe and that GreenTrack does not store credit card data. |

### How the Data Flows

```
User clicks "Upgrade Cluster"
  → POST /api/billing/checkout { plan: "starter" }
  → Server creates Stripe Checkout Session
  → User is redirected to Stripe
  → Stripe redirects back to /billing?success=1
  → Page shows success banner
```

### What It Does NOT Do (Yet)

- It does not currently fetch the organisation's actual tier on page load (the `/api/billing` call was removed). This means `currentTier` always defaults to `"free"` — paid users will not see their active plan banner or the billing portal button until this is restored.

---

## 2. Team Page (Collaborators)

**File:** `app/(app)/team/page.tsx`

### What It Does

The Team page manages who has access to the organisation's carbon data. It shows all team members, lets admins invite new people, change roles, and remove members.

### Features Implemented

| Feature | How It Works |
|---|---|
| **Member Directory** | A table showing all organisation members with their name, email, role, avatar (auto-generated initials), and registration date. Uses the shared `DataTable` component. |
| **Invite by Email** | A form on the left side lets admins type an email address and send an invitation. The app calls `POST /api/team` which uses Supabase's admin API to send a magic link email. |
| **Role Management** | Each member (except the Owner) has a dropdown to switch between "Member" and "Admin" roles. Changing the role calls `PATCH /api/team/{userId}`. |
| **Remove Member** | A delete button appears on hover for non-owner members. Clicking it shows a browser confirmation dialog, then calls `DELETE /api/team/{userId}`. |
| **Seat Utilization** | A visual indicator in the page header shows how many seats are used vs the plan's limit (e.g., 3/5). Filled seats glow green, empty ones are grey. |
| **Seat Limit Enforcement** | When all seats are used, the invite form is replaced with a "Capacity Limit Reached" warning and a link to the Billing page to upgrade. |
| **Permission Matrix** | A reference card explains the three roles: Owner (full control), Admin (team + data management), Member (view + data entry only). |
| **Invite Status Feedback** | After sending an invite, a success message ("Audit link successfully transmitted") or error message appears below the button. Success messages auto-dismiss after 3 seconds. |

### How the Data Flows

```
Page loads → GET /api/team
  → Returns { members: [...], org: { name, tier, seats_limit } }
  → Displays member table and seat utilization

Admin sends invite → POST /api/team { email: "new@company.com" }
  → Server checks: is caller admin/owner? are seats available? is email valid?
  → Supabase sends magic link email
  → Success/error shown in UI

Admin changes role → PATCH /api/team/{userId} { role: "admin" }
  → Server updates the profile
  → Page re-fetches the full team list
```

### Key Details

- **Only Admins and Owners** can invite new members or change roles. Members see the page but cannot modify anything (enforced server-side).
- **The Owner role cannot be changed or removed** — the delete button and role dropdown are hidden for the owner row.
- If a user is already registered in the system, Supabase's invite silently succeeds (they can just sign in).

---

## 3. Targets Page (Reduction Strategy)

**File:** `app/(app)/targets/page.tsx`

### What It Does

The Targets page helps organisations plan their carbon reduction journey. It shows current emissions against a target trajectory and lets users model different reduction scenarios using interactive sliders.

### Features Implemented

| Feature | How It Works |
|---|---|
| **24-Month Carbon Data** | On load, the page queries the `bills` table via Supabase for the last 2 years of `bill_date` and `co2_kg` data. It groups this by month to build a time series. |
| **Trajectory Chart** | A line chart (powered by Recharts) shows two lines: **Actual** carbon emissions (green solid line) and **Target Pathway** (orange dashed line). A reference line shows the monthly budget limit. |
| **Scenario Sliders** | Two interactive sliders let users adjust: (1) the **Annual Carbon Cap** (500–50,000 kg/yr) and (2) the **Yearly Reduction Rate** (1–30%). Moving the sliders instantly recalculates the target pathway on the chart. |
| **YTD Status Cards** | Four stat cards at the top show: YTD Carbon vs Limit, Budget Velocity (% of budget used), 24-Month Average, and projected Net Zero Year. Cards turn green when on track and orange when over budget. |
| **Net Zero Projection** | A mathematical formula calculates the year the organisation would reach near-zero emissions at the current reduction rate. Displayed in the "Net Zero Hub" stat card and the SBTi info banner. |
| **SBTi Advisory** | An info card at the bottom explains the Science Based Targets initiative and shows the projected Net Zero year. Includes a "Model 2030 Goals" button (currently decorative). |
| **SBTi Compliance Note** | A small advisory box in the slider panel reminds users that SBTi requires a minimum 4.2% annual reduction for 1.5°C Paris Agreement alignment. |

### How the Data Flows

```
Page loads → Supabase client query
  → SELECT bill_date, co2_kg FROM bills
     WHERE org_id = user's org AND bill_date >= 2 years ago
  → Groups by month → builds 24-month time series
  → Calculates monthly average → auto-sets annual target to 85% of current

User moves slider → React state updates
  → useMemo recalculates target pathway curve
  → Chart re-renders instantly (no API call)
```

### Key Details

- **No API route** — this page queries Supabase directly from the client using Row Level Security (RLS). Users can only see their own organisation's data.
- **Auto-calibrated defaults** — the Annual Carbon Cap auto-sets to 85% of the actual 24-month average, giving users a realistic starting point.
- **Net Zero math** — uses exponential decay: `currentYear + log(10 / annualEmissions) / log(1 - reductionRate)`. The "10 kg" threshold is used as the practical zero point.
- **The Slider component** is defined locally in this file because it's a specialised range input with a custom track/thumb design that doesn't fit the standard `Input` text field component.

---

## Shared Components Used

All three pages were refactored to use the shared component library defined in [COMPONENT_ARCHITECTURE.md](./COMPONENT_ARCHITECTURE.md). Here is what each page imports:

| Component | Billing | Team | Targets | What It Does |
|---|:---:|:---:|:---:|---|
| `PageBackground` | ✅ | ✅ | ✅ | Decorative green/orange blur blobs in the background |
| `PageHeader` | ✅ | ✅ | ✅ | Page title with icon and subtitle |
| `Button` | ✅ | ✅ | ✅ | Consistent button styling with variants (primary, secondary, danger, ghost) |
| `Input` | — | ✅ | — | Text input with label and focus styling |
| `DataTable` | — | ✅ | — | Generic table with loading state, empty state, and column definitions |
| `Spinner` | — | — | ✅ | Branded loading animation |
| `Organisation` type | ✅ | — | — | Shared TypeScript type for org data |
| `TeamMember` type | — | ✅ | — | Shared TypeScript type for team member data |
| `formatDate()` | — | ✅ | — | Consistent date formatting ("15 Jan 2024") |
| `formatPriceWithVat()` | ✅ | — | — | VAT calculation utility |
| `PLANS` constant | ✅ | — | — | Plan definitions shared between billing page and marketing |

---

## Files Created or Modified

### New Files
| File | Purpose |
|---|---|
| `lib/billing/plans.ts` | Billing plan definitions (Free, Starter, Business) with prices, VAT rates, and feature lists |

### Modified Files
| File | What Changed |
|---|---|
| `types/index.ts` | Added `admin` to `Role` type, added `email` to `Profile`, added `stripe_subscription_id` and `seats_limit` to `Organisation`, added `TeamMember` and `TeamApiResponse` types |
| `lib/utils/format.ts` | Added `formatPriceWithVat()` function |
| `app/(app)/billing/page.tsx` | Refactored to use shared components and types |
| `app/(app)/team/page.tsx` | Refactored to use shared components, `DataTable`, and types |
| `app/(app)/targets/page.tsx` | Refactored to use shared components, removed unused `useTheme` import, moved `Slider` outside component |
