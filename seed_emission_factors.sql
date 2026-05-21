-- ─────────────────────────────────────────────────────────────────────────────
-- DEFRA Emission Factors Seed
-- Source: DEFRA/DESNZ Greenhouse Gas Conversion Factors 2024
-- Run this once in Supabase SQL Editor → all bill uploads will work immediately
-- ─────────────────────────────────────────────────────────────────────────────

-- Clear existing factors first (idempotent re-run)
DELETE FROM emission_factors;

INSERT INTO emission_factors (fuel_type, unit, kg_co2e_per_unit, scope, valid_from, valid_to)
VALUES

  -- ── Electricity (Scope 2 — grid average, UK) ──────────────────────────────
  ('electricity', 'kWh', 0.20493, 2, '2023-01-01', '2023-12-31'),
  ('electricity', 'kWh', 0.20493, 2, '2024-01-01', '2024-12-31'),
  ('electricity', 'kWh', 0.20493, 2, '2025-01-01', '2025-12-31'),
  ('electricity', 'kWh', 0.20493, 2, '2026-01-01', '2026-12-31'),

  -- ── Natural Gas (Scope 1 — gross calorific value) ─────────────────────────
  ('gas', 'kWh', 0.18253, 1, '2023-01-01', '2023-12-31'),
  ('gas', 'kWh', 0.18253, 1, '2024-01-01', '2024-12-31'),
  ('gas', 'kWh', 0.18253, 1, '2025-01-01', '2025-12-31'),
  ('gas', 'kWh', 0.18253, 1, '2026-01-01', '2026-12-31'),

  -- ── Diesel (Scope 1 — per litre, average biofuel blend) ──────────────────
  ('fuel_diesel', 'litre', 2.50917, 1, '2023-01-01', '2023-12-31'),
  ('fuel_diesel', 'litre', 2.50917, 1, '2024-01-01', '2024-12-31'),
  ('fuel_diesel', 'litre', 2.50917, 1, '2025-01-01', '2025-12-31'),
  ('fuel_diesel', 'litre', 2.50917, 1, '2026-01-01', '2026-12-31'),

  -- ── Petrol (Scope 1 — per litre, average biofuel blend) ──────────────────
  ('fuel_petrol', 'litre', 2.27792, 1, '2023-01-01', '2023-12-31'),
  ('fuel_petrol', 'litre', 2.27792, 1, '2024-01-01', '2024-12-31'),
  ('fuel_petrol', 'litre', 2.27792, 1, '2025-01-01', '2025-12-31'),
  ('fuel_petrol', 'litre', 2.27792, 1, '2026-01-01', '2026-12-31'),

  -- ── Water (Scope 3 — supply + treatment, per m³) ─────────────────────────
  ('water', 'm3', 0.14900, 3, '2023-01-01', '2023-12-31'),
  ('water', 'm3', 0.14900, 3, '2024-01-01', '2024-12-31'),
  ('water', 'm3', 0.14900, 3, '2025-01-01', '2025-12-31'),
  ('water', 'm3', 0.14900, 3, '2026-01-01', '2026-12-31');
