"use client";

import { useState } from "react";
import { Sparkles, RefreshCw, Brain, Lightbulb, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface AITipAdvisorProps {
  ytdCo2: number;
  annualTarget: number;
  reductionPct: number;
  billTypes: string[];
  sbtiPathway: string;
}

export function AITipAdvisor({
  ytdCo2,
  annualTarget,
  reductionPct,
  billTypes,
  sbtiPathway
}: AITipAdvisorProps) {
  const [tip, setTip] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTip = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ytdCo2,
          annualTarget,
          reductionPct,
          billTypes,
          sbtiPathway
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get tip");
      setTip(data.tip);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="premium-card p-5 sm:p-7 relative overflow-hidden group">
      {/* Decorative Gradient Background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/10 blur-[60px] rounded-full -mr-10 -mt-10 group-hover:bg-brand-green/20 transition-colors duration-700" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-brand-orange/5 blur-[50px] rounded-full -ml-10 -mb-10 group-hover:bg-brand-orange/10 transition-colors duration-700" />

      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gt-green-500/10 flex items-center justify-center border border-gt-green-500/20">
              <Brain className="w-5 h-5 text-gt-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-black text-text-primary tracking-tight">AI Strategy Advisor</h3>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Powered by Hugging Face</p>
            </div>
          </div>
          {tip && (
            <button
              onClick={fetchTip}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-bg-inset transition-colors text-text-muted hover:text-gt-green-600 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>

        {!tip && !loading && !error && (
          <div className="py-4 text-center space-y-4">
            <p className="text-[11px] text-text-muted leading-relaxed font-medium">
              Let our AI analyze your emission patterns and targets to suggest a high-impact reduction strategy.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={fetchTip}
              className="w-full bg-gradient-to-r from-gt-green-600 to-gt-green-500 hover:from-gt-green-500 hover:to-gt-green-400 border-none shadow-lg shadow-gt-green-500/20"
            >
              <Sparkles className="w-4 h-4 mr-2" /> Generate AI Insight
            </Button>
          </div>
        )}

        {loading && (
          <div className="py-8 flex flex-col items-center justify-center space-y-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-gt-green-500/20 border-t-gt-green-600 animate-spin" />
              <Sparkles className="w-4 h-4 text-gt-green-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gt-green-600 animate-pulse">
              Analyzing trajectories...
            </p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 space-y-2">
            <div className="flex items-center gap-2 text-red-500">
              <AlertCircle className="w-4 h-4" />
              <span className="text-[11px] font-black uppercase tracking-wider">Analysis Failed</span>
            </div>
            <p className="text-[11px] text-red-400/80 font-medium leading-relaxed">
              {error.includes("token not configured")
                ? "Hugging Face token is missing in .env.local"
                : error}
            </p>
            <Button variant="secondary" size="sm" onClick={fetchTip} className="text-[9px] h-7">
              Try Again
            </Button>
          </div>
        )}

        {tip && !loading && (
          <div className="relative p-4 rounded-2xl bg-bg-inset border border-border-subtle group/tip overflow-hidden">
            {/* Sparkle decoration */}
            <div className="absolute -top-1 -right-1 opacity-20 group-hover/tip:opacity-100 transition-opacity">
              <Sparkles className="w-8 h-8 text-gt-green-600/20" />
            </div>

            <div className="flex gap-3 items-start">
              <div className="mt-1 flex-shrink-0">
                <Lightbulb className="w-4 h-4 text-brand-orange" />
              </div>
              <div className="space-y-2">
                <p className="text-[12px] text-text-primary font-medium leading-relaxed italic">
                  "{tip}"
                </p>
                <div className="flex items-center gap-2">
                  <div className="h-[1px] w-4 bg-border-subtle" />
                  <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">
                    Recommended Action
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
