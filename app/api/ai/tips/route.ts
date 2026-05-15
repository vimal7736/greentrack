import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const HUGGINGFACE_API_URL = "https://router.huggingface.co/v1/chat/completions";

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const token = process.env.HUGGINGFACE_TOKEN;
  if (!token || token === "hf_your_token_here") {
    return NextResponse.json({ 
      error: "Hugging Face token not configured. Please add HUGGINGFACE_TOKEN to your .env.local file." 
    }, { status: 500 });
  }

  try {
    const { 
      ytdCo2, 
      annualTarget, 
      reductionPct, 
      billTypes,
      sbtiPathway 
    } = await request.json();

    const prompt = `Give a short carbon reduction tip for an organisation using ${ytdCo2}kg CO2 with these emission sources: ${billTypes.join(", ")}. Keep it under 200 characters.`;

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
    });

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text();
      console.error("HF Error Body:", errorText);
      return NextResponse.json({ error: `HF Error: ${hfResponse.status}` }, { status: hfResponse.status });
    }

    const result = await hfResponse.json();
    const tip = result.choices?.[0]?.message?.content || "No tip generated.";

    return NextResponse.json({ tip: tip.trim() });

  } catch (err: any) {
    console.error("AI Tips Route Error:", err);
    return NextResponse.json({ error: "An error occurred." }, { status: 500 });
  }
}
