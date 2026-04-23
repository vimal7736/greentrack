# Action Required: Supabase Database Setup

The error `Could not find the table 'public.organisations' in the schema cache` occurs because the required tables have not been created in your Supabase project.

Please follow these steps:

1.  **Open your Supabase Dashboard**.
2.  Go to the **SQL Editor** (the icon looks like `>_` on the left sidebar).
3.  Click **"New Query"**.
4.  **Copy and paste the SQL below** into the editor.
5.  Click **"Run"**.

```sql
-- 1. Organisations
CREATE TABLE organisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'starter', 'business')),
  stripe_customer_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organisations(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member', 'super_admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Bills
CREATE TABLE bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES profiles(id),
  bill_type TEXT NOT NULL CHECK (bill_type IN ('electricity', 'gas', 'water', 'fuel_diesel', 'fuel_petrol')),
  bill_date DATE NOT NULL,
  usage_amount NUMERIC NOT NULL,
  usage_unit TEXT NOT NULL,
  co2_kg NUMERIC NOT NULL,
  cost_gbp NUMERIC,
  supplier TEXT,
  account_number TEXT,
  pdf_url TEXT,
  ocr_raw JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Emission Factors (admin-editable, stores official DEFRA values)
CREATE TABLE emission_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fuel_type TEXT NOT NULL,
  unit TEXT NOT NULL,
  kg_co2e_per_unit NUMERIC NOT NULL,
  scope INTEGER NOT NULL CHECK (scope IN (1, 2, 3)),
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  source TEXT DEFAULT 'DEFRA 2025',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SEED: 2025 DEFRA Emission Factors
INSERT INTO emission_factors (fuel_type, unit, kg_co2e_per_unit, scope, valid_from, valid_to) VALUES
('electricity', 'kWh',   0.177, 2, '2025-01-01', '2025-12-31'),
('gas',         'kWh',   0.182, 1, '2025-01-01', '2025-12-31'),
('gas',         'm3',    2.066, 1, '2025-01-01', '2025-12-31'),
('fuel_diesel', 'litre', 2.571, 1, '2025-01-01', '2025-12-31'),
('fuel_petrol', 'litre', 2.31,  1, '2025-01-01', '2025-12-31');

-- 5. Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  status TEXT NOT NULL DEFAULT 'inactive',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Invitations (for team members)
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::TEXT,
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Row Level Security
ALTER TABLE organisations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills           ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations     ENABLE ROW LEVEL SECURITY;

-- 8. Policies
CREATE POLICY "org_isolation_bills" ON bills USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "org_isolation_profiles" ON profiles USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "org_isolation_subs" ON subscriptions USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Organisations: Allow authenticated users to create their first organisation
CREATE POLICY "Allow authenticated users to create organisations" ON organisations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Organisations: Allow users to view their own organisation
CREATE POLICY "Users can view their own organisation" ON organisations
  FOR SELECT USING (
    id IN (SELECT org_id FROM profiles WHERE profiles.id = auth.uid())
  );

-- Organisations: Allow owners to update their organisation
CREATE POLICY "Owners can update their organisation" ON organisations
  FOR UPDATE USING (
    id IN (SELECT org_id FROM profiles WHERE profiles.id = auth.uid() AND role = 'owner')
  );

```
