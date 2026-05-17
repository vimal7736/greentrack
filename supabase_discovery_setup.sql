-- Update Organisations table for discovery
ALTER TABLE organisations ADD COLUMN IF NOT EXISTS discovery_domain TEXT;
ALTER TABLE organisations ADD COLUMN IF NOT EXISTS allow_discovery BOOLEAN DEFAULT TRUE;

-- Ensure profiles table has email for notification purposes
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Create Access Requests table
CREATE TABLE IF NOT EXISTS access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, org_id)
);

-- Enable RLS
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- Policies for access_requests

DROP POLICY IF EXISTS "Users can view their own requests" ON access_requests;
CREATE POLICY "Users can view their own requests" ON access_requests
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own requests" ON access_requests;
CREATE POLICY "Users can create their own requests" ON access_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view org requests" ON access_requests;
CREATE POLICY "Admins can view org requests" ON access_requests
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (role = 'admin' OR role = 'owner')
    )
  );

DROP POLICY IF EXISTS "Admins can resolve org requests" ON access_requests;
CREATE POLICY "Admins can resolve org requests" ON access_requests
  FOR UPDATE USING (
    org_id IN (
      SELECT org_id FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (role = 'admin' OR role = 'owner')
    )
  );

-- Profile Creation Trigger
-- This ensures every auth user has a public.profile record immediately
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_org_id UUID;
  v_org_name TEXT;
BEGIN
  v_org_name := new.raw_user_meta_data->>'org_name';
  
  -- 1. If org_name is provided, this is a NEW organisation creation
  IF v_org_name IS NOT NULL THEN
    -- Create the organisation first
    INSERT INTO public.organisations (name)
    VALUES (v_org_name)
    RETURNING id INTO v_org_id;

    -- Create the owner profile
    INSERT INTO public.profiles (id, full_name, role, org_id)
    VALUES (
      new.id, 
      new.raw_user_meta_data->>'full_name', 
      'owner',
      v_org_id
    );
  
  -- 2. Otherwise, this is a user joining
  ELSE
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
      new.id, 
      new.raw_user_meta_data->>'full_name', 
      'member'
    );
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Allow anyone to find an organisation by domain (for Discovery)
DROP POLICY IF EXISTS "Public can find organisations by domain" ON organisations;
CREATE POLICY "Public can find organisations by domain" ON organisations
  FOR SELECT USING (allow_discovery = true);

-- Allow owners/admins to view profiles of users who have requested to join their org
DROP POLICY IF EXISTS "Admins can view profiles of joiners" ON profiles;
CREATE POLICY "Admins can view profiles of joiners" ON profiles
  FOR SELECT USING (
    id IN (
      SELECT user_id FROM access_requests 
      WHERE org_id IN (
        SELECT org_id FROM profiles WHERE id = auth.uid() AND (role = 'owner' OR role = 'admin')
      )
    )
  );
