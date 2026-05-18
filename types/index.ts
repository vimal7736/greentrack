// ─── Database row types (match Supabase table columns exactly) ───────────────

export type Tier = "free" | "starter" | "business";
export type Role = "owner" | "admin" | "member" | "super_admin";
export type BillType = "electricity" | "gas" | "water" | "fuel_diesel" | "fuel_petrol";

export interface Organisation {
  id: string;
  name: string;
  logo_url: string | null;
  tier: Tier;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  seats_limit: number;
  created_at: string;
}

export interface Profile {
  id: string;
  org_id: string;
  full_name: string | null;
  email: string;
  role: Role;
  created_at: string;
}

// Shape returned by GET /api/team → members[]
export interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

export interface TeamApiResponse {
  members: TeamMember[];
  org: {
    name: string;
    tier: string;
    seats_limit: number;
  };
}

export interface Bill {
  id: string;
  org_id: string;
  uploaded_by: string | null;
  bill_type: BillType;
  bill_date: string;
  usage_amount: number;
  usage_unit: string;
  co2_kg: number;
  cost_gbp: number | null;
  supplier: string | null;
  account_number: string | null;
  pdf_url: string | null;
  ocr_raw: Record<string, unknown> | null;
  created_at: string;
}

export interface EmissionFactor {
  id: string;
  fuel_type: string;
  unit: string;
  kg_co2e_per_unit: number;
  scope: 1 | 2 | 3;
  valid_from: string;
  valid_to: string;
  source: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  org_id: string;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  updated_at: string;
}

// ─── API response shapes ─────────────────────────────────────────────────────

export interface BillsSummary {
  total_co2_kg: number;
  total_cost_gbp: number;
}

export interface BillsApiResponse {
  bills: Bill[];
  total: number;
  page: number;
  total_pages: number;
  summary: BillsSummary;
}

export interface DashboardSummary {
  total_co2_kg: number;
  this_month_co2_kg: number;
  last_month_co2_kg: number;
  total_kwh: number;
  monthly_chart: { month: string; co2: number; kwh: number }[];
  by_type: { type: string; co2_kg: number }[];
  recent_bills: Bill[];
}

export interface OcrResult {
  supplier: string | null;
  bill_period: string | null;
  usage: number | null;
  unit: string | null;
  amount_due: number | null;
  account_number: string | null;
}

export interface MonthStat {
  month: string;
  co2: number;
  target: number;
}

export interface BillRow {
  bill_date: string;
  bill_type: string;
  co2_kg: number;
  usage_amount: number;
  usage_unit: string;
  cost_gbp: number | null;
}

export interface AggregatedPeriod {
  co2: number;
  kwh: number;
  cost: number;
  byType: Record<string, number>;
}

export interface ReportSummary {
  org: { name: string; tier: string };
  year: string;
  total_co2_kg: number;
  total_kwh: number;
  total_cost_gbp: number;
  by_type: { type: string; co2_kg: number; cost_gbp: number }[];
  by_scope: { scope1: number; scope2: number; scope3: number };
  by_quarter: { period: string; co2: number }[];
  by_month: { month: string; co2: number; cost: number }[];
  bill_count: number;
  prev_year_co2: number;
  prev_year_cost: number;
  months_with_data: number;
  target: {
    annual_carbon_cap_kg: number;
    yearly_reduction_rate: number;
    net_zero_target_year: number | null;
    sbti_pathway: string;
    baseline_year: number;
  } | null;
}

// ─── Targets ─────────────────────────────────────────────────────────────────

export interface OrgTarget {
  id: string;
  org_id: string;
  created_by: string | null;
  annual_carbon_cap_kg: number;
  yearly_reduction_rate: number;
  net_zero_target_year: number | null;
  baseline_year: number;
  sbti_pathway: "1.5c" | "wbb2c" | "2c";
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Admin panel types ───────────────────────────────────────────────────────

export interface AdminStats {
  total_orgs: number;
  total_users: number;
  bills_today: number;
  total_bills: number;
  mrr: number;
  tier_counts: { free: number; starter: number; business: number };
}

export interface AdminOrg {
  id: string;
  name: string;
  tier: string;
  created_at: string;
  user_count: number;
  bill_count: number;
  status?: string;
}

export interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  org_id: string;
  org_name: string;
  created_at: string;
  is_disabled?: boolean;
}

export interface AdminActivity {
  id: string;
  type: "signup" | "bill_upload" | "tier_change" | "factor_edit";
  description: string;
  user_name: string | null;
  org_name: string | null;
  created_at: string;
}

// ─── Subscription Management Module ─────────────────────────────────────────

export type SubscriptionStatus = "active" | "trial" | "past_due" | "canceled" | "grace_period";
export type CouponType = "fixed" | "percentage";

export interface SubscriptionDashboardStats {
  mrr: number;
  active_subscribers: number;
  churn_rate: number;
  total_ai_credits: number;
  plan_distribution: { plan: string; count: number; color: string }[];
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  monthly_price: number;
  yearly_price: number;
  description: string;
  features: { key: string; label: string; enabled: boolean }[];
  quotas: { bills_per_month: number; max_organisations: number };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubscriberRow {
  id: string;
  org_name: string;
  plan: string;
  status: SubscriptionStatus;
  renewal_date: string | null;
  trial_ends_at: string | null;
  ai_credits_used: number;
  ai_credits_limit: number;
  bill_count: number;
  user_count: number;
  stripe_customer_id: string | null;
  created_at: string;
}

export interface AiUsageRow {
  org_id: string;
  org_name: string;
  plan: string;
  credits_used: number;
  credits_limit: number;
  bills_processed: number;
  last_usage: string | null;
  overage: boolean;
}

export interface CouponRow {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  usage_limit: number;
  times_used: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  created_at: string;
}

export interface WebhookLogRow {
  id: string;
  event_type: string;
  stripe_event_id: string;
  status: "success" | "failed" | "pending";
  payload_summary: string;
  created_at: string;
}
