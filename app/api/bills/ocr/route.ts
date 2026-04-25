import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/ratelimit";
import * as mindee from "mindee";

const mindeeClient = new mindee.Client({ apiKey: process.env.MINDEE_API_KEY! });

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { success } = await checkRateLimit("ocr", user.id);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded. Please try again in a minute." }, { status: 429 });
  }

  const { signedUrl, billType } = await request.json();
  if (!signedUrl) {
    return NextResponse.json({ error: "No file URL provided" }, { status: 400 });
  }

  try {
    // Download the PDF from Supabase then pass bytes to Mindee SDK
    const fileRes = await fetch(signedUrl);
    if (!fileRes.ok) {
      return NextResponse.json(
        { error: `Failed to fetch bill from storage: ${fileRes.status}` },
        { status: 500 }
      );
    }

    const fileBuffer = await fileRes.arrayBuffer();
    const inputSource = new mindee.BytesInput({ inputBytes: Buffer.from(fileBuffer), filename: "bill.pdf" });

    const response = await mindeeClient.enqueueAndGetResult(
      mindee.product.Ocr,
      inputSource,
      { modelId: process.env.MINDEE_MODEL_ID! }
    );

    // Each OcrPage has a .content string (full page text) and .words array
    const pages = (response as any).inference.result?.pages ?? [];
    const fullText = pages
      .map((p: any) => p.content ?? p.words?.map((w: any) => w.content ?? "").join(" ") ?? "")
      .join(" ");

    const supplier   = extractSupplier(fullText);
    const amount_due = extractAmount(fullText);
    const bill_period = extractDate(fullText);
    const { usage, unit: detectedUnit } = extractUsage(fullText);

    const unitDefaults: Record<string, string> = {
      electricity: "kWh", gas: "kWh", water: "m3",
      fuel_diesel: "litre", fuel_petrol: "litre",
    };
    const unit = detectedUnit ?? unitDefaults[billType] ?? "kWh";

    return NextResponse.json({
      supplier,
      bill_period,
      usage,
      unit,
      amount_due,
      account_number: null,
      raw: { pages },
    });

  } catch (err: any) {
    console.error("Mindee OCR error:", err?.message ?? err);
    return NextResponse.json(
      { error: `OCR failed: ${err?.message ?? "Unknown error"}. Please enter values manually.` },
      { status: 500 }
    );
  }
}

function extractSupplier(text: string): string | null {
  const known = [
    "British Gas", "EDF Energy", "EDF", "E.ON", "EON", "Octopus Energy",
    "OVO Energy", "Shell Energy", "Scottish Power", "SSE", "npower",
    "Bulb", "Centrica", "Thames Water", "Severn Trent", "United Utilities",
    "Anglian Water", "Southern Water", "Yorkshire Water",
  ];
  for (const s of known) {
    if (text.toLowerCase().includes(s.toLowerCase())) return s;
  }
  return null;
}

function extractAmount(text: string): number | null {
  const m = text.match(/(?:total|amount due|balance due|please pay)[^\d£]*£?\s*(\d[\d,]*\.?\d*)/i)
           ?? text.match(/£\s*(\d[\d,]*\.\d{2})/);
  if (!m) return null;
  return parseFloat(m[1].replace(/,/g, ""));
}

function extractDate(text: string): string | null {
  const m = text.match(/\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b/);
  return m ? m[1] : null;
}

function extractUsage(text: string): { usage: number | null; unit: string | null } {
  const kwh = text.match(/(\d[\d,]*\.?\d*)\s*kWh/i);
  if (kwh) return { usage: parseFloat(kwh[1].replace(/,/g, "")), unit: "kWh" };

  const litre = text.match(/(\d[\d,]*\.?\d*)\s*litre/i);
  if (litre) return { usage: parseFloat(litre[1].replace(/,/g, "")), unit: "litre" };

  const m3 = text.match(/(\d[\d,]*\.?\d*)\s*m[³3]/i);
  if (m3) return { usage: parseFloat(m3[1].replace(/,/g, "")), unit: "m3" };

  return { usage: null, unit: null };
}
