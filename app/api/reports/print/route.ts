import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const SCOPE_LABELS: Record<string, string> = {
  electricity: "Scope 2",
  gas: "Scope 1",
  fuel_diesel: "Scope 1",
  fuel_petrol: "Scope 1",
  water: "Scope 3",
};

const TYPE_LABELS: Record<string, string> = {
  electricity: "UK Electricity",
  gas: "Natural Gas",
  fuel_diesel: "Diesel",
  fuel_petrol: "Petrol",
  water: "Water",
};

/**
 * GET /api/reports/print?year=2025
 * Returns a print-optimized HTML page for the SECR carbon report.
 * Opens in a new browser tab; user clicks "Print / Save as PDF".
 */
export async function GET(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorised", { status: 401 });

  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year") ?? new Date().getFullYear().toString();

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, organisations(name)")
    .eq("id", user.id)
    .single();

  if (!profile?.org_id) return new NextResponse("No organisation found", { status: 404 });

  const org = (Array.isArray(profile.organisations) ? profile.organisations[0] : profile.organisations) as { name: string } | null;
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;

  const { data: billsData } = await supabase
    .from("bills")
    .select("bill_type, bill_date, usage_amount, usage_unit, co2_kg")
    .eq("org_id", profile.org_id)
    .gte("bill_date", from)
    .lte("bill_date", to)
    .order("bill_date", { ascending: true });

  const bills = billsData ?? [];

  const totalCo2 = bills.reduce((s, b) => s + (b.co2_kg ?? 0), 0);
  const totalKwh = bills.filter((b) => b.usage_unit === "kWh").reduce((s, b) => s + (b.usage_amount ?? 0), 0);

  const byType: Record<string, number> = {};
  for (const b of bills) {
    byType[b.bill_type] = (byType[b.bill_type] ?? 0) + (b.co2_kg ?? 0);
  }

  const scope1Types = ["gas", "fuel_diesel", "fuel_petrol"];
  const scope2Types = ["electricity"];
  const scope1 = bills.filter((b) => scope1Types.includes(b.bill_type)).reduce((s, b) => s + (b.co2_kg ?? 0), 0);
  const scope2 = bills.filter((b) => scope2Types.includes(b.bill_type)).reduce((s, b) => s + (b.co2_kg ?? 0), 0);

  const orgName = org?.name ?? "Organisation";
  const generatedDate = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const tableRows = Object.entries(byType).map(([type, co2]) => `
    <tr>
      <td>${TYPE_LABELS[type] ?? type}</td>
      <td class="${scope1Types.includes(type) ? "scope1" : scope2Types.includes(type) ? "scope2" : "scope3"}">${SCOPE_LABELS[type] ?? "Scope 3"}</td>
      <td style="text-align:right">${co2.toFixed(2)}</td>
      <td style="text-align:right">${totalCo2 > 0 ? ((co2 / totalCo2) * 100).toFixed(1) : "0"}%</td>
    </tr>`).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${orgName} — Carbon Report ${year}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    * { box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11pt; color: #1a1a1a; margin: 0; padding: 0; }
    .header { background: #14532d; color: white; padding: 24px 32px; display: flex; justify-content: space-between; align-items: flex-end; }
    .header h1 { margin: 0 0 4px; font-size: 20pt; }
    .header p { margin: 0; opacity: 0.8; font-size: 10pt; }
    .header-right { text-align: right; font-size: 9pt; opacity: 0.8; }
    .body { padding: 24px 32px; }
    .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 20px 0; }
    .stat-box { background: #f8faf8; border: 1px solid #e2e8e2; border-radius: 8px; padding: 12px 16px; }
    .stat-box .label { font-size: 9pt; color: #666; margin-bottom: 4px; }
    .stat-box .value { font-size: 16pt; font-weight: bold; color: #14532d; }
    .stat-box .note { font-size: 8pt; color: #999; margin-top: 2px; }
    h2 { font-size: 11pt; color: #14532d; border-bottom: 1px solid #d1fae5; padding-bottom: 6px; margin-top: 24px; }
    table { width: 100%; border-collapse: collapse; font-size: 10pt; margin-top: 8px; }
    thead tr { border-bottom: 2px solid #14532d; }
    th { padding: 6px 8px; text-align: left; font-size: 9pt; color: #555; font-weight: 600; }
    td { padding: 6px 8px; border-bottom: 1px solid #f0f0f0; }
    .scope1 { color: #d97706; }
    .scope2 { color: #2563eb; }
    .scope3 { color: #0891b2; }
    .total-row td { font-weight: bold; border-top: 2px solid #14532d; border-bottom: none; padding-top: 10px; }
    .scope-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 12px 0; }
    .scope-box { border-radius: 6px; padding: 10px 14px; text-align: center; }
    .s1 { background: #fffbeb; } .s1 .slabel { color: #d97706; font-weight:600;font-size:9pt; } .s1 .sval { color: #92400e; font-size:14pt;font-weight:bold; }
    .s2 { background: #eff6ff; } .s2 .slabel { color: #2563eb; font-weight:600;font-size:9pt; } .s2 .sval { color: #1e3a8a; font-size:14pt;font-weight:bold; }
    .s3 { background: #ecfeff; } .s3 .slabel { color: #0891b2; font-weight:600;font-size:9pt; } .s3 .sval { color: #164e63; font-size:14pt;font-weight:bold; }
    .footer { margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 12px; font-size: 8pt; color: #999; }
    .print-btn { position: fixed; top: 16px; right: 16px; background: #16a34a; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 13px; z-index: 999; }
    @media print { .print-btn { display: none; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">⬇ Download PDF</button>
  <div class="header">
    <div><h1>${orgName}</h1><p>Carbon Emissions Report · ${year} · SECR Compliant</p></div>
    <div class="header-right"><p>GreenTrack AI</p><p>Generated: ${generatedDate}</p><p>2025 DEFRA Emission Factors</p></div>
  </div>
  <div class="body">
    <h2>Executive Summary</h2>
    <div class="summary-grid">
      <div class="stat-box"><div class="label">Total CO₂ Emissions</div><div class="value">${(totalCo2 / 1000).toFixed(3)}</div><div class="note">tonnes CO₂e (Scope 1+2)</div></div>
      <div class="stat-box"><div class="label">Total Energy Used</div><div class="value">${Math.round(totalKwh).toLocaleString()}</div><div class="note">kWh electricity + gas</div></div>
      <div class="stat-box"><div class="label">Bills Analysed</div><div class="value">${bills.length}</div><div class="note">utility bills in ${year}</div></div>
    </div>
    <h2>Scope Breakdown (SECR)</h2>
    <div class="scope-grid">
      <div class="scope-box s1"><div class="slabel">Scope 1</div><div class="sval">${Math.round(scope1)} kg</div><div style="font-size:8pt;color:#92400e;margin-top:2px">Gas + Fuel (direct)</div></div>
      <div class="scope-box s2"><div class="slabel">Scope 2</div><div class="sval">${Math.round(scope2)} kg</div><div style="font-size:8pt;color:#1e3a8a;margin-top:2px">Electricity (indirect)</div></div>
      <div class="scope-box s3"><div class="slabel">Scope 3</div><div class="sval">${Math.round(totalCo2 - scope1 - scope2)} kg</div><div style="font-size:8pt;color:#164e63;margin-top:2px">Water (value chain)</div></div>
    </div>
    <h2>Emissions by Source</h2>
    <table>
      <thead><tr><th>Energy Source</th><th>GHG Scope</th><th style="text-align:right">kgCO₂e</th><th style="text-align:right">% of Total</th></tr></thead>
      <tbody>
        ${tableRows}
        <tr class="total-row"><td>Total</td><td></td><td style="text-align:right">${totalCo2.toFixed(2)}</td><td style="text-align:right">100%</td></tr>
      </tbody>
    </table>
    <div class="footer">
      <p>Emission factors sourced from UK Government Greenhouse Gas Conversion Factors for Company Reporting (DESNZ, 2025). Report generated by GreenTrack AI — <strong>${orgName}</strong>. This report covers the period 1 January ${year} to 31 December ${year}.</p>
    </div>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
