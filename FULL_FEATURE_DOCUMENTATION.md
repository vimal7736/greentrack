# GreenTrack AI — Complete Feature Documentation

This document provides a comprehensive overview of all features implemented in GreenTrack AI, covering both the **User** and **Admin** portals.

---

## 1. Core Platform Overview

GreenTrack AI is a Carbon Management & ESG Compliance platform designed to help organisations track, model, and report their carbon footprint.

- **Technology Stack**: Next.js (App Router), Supabase (Auth, DB, Storage), Stripe (Payments), Recharts (Analytics), Lucide (Icons).
- **Design Philosophy**: Premium, high-contrast UI with a focus on data visualization and ease of use.
- **Security**: Row Level Security (RLS) ensures organisations only see their own data. Admin access is restricted via custom roles.

---

## 2. User Portal Features

The User Portal is where organisation members manage their carbon data.

### 2.1 Dashboard
- **Visual Insights**: Real-time overview of carbon emissions using high-performance charts.
- **Budget Tracking**: Interactive "Budget Ring" showing current usage vs. monthly targets.
- **Period Comparison**: Automated "Then vs. Now" analysis comparing current performance to previous periods.
- **KPI Summary**: Quick-view cards for Total Carbon, Energy Usage, and Bill Count.

### 2.2 Data Entry (Upload)
- **Bill Upload**: Support for uploading utility bills (PDF/Images) for automated processing (OCR/Manual entry).
- **Manual Entry**: Detailed forms for entering usage data for Electricity, Gas, Water, and Fuel.
- **Scope Categorization**: Automatically assigns data to Scope 1 (Direct), Scope 2 (Indirect), or Scope 3 (Associated).

### 2.3 History & Audit Trail
- **Data Log**: A comprehensive table of all recorded emissions data.
- **Editing & Deletion**: Ability to correct or remove historical records.
- **Audit Detail**: View metadata for every entry, including source files and conversion factors used.

### 2.4 Analytics & Reports
- **SECR Compliance**: Official-style compliance reports ready for stakeholder review.
- **PDF Export**: Generate branded PDF reports for offline use (available on paid plans).
- **Resource Decomposition**: Detailed breakdown of impact by resource type (e.g., Gas vs. Grid Electricity).
- **Quarterly Impact**: Visual tracking of emissions velocity throughout the fiscal year.

### 2.5 Targets & Modeling
- **Reduction Strategy**: Set annual carbon caps and reduction rate goals.
- **Scenario Modeling**: Interactive sliders to visualize how different reduction rates affect the journey to Net Zero.
- **Net Zero Projection**: Mathematical projection of the year the organisation will reach its goals.
- **SBTi Alignment**: Advisory notes on Science Based Targets initiative (SBTi) connectivity.

### 2.6 Team Management
- **Member Directory**: View all users with access to the organisation.
- **Role-Based Access**: Manage permissions using Owner, Admin, and Member roles.
- **Invitations**: Invite new collaborators via secure magic links.
- **Seat Utilization**: Visual tracking of seat limits based on the subscription plan.

### 2.7 Billing & Subscription
- **Plan Management**: View and upgrade between Free, Starter, and Business tiers.
- **Stripe Integration**: Secure checkout and self-service billing portal.
- **GDPR Compliance**: Direct link for account deletion and data erasure requests.

---

## 3. Admin Portal Features

The Admin Portal is a restricted area for platform operators to manage the entire ecosystem.

### 3.1 Admin Dashboard
- **Platform KPIs**: Global overview of Total Organisations, Total Users, and Total Bills.
- **Revenue Analytics**: Live MRR (Monthly Recurring Revenue) tracking and plan distribution charts.
- **Live Activity Feed**: Real-time stream of platform-wide events (Signups, Bill Uploads, Tier Changes).

### 3.2 Organisation Management
- **Central Registry**: Searchable directory of every organisation on the platform.
- **Status Control**: Ability to view and manage organisation details.
- **Activity Tracking**: View specific activity logs for any organisation.

### 3.3 User Management
- **User Directory**: Global list of all registered users.
- **Account Control**: Ability to view user roles and associated organisations.

### 3.4 Subscription Management
- **Stripe Status**: Real-time tracking of subscription statuses and Stripe IDs.
- **Financial Oversight**: Monitor payment success and plan migrations.

### 3.5 Global Activity Log
- **System Audit**: A centralized log of every critical action taken on the platform.
- **Filter & Search**: Drill down into specific event types or date ranges.

### 3.6 Emission Factors (Internal)
- **Factor Library**: Management of conversion factors (kgCO2e per unit) used for carbon calculations.
- **Updates**: Ability to update factors annually based on government/SECR guidelines.

---

## 4. Navigation & Common Pages

- **Authentication**: Secure Login and Signup flows with email verification.
- **Onboarding**: Automated organisation setup for new users.
- **Legal**: Dedicated pages for Terms of Service and Privacy Policy.
- **Responsive Design**: All features are optimized for Desktop, Tablet, and Mobile devices.
