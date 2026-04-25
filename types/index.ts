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
  total_co2_kg:  number;
  total_cost_gbp: number;
}

export interface BillsApiResponse {
  bills:       Bill[];
  total:       number;
  page:        number;
  total_pages: number;
  summary:     BillsSummary;
}

export interface DashboardSummary {
  total_co2_kg:      number;
  this_month_co2_kg: number;
  last_month_co2_kg: number;
  total_kwh:         number;
  monthly_chart:     { month: string; co2: number; kwh: number }[];
  by_type:           { type: string; co2_kg: number }[];
  recent_bills:      Bill[];
}

export interface OcrResult {
  supplier:       string | null;
  bill_period:    string | null;
  usage:          number | null;
  unit:           string | null;
  amount_due:     number | null;
  account_number: string | null;
}
