import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/bills/ocr
 * Sends the uploaded PDF (via signed URL) to Mindee OCR API.
 * Returns extracted: supplier, usage, unit, amount_due, bill_period, account_number.
 *
 * Mindee InvoiceV4 model is used — it reads energy bills reliably.
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { signedUrl, billType } = await request.json();

  if (!signedUrl) {
    return NextResponse.json({ error: "No file URL provided" }, { status: 400 });
  }

  try {
    // ── Call Mindee API ────────────────────────────────────────────────────
    // Using REST API directly (no SDK needed) for simplicity
    const mindeeResponse = await fetch(
      "https://api.mindee.net/v1/products/mindee/invoices/v4/predict",
      {
        method: "POST",
        headers: {
          Authorization: `Token ${process.env.MINDEE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ document: signedUrl }),
      }
    );

    if (!mindeeResponse.ok) {
      throw new Error(`Mindee API error: ${mindeeResponse.status}`);
    }

    const mindeeData = await mindeeResponse.json();
    const prediction = mindeeData.document?.inference?.prediction;

    if (!prediction) {
      throw new Error("No prediction returned from Mindee");
    }

    // ── Extract relevant fields ────────────────────────────────────────────
    // Mindee returns confidence scores — we extract the values
    const supplier = prediction.supplier_name?.value ?? null;
    const amount_due = prediction.total_amount?.value ?? null;
    const account_number = prediction.supplier_payment_details?.[0]?.account_number ?? null;

    // Bill period from invoice dates
    const invoiceDate = prediction.invoice_date?.value ?? null;
    const dueDate = prediction.due_date?.value ?? null;
    const bill_period = invoiceDate && dueDate ? `${invoiceDate} – ${dueDate}` : invoiceDate;

    // ── Extract usage from line items ──────────────────────────────────────
    // Energy bills list kWh usage in line items
    let usage: number | null = null;
    let unit: string | null = null;

    const lineItems = prediction.line_items ?? [];
    for (const item of lineItems) {
      const desc = (item.description ?? "").toLowerCase();

      // Look for kWh in line items (electricity and gas bills)
      if (desc.includes("kwh") || desc.includes("unit")) {
        usage = item.quantity ?? null;
        unit = "kWh";
        break;
      }
      // Look for litres (fuel bills)
      if (desc.includes("litre") || desc.includes("liter") || desc.includes("l ")) {
        usage = item.quantity ?? null;
        unit = "litre";
        break;
      }
      // Look for cubic metres (gas volume bills)
      if (desc.includes("m³") || desc.includes("m3") || desc.includes("cubic")) {
        usage = item.quantity ?? null;
        unit = "m3";
        break;
      }
    }

    // Fallback: if unit can be inferred from bill type
    if (!unit) {
      const unitDefaults: Record<string, string> = {
        electricity: "kWh",
        gas: "kWh",
        water: "m3",
        fuel_diesel: "litre",
        fuel_petrol: "litre",
      };
      unit = unitDefaults[billType] ?? "kWh";
    }

    return NextResponse.json({
      supplier,
      bill_period,
      usage,
      unit,
      amount_due,
      account_number,
      // Pass raw prediction back so we can store it in bills.ocr_raw
      raw: prediction,
    });

  } catch (err) {
    console.error("Mindee OCR error:", err);
    return NextResponse.json(
      { error: "OCR processing failed. Please enter values manually." },
      { status: 500 }
    );
  }
}
