import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const HUGGINGFACE_API_URL = "https://router.huggingface.co/v1/chat/completions";

// Fallback UK DEFRA-compliant Carbon Strategies based on bill type
const FALLBACK_TIPS: Record<string, string[]> = {
  electricity: [
    "Transition to a 100% verified green REGO tariff to instantly zero your Scope 2 electricity emissions, reducing your carbon baseline by up to 40%.",
    "Upgrading to intelligent high-efficiency LED panels with occupancy sensors typically cuts facility electricity demand by 15% with a sub-12 month ROI.",
    "Installing rooftop solar arrays can offset up to 35% of your grid demand, shielding your business from tariff spikes and locking in long-term Net Zero gains."
  ],
  gas: [
    "Optimizing boiler flow temperatures down to 55°C and sealing building envelope drafts cuts Scope 1 gas footprint by 8-12% with near-zero capital outlay.",
    "Transitioning to commercial air-source heat pumps eliminates fossil-gas reliance, cutting thermal scope emissions by up to 60% over the system lifetime."
  ],
  fuel: [
    "Electrifying company transport fleets or introducing salary-sacrifice EV schemes slashes fleet scope emissions by 70% under DEFRA guidelines.",
    "Route optimization: Implementing smart telematics and driver eco-coaching typically yields an immediate 10-15% reduction in diesel/petrol consumption."
  ],
  general: [
    "Lowering your corporate facility thermostats by just 1°C in winter can reduce space-heating emissions and gas utility bills by up to 8% immediately.",
    "Installing smart timed power-strips for standby office equipment eliminates 'phantom' power loads, cutting idle weekend energy draw by 22%."
  ]
};

function getFallbackTip(billTypes: string[]): string {
  const sources = billTypes.map(t => t.toLowerCase());
  let pool: string[] = [];

  if (sources.some(s => s.includes("electri"))) {
    pool = pool.concat(FALLBACK_TIPS.electricity);
  }
  if (sources.some(s => s.includes("gas"))) {
    pool = pool.concat(FALLBACK_TIPS.gas);
  }
  if (sources.some(s => s.includes("fuel") || s.includes("diesel") || s.includes("petrol") || s.includes("car"))) {
    pool = pool.concat(FALLBACK_TIPS.fuel);
  }
  
  if (pool.length === 0) {
    pool = FALLBACK_TIPS.general;
  }

  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  let ytdCo2 = 0;
  let annualTarget = 5000;
  let reductionPct = 7;
  let billTypes: string[] = [];
  let sbtiPathway = "1.5c";

  try {
    const body = await request.json();
    ytdCo2 = body.ytdCo2 || 0;
    annualTarget = body.annualTarget || 5000;
    reductionPct = body.reductionPct || 7;
    billTypes = body.billTypes || [];
    sbtiPathway = body.sbtiPathway || "1.5c";
  } catch (e) {
    // Keep defaults
  }

  const token = process.env.HUGGINGFACE_TOKEN;
  
  // Safe check for unconfigured token -> immediate localized response
  if (!token || token === "hf_your_token_here") {
    console.log("[AI TIPS] Token not configured. Serving local strategy.");
    return NextResponse.json({ 
      tip: getFallbackTip(billTypes),
      isFallback: true
    });
  }

  try {
    const prompt = `Give a short carbon reduction tip for an organisation using ${ytdCo2}kg CO2 with these emission sources: ${billTypes.join(", ")}. Keep it under 200 characters.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const hfResponse = await fetch(HUGGINGFACE_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "Qwen/Qwen2.5-7B-Instruct:fastest",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 100,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text();
      console.warn("[AI TIPS] Hugging Face returned error, invoking local engine:", errorText);
      return NextResponse.json({ 
        tip: getFallbackTip(billTypes),
        isFallback: true
      });
    }

    const result = await hfResponse.json();
    const tip = result.choices?.[0]?.message?.content || "No tip generated.";

    return NextResponse.json({ 
      tip: tip.trim(),
      isFallback: false 
    });

  } catch (err: any) {
    console.warn("[AI TIPS] Connection failed, invoking local fallback engine:", err);
    return NextResponse.json({ 
      tip: getFallbackTip(billTypes),
      isFallback: true 
    });
  }
}

