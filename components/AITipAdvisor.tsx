"use client";

import { useState } from "react";
import { Sparkles, RefreshCw, Brain, Lightbulb, AlertCircle, Plus, Cpu, Blocks } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface AITipAdvisorProps {
  ytdCo2: number;
  annualTarget: number;
  reductionPct: number;
  billTypes: string[];
  sbtiPathway: string;
  onAddStrategy?: (tip: string) => void;
}

export function AITipAdvisor({
  ytdCo2,
  annualTarget,
  reductionPct,
  billTypes,
  sbtiPathway,
  onAddStrategy
}: AITipAdvisorProps) {
  const [tip, setTip] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  const [added, setAdded] = useState(false);

  const fetchTip = async () => {
    setLoading(true);
    setError(null);
    setAdded(false);
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
      setIsFallback(data.isFallback || false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="premium-card p-4 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/10 blur-[60px] rounded-full -mr-10 -mt-10 group-hover:bg-brand-green/20 transition-colors duration-700" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gt-green-500/5 blur-[50px] rounded-full -ml-10 -mb-10 group-hover:bg-gt-green-500/10 transition-colors duration-700" />

      <div className="relative z-10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8.5 h-8.5 rounded-lg bg-gt-green-500/10 flex items-center justify-center border border-gt-green-500/20 shadow-[0_0_12px_rgba(34,197,94,0.1)]">
              <Brain className="w-4.5 h-4.5 text-gt-green-600" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-black text-text-primary tracking-tight">AI Strategy Advisor</h3>
                {tip && (
                  <span 
                    className={`text-[7px] font-black uppercase tracking-wider px-1 py-0.5 rounded-md flex items-center gap-0.5 ${
                      isFallback 
                        ? "bg-gt-green-500/10 text-gt-green-600 border border-gt-green-500/20" 
                        : "bg-purple-500/10 text-purple-600 border border-purple-500/20"
                    }`}
                  >
                    {isFallback ? <Cpu className="w-2.5 h-2.5" /> : <Blocks className="w-2.5 h-2.5" />}
                    {isFallback ? "Engine" : "HF AI"}
                  </span>
                )}
              </div>
              <p className="text-[8.5px] font-bold text-text-muted uppercase tracking-widest">Powered by Hugging Face</p>
            </div>
          </div>
          {tip && (
            <button
              onClick={fetchTip}
              disabled={loading}
              className="p-1.5 rounded-lg hover:bg-bg-inset transition-colors text-text-muted hover:text-gt-green-600 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>

        {!tip && !loading && !error && (
          <div className="py-2 text-center space-y-3">
            <p className="text-[10px] text-text-muted leading-relaxed font-medium">
              Let our AI analyze your emission patterns and targets to suggest a high-impact reduction strategy.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={fetchTip}
              className="w-full text-[9px] py-2 bg-gradient-to-r from-gt-green-600 to-gt-green-500 hover:from-gt-green-500 hover:to-gt-green-400 border-none shadow-lg shadow-gt-green-500/20"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Generate AI Insight
            </Button>
          </div>
        )}

        {loading && (
          <div className="py-5 flex flex-col items-center justify-center space-y-2">
            <div className="relative">
              <div className="w-10 h-10 rounded-full border-2 border-gt-green-500/20 border-t-gt-green-600 animate-spin" />
              <Sparkles className="w-3.5 h-3.5 text-gt-green-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest text-gt-green-600 animate-pulse font-mono">
              Analyzing trajectories...
            </p>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10 space-y-1.5">
            <div className="flex items-center gap-1.5 text-red-500">
              <AlertCircle className="w-3.5 h-3.5" />
              <span className="text-[9px] font-black uppercase tracking-wider">Analysis Failed</span>
            </div>
            <p className="text-[10px] text-red-400/80 font-medium leading-relaxed">
              {error.includes("token not configured")
                ? "Hugging Face token is missing in .env.local"
                : error}
            </p>
            <Button variant="secondary" size="sm" onClick={fetchTip} className="text-[8px] h-6 px-2.5">
              Try Again
            </Button>
          </div>
        )}

        {tip && !loading && (
          <div className="space-y-3">
            <div className="relative p-3 rounded-xl bg-bg-inset border border-border-subtle group/tip overflow-hidden">
              {/* Sparkle decoration */}
              <div className="absolute -top-1 -right-1 opacity-20 group-hover/tip:opacity-100 transition-opacity">
                <Sparkles className="w-6 h-6 text-gt-green-600/20" />
              </div>

              <div className="flex gap-2.5 items-start">
                <div className="mt-0.5 flex-shrink-0">
                  <Lightbulb className="w-3.5 h-3.5 text-gt-green-600" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[11px] text-text-primary font-medium leading-normal italic">
                    "{tip}"
                  </p>
                  <div className="flex items-center gap-1.5">
                    <div className="h-[1px] w-3 bg-border-subtle" />
                    <span className="text-[8px] font-black text-text-muted uppercase tracking-widest font-mono">
                      Recommended Action
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {onAddStrategy && (
              <Button
                variant={added ? "secondary" : "primary"}
                size="sm"
                disabled={added}
                onClick={() => {
                  onAddStrategy(tip);
                  setAdded(true);
                }}
                className={`w-full text-[9px] py-2 font-black uppercase tracking-widest transition-all ${
                  added 
                    ? "bg-gt-green-500/10 text-gt-green-600 border border-gt-green-500/20 shadow-none hover:bg-gt-green-500/10" 
                    : "bg-gt-green-600 hover:bg-gt-green-500 shadow-md"
                }`}
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                {added ? "Added to Action Plan!" : "Add to Action Plan"}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
