import { requireSuperadmin } from "@/lib/admin/auth";
import { NextResponse } from "next/server";

const FACTORS = [
  // Electricity — Scope 2, UK grid average (DEFRA 2024)
  { fuel_type: "electricity", unit: "kWh", kg_co2e_per_unit: 0.20493, scope: 2, valid_from: "2023-01-01", valid_to: "2023-12-31" },
  { fuel_type: "electricity", unit: "kWh", kg_co2e_per_unit: 0.20493, scope: 2, valid_from: "2024-01-01", valid_to: "2024-12-31" },
  { fuel_type: "electricity", unit: "kWh", kg_co2e_per_unit: 0.20493, scope: 2, valid_from: "2025-01-01", valid_to: "2025-12-31" },
  { fuel_type: "electricity", unit: "kWh", kg_co2e_per_unit: 0.20493, scope: 2, valid_from: "2026-01-01", valid_to: "2026-12-31" },

  // Natural Gas — Scope 1, gross calorific value (DEFRA 2024)
  { fuel_type: "gas", unit: "kWh", kg_co2e_per_unit: 0.18253, scope: 1, valid_from: "2023-01-01", valid_to: "2023-12-31" },
  { fuel_type: "gas", unit: "kWh", kg_co2e_per_unit: 0.18253, scope: 1, valid_from: "2024-01-01", valid_to: "2024-12-31" },
  { fuel_type: "gas", unit: "kWh", kg_co2e_per_unit: 0.18253, scope: 1, valid_from: "2025-01-01", valid_to: "2025-12-31" },
  { fuel_type: "gas", unit: "kWh", kg_co2e_per_unit: 0.18253, scope: 1, valid_from: "2026-01-01", valid_to: "2026-12-31" },

  // Diesel — Scope 1, per litre (DEFRA 2024)
  { fuel_type: "fuel_diesel", unit: "litre", kg_co2e_per_unit: 2.50917, scope: 1, valid_from: "2023-01-01", valid_to: "2023-12-31" },
  { fuel_type: "fuel_diesel", unit: "litre", kg_co2e_per_unit: 2.50917, scope: 1, valid_from: "2024-01-01", valid_to: "2024-12-31" },
  { fuel_type: "fuel_diesel", unit: "litre", kg_co2e_per_unit: 2.50917, scope: 1, valid_from: "2025-01-01", valid_to: "2025-12-31" },
  { fuel_type: "fuel_diesel", unit: "litre", kg_co2e_per_unit: 2.50917, scope: 1, valid_from: "2026-01-01", valid_to: "2026-12-31" },

  // Petrol — Scope 1, per litre (DEFRA 2024)
  { fuel_type: "fuel_petrol", unit: "litre", kg_co2e_per_unit: 2.27792, scope: 1, valid_from: "2023-01-01", valid_to: "2023-12-31" },
  { fuel_type: "fuel_petrol", unit: "litre", kg_co2e_per_unit: 2.27792, scope: 1, valid_from: "2024-01-01", valid_to: "2024-12-31" },
  { fuel_type: "fuel_petrol", unit: "litre", kg_co2e_per_unit: 2.27792, scope: 1, valid_from: "2025-01-01", valid_to: "2025-12-31" },
  { fuel_type: "fuel_petrol", unit: "litre", kg_co2e_per_unit: 2.27792, scope: 1, valid_from: "2026-01-01", valid_to: "2026-12-31" },

  // Water — Scope 3, supply + treatment per m³ (DEFRA 2024)
  { fuel_type: "water", unit: "m3", kg_co2e_per_unit: 0.14900, scope: 3, valid_from: "2023-01-01", valid_to: "2023-12-31" },
  { fuel_type: "water", unit: "m3", kg_co2e_per_unit: 0.14900, scope: 3, valid_from: "2024-01-01", valid_to: "2024-12-31" },
  { fuel_type: "water", unit: "m3", kg_co2e_per_unit: 0.14900, scope: 3, valid_from: "2025-01-01", valid_to: "2025-12-31" },
  { fuel_type: "water", unit: "m3", kg_co2e_per_unit: 0.14900, scope: 3, valid_from: "2026-01-01", valid_to: "2026-12-31" },
];

export async function POST() {
  const result = await requireSuperadmin();
  if ("error" in result) return result.error;
  const admin = result.admin;

  const { error } = await admin
    .from("emission_factors")
    .upsert(FACTORS, {
      onConflict: "fuel_type,unit,valid_from",
      ignoreDuplicates: false,
    });

  if (error) {
    console.error("[seed factors]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, inserted: FACTORS.length });
}
