"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Brain, Trash2, CheckCircle2, ListTodo, Sparkles, Leaf,
  Zap, ThermometerSun, Car, Award, PartyPopper, Sliders,
  Target, TrendingDown, Check, Info, Filter
} from "lucide-react";

import { useBillsHistory } from "@/hooks/useBillsHistory";
import { useTargets } from "@/hooks/useTargets";
import { buildMonthlyMap } from "@/lib/carbon/aggregate";
import { PageLayout } from "@/components/ui/PageLayout";
import { AITipAdvisor } from "@/components/AITipAdvisor";
import { RangeSlider } from "@/components/ui/RangeSlider";

interface RoadmapTask {
  id: string;
  text: string;
  category: "electricity" | "gas" | "fuel" | "general";
  savingsKg: number;
  completed: boolean;
  createdAt: string;
}

export default function TargetsPage() {
  const { bills, loading: billsLoading } = useBillsHistory(2);
  const { target: saved, loading: targetLoading, saveTarget, saving } = useTargets();

  const [annualTarget, setAnnualTarget] = useState(5000);
  const [reductionPct, setReductionPct] = useState(7);
  const [sbtiPathway, setSbtiPathway] = useState<"1.5c" | "wbb2c" | "2c">("1.5c");
  const [monthlyData, setMonthlyData] = useState<{ month: string; co2: number }[]>([]);
  const [roadmap, setRoadmap] = useState<RoadmapTask[]>([]);
  const [activeFilter, setActiveFilter] = useState<"all" | "pending" | "completed" | "electricity" | "gas" | "fuel">("all");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [targetMode, setTargetMode] = useState<"manual" | "ai">("manual");

  useEffect(() => {
    if (!saved) return;
    setAnnualTarget(saved.annual_carbon_cap_kg);
    setReductionPct(saved.yearly_reduction_rate);
    setSbtiPathway((saved.sbti_pathway as "1.5c" | "wbb2c" | "2c") ?? "1.5c");
  }, [saved]);

  useEffect(() => {
    const cached = localStorage.getItem("greentrack_ai_roadmap");
    if (cached) {
      try {
        setRoadmap(JSON.parse(cached));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveRoadmap = (updated: RoadmapTask[]) => {
    setRoadmap(updated);
    localStorage.setItem("greentrack_ai_roadmap", JSON.stringify(updated));
  };

  const handleAddStrategy = (text: string) => {
    const textLower = text.toLowerCase();
    let category: RoadmapTask["category"] = "general";
    let savingsKg = 500;

    if (textLower.includes("electri") || textLower.includes("solar") || textLower.includes("rego") || textLower.includes("led") || textLower.includes("lighting")) {
      category = "electricity";
      savingsKg = 1500;
    } else if (textLower.includes("gas") || textLower.includes("heat pump") || textLower.includes("boiler") || textLower.includes("thermostat") || textLower.includes("heating")) {
      category = "gas";
      savingsKg = 2200;
    } else if (textLower.includes("fleet") || textLower.includes("ev") || textLower.includes("diesel") || textLower.includes("petrol") || textLower.includes("transport") || textLower.includes("logistic")) {
      category = "fuel";
      savingsKg = 3100;
    }

    const newTask: RoadmapTask = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      text,
      category,
      savingsKg,
      completed: false,
      createdAt: new Date().toISOString()
    };

    saveRoadmap([newTask, ...roadmap]);
  };

  const handleToggleComplete = (id: string) => {
    const updated = roadmap.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveRoadmap(updated);
  };

  const handleDeleteTask = (id: string) => {
    const updated = roadmap.filter(t => t.id !== id);
    saveRoadmap(updated);
  };

  const baseline = useMemo(() => {
    const map = buildMonthlyMap(bills, 24);
    const cnt = Object.keys(map).length;
    const total = Object.values(map).reduce((s, v) => s + v, 0);
    const avg = cnt > 0 ? total / cnt : 0;
    return Math.round(avg * 12) || 5000;
  }, [bills]);

  const displayedCap = useMemo(() => {
    return targetMode === "ai" ? Math.round(baseline * 0.85) : annualTarget;
  }, [targetMode, baseline, annualTarget]);

  const displayedRate = useMemo(() => {
    return targetMode === "ai" ? 10 : reductionPct;
  }, [targetMode, reductionPct]);

  const displayedPathway = useMemo(() => {
    return targetMode === "ai" ? "1.5c" : sbtiPathway;
  }, [targetMode, sbtiPathway]);

  const handleSaveTargetSettings = async () => {
    const ok = await saveTarget({
      annual_carbon_cap_kg: displayedCap,
      yearly_reduction_rate: displayedRate,
      sbti_pathway: displayedPathway,
    });
    if (ok) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  useEffect(() => {
    if (billsLoading) return;
    const map = buildMonthlyMap(bills, 24);
    if (!saved) setAnnualTarget(Math.round((Object.values(map).reduce((s, v) => s + v, 0) / Object.keys(map).length) * 12 * 0.85));

    setMonthlyData(
      Object.entries(map).map(([ym, co2]) => ({
        month: ym.slice(0, 7),
        co2: Math.round(co2 * 10) / 10,
      }))
    );
  }, [bills, billsLoading, saved]);

  const now = new Date();
  const thisYear = now.getFullYear().toString();
  const ytdCo2 = monthlyData.filter((d) => d.month.startsWith(thisYear)).reduce((s, d) => s + d.co2, 0);

  const loading = billsLoading || targetLoading;

  const filteredTasks = useMemo(() => {
    return roadmap.filter((t) => {
      if (activeFilter === "all") return true;
      if (activeFilter === "pending") return !t.completed;
      if (activeFilter === "completed") return t.completed;
      return t.category === activeFilter;
    });
  }, [roadmap, activeFilter]);

  const totalTasks = roadmap.length;
  const completedTasks = roadmap.filter(t => t.completed).length;
  const totalSavingsKg = roadmap.reduce((s, t) => s + (t.completed ? t.savingsKg : 0), 0);
  const potentialSavingsKg = roadmap.reduce((s, t) => s + t.savingsKg, 0);
  const allCompleted = totalTasks > 0 && completedTasks === totalTasks;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const categoryMeta = {
    electricity: { Icon: Zap, bg: "bg-gt-orange-500/10 border-gt-orange-500/20 text-gt-orange-500", bar: "border-gt-orange-500", label: "Electricity (Scope 2)" },
    gas: { Icon: ThermometerSun, bg: "bg-gt-orange-500/10 border-gt-orange-500/20 text-gt-orange-500", bar: "border-gt-orange-500", label: "Gas (Scope 1)" },
    fuel: { Icon: Car, bg: "bg-gt-orange-500/10 border-gt-orange-500/20 text-gt-orange-500", bar: "border-gt-orange-500", label: "Fleet (Scope 1)" },
    general: { Icon: Leaf, bg: "bg-gt-orange-500/10 border-gt-orange-500/20 text-gt-orange-500", bar: "border-gt-orange-500", label: "General Offset" }
  };

  const sbtiMinRate = displayedPathway === "1.5c" ? 4.2 : displayedPathway === "wbb2c" ? 2.5 : 2.0;
  const sbtiAligned = displayedRate >= sbtiMinRate;

  return (
    <PageLayout
      icon={<Brain className="w-6 h-6 text-gt-green-600 animate-pulse" />}
      title="AI Strategy Advisor"
      subtitle="Unlock customized carbon-neutral pathways with active roadmap execution"
      loading={loading}
      loadingLabel="Consulting AI Advisor…"
    >
      <div className="w-full px-1 sm:px-4 py-2 animate-in fade-in duration-500">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">

          <div className="lg:col-span-4 space-y-4 flex flex-col">

            <AITipAdvisor
              ytdCo2={ytdCo2}
              annualTarget={displayedCap}
              reductionPct={displayedRate}
              billTypes={Array.from(new Set(bills.map(b => b.bill_type)))}
              sbtiPathway={displayedPathway}
              onAddStrategy={handleAddStrategy}
            />

            <div className="premium-card p-4 relative overflow-hidden group border border-border-subtle">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gt-green-500/5 blur-[30px] rounded-full" />

              <div className="relative z-10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gt-green-500/10 flex items-center justify-center border border-gt-green-500/20 shadow-[0_0_12px_rgba(34,197,94,0.1)]">
                      <Target className="w-3.5 h-3.5 text-gt-green-600" />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-text-primary uppercase tracking-wider">Strategy Deck</h4>
                      <p className="text-[7.5px] font-bold text-text-muted uppercase tracking-widest">Select target optimization</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setTargetMode(targetMode === "manual" ? "ai" : "manual")}
                    className="relative w-18 h-6 rounded-full bg-bg-inset border border-border-subtle p-0.5 transition-all duration-500 flex items-center cursor-pointer group-hover:border-gt-green-500/30 shadow-[inset_1px_2px_4px_rgba(0,0,0,0.06)]"
                  >
                    <div
                      className={`absolute w-8 h-4.5 rounded-full shadow-md flex items-center justify-center transition-all duration-500 text-[7px] font-black uppercase tracking-widest ${targetMode === "ai" ? "translate-x-8 bg-gt-green-500 text-white" : "translate-x-0 bg-bg-surface text-text-primary border border-border-subtle"
                        }`}
                    >
                      {targetMode === "ai" ? "AI" : "User"}
                    </div>
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-bg-inset/60 border border-border-subtle space-y-2 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),_1px_1px_2px_rgba(255,255,255,0.02)]">
                  <div className="flex justify-between items-center border-b border-border-subtle pb-1.5">
                    <span className="text-[8.5px] font-black text-text-muted uppercase tracking-widest font-mono">ACTIVE TARGET TYPE</span>
                    <span className={`text-[7.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${targetMode === "ai"
                      ? "bg-gt-green-500/10 border-gt-green-500/20 text-gt-green-600"
                      : "bg-gt-green-500/10 border-gt-green-500/20 text-gt-green-600"
                      }`}>
                      {targetMode === "ai" ? "🤖 AI OPTIMIZED" : "👤 MANUAL USER"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    <div>
                      <p className="text-[7.5px] font-black text-text-muted uppercase tracking-widest font-mono">Cap limit</p>
                      <p className="text-[10px] font-black text-text-primary mt-0.5">{displayedCap.toLocaleString("en-GB")} kg</p>
                    </div>
                    <div>
                      <p className="text-[7.5px] font-black text-text-muted uppercase tracking-widest font-mono">reduction</p>
                      <p className="text-[10px] font-black text-text-primary mt-0.5">{displayedRate}% / yr</p>
                    </div>
                    <div>
                      <p className="text-[7.5px] font-black text-text-muted uppercase tracking-widest font-mono">pathway</p>
                      <p className="text-[10px] font-black text-text-primary mt-0.5">
                        {displayedPathway === "1.5c" ? "1.5°C" : displayedPathway === "wbb2c" ? "WBB 2°C" : "2°C"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="premium-card p-4 sm:p-5 relative overflow-hidden group flex-1 flex flex-col border border-border-subtle">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gt-green-500/5 blur-[40px] rounded-full" />

              {targetMode === "ai" && (
                <div className="absolute inset-0 z-20 bg-bg-inset/95 backdrop-blur-[12px] flex flex-col items-center justify-center p-4 text-center animate-in fade-in duration-300">
                  <div className="p-4 rounded-2xl bg-bg-elevated border border-border-strong shadow-premium backdrop-blur-[8px] flex flex-col items-center max-w-[240px] space-y-2">
                    <div className="w-8 h-8 rounded-xl bg-gt-green-500/10 border border-gt-green-500/20 flex items-center justify-center shadow-[0_0_12px_rgba(34,197,94,0.15)]">
                      <Brain className="w-4 h-4 text-gt-green-600 animate-pulse" />
                    </div>
                    <p className="text-[10px] font-black text-text-primary uppercase tracking-wider">AI Strategy Locked</p>
                    <p className="text-[9px] font-bold text-text-secondary leading-relaxed max-w-[190px]">
                      Parameters are locked under AI optimization. Toggle to **User** in the Strategy Deck above to customize manually.
                    </p>
                  </div>
                </div>
              )}

              <div className="relative z-10 space-y-3.5 flex-1 flex flex-col justify-between">
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gt-green-500/10 flex items-center justify-center border border-gt-green-500/20 shadow-[0_0_12px_rgba(34,197,94,0.15)]">
                      <Sliders className="w-4 h-4 text-gt-green-600" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black text-text-primary uppercase tracking-wider">Scenario Modeler</h4>
                      <p className="text-[7.5px] font-bold text-text-muted uppercase tracking-widest">Fine-tune target outcomes</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[8px] font-black uppercase tracking-widest text-text-muted">Target SBTi Pathway</span>
                    <div className="flex gap-1.5 p-1 bg-bg-inset rounded-xl border border-border-subtle shadow-[inset_1px_2px_4px_rgba(0,0,0,0.05)]">
                      {(["1.5c", "wbb2c", "2c"] as const).map((p) => {
                        const label = p === "1.5c" ? "1.5°C" : p === "wbb2c" ? "WBB 2°C" : "2°C";
                        const active = sbtiPathway === p;
                        return (
                          <button key={p}
                            onClick={() => {
                              setSbtiPathway(p);
                              if (reductionPct < (p === "1.5c" ? 4.2 : p === "wbb2c" ? 2.5 : 2.0)) {
                                setReductionPct(p === "1.5c" ? 5 : p === "wbb2c" ? 3 : 2);
                              }
                            }}
                            className={`flex-1 py-1 rounded-lg text-[8.5px] font-black uppercase tracking-wider transition-all duration-300 ${active
                              ? "bg-gt-green-500 text-white shadow-md shadow-gt-green-500/25"
                              : "text-text-secondary hover:bg-bg-inset"
                              }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <RangeSlider label="Annual Carbon Cap" value={annualTarget} min={500} max={50000} step={100}
                    onChange={setAnnualTarget} unit="kg / yr" accent="var(--brand-green)" />

                  <RangeSlider label="Yearly Reduction Rate" value={reductionPct} min={1} max={30} step={1}
                    onChange={setReductionPct} unit="% / yr" accent="var(--brand-green)" />
                </div>

                <div className="space-y-3 pt-3 mt-auto">
                  <div className={`p-2.5 rounded-xl border text-center space-y-1 transition-all duration-300 shadow-[inset_1px_2px_4px_rgba(0,0,0,0.03)] ${sbtiAligned
                    ? "bg-gt-green-500/5 border-gt-green-500/15 shadow-[0_0_12px_rgba(34,197,94,0.05)]"
                    : "bg-gt-green-500/5 border-gt-green-500/15 shadow-[0_0_12px_rgba(34,197,94,0.05)]"
                    }`}>
                    <p className="text-[7.5px] font-black uppercase tracking-widest text-text-muted">Science Pathway Alignment</p>
                    <p className={`text-[13px] font-black ${sbtiAligned ? "text-gt-green-600" : "text-gt-green-600"}`}>
                      {sbtiAligned ? "✓ Paris Aligned" : "Below Pathway Threshold"}
                    </p>
                    <p className="text-[8px] font-bold text-text-secondary leading-relaxed">
                      SBTi requires min <span className="font-black text-text-primary">{sbtiMinRate}% / yr</span> for {displayedPathway === "1.5c" ? "1.5°C" : displayedPathway === "wbb2c" ? "Well-Below 2°C" : "2°C"} pathway.
                    </p>
                  </div>

                  <button
                    onClick={handleSaveTargetSettings}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider bg-text-primary border border-border-default hover:bg-text-secondary transition-all text-text-inverse shadow-premium"
                  >
                    {saving ? (
                      "Saving Target..."
                    ) : saveSuccess ? (
                      "Target Saved!"
                    ) : (
                      <>
                        <Target className="w-3.5 h-3.5 text-gt-green-600" /> Save Target to Database
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-8 flex flex-col h-full space-y-4">

            {totalTasks > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-shrink-0">

                <div className="premium-card p-3 flex items-center gap-3 relative overflow-hidden group border border-border-subtle">
                  <div className="w-8.5 h-8.5 rounded-lg bg-gt-green-500/10 border border-gt-green-500/20 flex items-center justify-center flex-shrink-0 text-gt-green-600 shadow-[0_0_12px_rgba(34,197,94,0.1)]">
                    <CheckCircle2 className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-[7.5px] font-black text-text-muted uppercase tracking-widest font-mono">Strategy Completion</p>
                    <p className="text-base font-black text-text-primary">{completedTasks} <span className="text-[10px] text-text-muted font-medium font-mono">/ {totalTasks} checked</span></p>
                  </div>
                </div>

                <div className="premium-card p-3 flex items-center gap-3 relative overflow-hidden group border border-border-subtle">
                  <div className="w-8.5 h-8.5 rounded-lg bg-gt-green-500/10 border border-gt-green-500/20 flex items-center justify-center flex-shrink-0 text-gt-green-600 shadow-[0_0_12px_rgba(34,197,94,0.15)]">
                    <TrendingDown className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-[7.5px] font-black text-text-muted uppercase tracking-widest font-mono">Active Offset Achieved</p>
                    <p className="text-base font-black text-gt-green-600">{(totalSavingsKg / 1000).toFixed(2)} <span className="text-[10px] font-medium font-mono text-text-muted">tonnes/yr</span></p>
                  </div>
                </div>

                <div className="premium-card p-3 flex items-center gap-3 relative overflow-hidden group border border-border-subtle">
                  <div className="w-8.5 h-8.5 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0 text-purple-600 shadow-[0_0_12px_rgba(168,85,247,0.1)]">
                    <Award className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-[7.5px] font-black text-text-muted uppercase tracking-widest font-mono">Maximum Target Potential</p>
                    <p className="text-base font-black text-text-primary">{(potentialSavingsKg / 1000).toFixed(2)} <span className="text-[10px] text-text-muted font-medium font-mono">tonnes/yr</span></p>
                  </div>
                </div>

              </div>
            )}

            <div className="premium-card p-4 sm:p-5 space-y-4 relative overflow-hidden flex-1 flex flex-col border border-border-subtle">
              <div className="absolute bottom-0 right-0 w-36 h-36 bg-gt-green-500/5 blur-[50px] rounded-full" />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border-subtle pb-3 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8.5 h-8.5 rounded-lg bg-gt-green-500/10 flex items-center justify-center border border-gt-green-500/20 shadow-[0_0_12px_rgba(34,197,94,0.15)]">
                    <ListTodo className="w-4.5 h-4.5 text-gt-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-text-primary tracking-tight">Your Carbon Reduction Roadmap</h3>
                    <p className="text-[8.5px] font-bold text-text-muted uppercase tracking-widest">Execute actions to achieve targets</p>
                  </div>
                </div>

                {totalTasks > 0 && (
                  <div className="flex items-center gap-2.5 min-w-[150px] w-full md:w-auto">
                    <div className="flex-1 h-1.5 rounded-full bg-bg-inset border border-border-subtle overflow-hidden shadow-[inset_1px_2px_3px_rgba(0,0,0,0.06)]">
                      <div
                        className="h-full bg-gradient-to-r from-gt-green-600 to-gt-green-500 rounded-full shadow-lg shadow-gt-green-500/25 transition-all duration-700"
                        style={{ width: `${completionPercentage}%` }}
                      />
                    </div>
                    <span className="text-[8px] font-black text-gt-green-600 flex-shrink-0 bg-gt-green-500/10 px-1.5 py-0.5 rounded-md border border-gt-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.05)] font-mono">
                      {completionPercentage}% Done
                    </span>
                  </div>
                )}
              </div>

              {totalTasks > 0 && (
                <div className="flex flex-wrap gap-1.5 items-center p-2.5 rounded-2xl neu-inset !border-0 flex-shrink-0">
                  <span className="text-[7.5px] font-black uppercase tracking-wider text-text-primary px-2 flex items-center gap-1 font-mono">
                    <Filter className="w-2.5 h-2.5 text-gt-orange-500" /> Filter:
                  </span>
                  {[
                    { key: "all", label: "All Board" },
                    { key: "pending", label: "Pending" },
                    { key: "completed", label: "Completed" },
                    { key: "electricity", label: "⚡ Scope 2 Electricity" },
                    { key: "gas", label: "🔥 Scope 1 Gas" },
                    { key: "fuel", label: "🚗 Scope 1 Fleet" }
                  ].map((btn) => {
                    const isActive = activeFilter === btn.key;
                    return (
                      <button
                        key={btn.key}
                        onClick={() => setActiveFilter(btn.key as any)}
                        className={`px-2.5 py-1 rounded-lg text-[8.5px] font-black uppercase tracking-wider transition-all duration-300 hover:scale-[1.02] ${isActive
                          ? "bg-bg-surface text-gt-orange-500 border border-gt-orange-500/40 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.1),_0_0_8px_rgba(249,115,22,0.15)] scale-[1.02]"
                          : "text-text-muted hover:text-text-primary hover:bg-bg-inset/40"
                          }`}
                      >
                        {btn.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {totalTasks === 0 && (
                <div className="py-16 px-4 text-center space-y-4 max-w-md mx-auto my-auto flex-1 flex flex-col justify-center">
                  <div className="w-14 h-14 rounded-2xl bg-gt-green-500/5 border border-gt-green-500/10 flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(34,197,94,0.05)]">
                    <Sparkles className="w-6 h-6 text-gt-green-600/60 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-text-primary uppercase tracking-wider">Plan is currently empty</h4>
                    <p className="text-[11px] text-text-secondary leading-relaxed font-medium">
                      Use the AI Strategy Advisor on the left to analyze emissions, then click <strong>"Add to Action Plan"</strong> to seed your roadmap checklist.
                    </p>
                  </div>
                </div>
              )}

              {allCompleted && (
                <div className="p-5 mb-4 rounded-2xl bg-gt-green-500/5 border border-gt-green-500/15 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left animate-in zoom-in-95 duration-500 flex-shrink-0 shadow-[0_0_20px_rgba(34,197,94,0.05)]">
                  <div className="w-12 h-12 rounded-xl bg-gt-green-500/10 border border-gt-green-500/25 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(34,197,94,0.15)]">
                    <PartyPopper className="w-6 h-6 text-gt-green-600 animate-bounce" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-gt-green-600 uppercase tracking-widest flex items-center justify-center sm:justify-start gap-1">
                      <Award className="w-4 h-4" /> Paris-Agreement Aligned!
                    </h4>
                    <p className="text-[11px] text-gt-green-600/90 leading-relaxed font-medium">
                      Outstanding achievement! You have executed all roadmap strategies, yielding an estimated saving of <strong>{(totalSavingsKg / 1000).toFixed(2)} tonnes of CO₂ / year</strong>!
                    </p>
                  </div>
                </div>
              )}

              {totalTasks > 0 && filteredTasks.length === 0 && (
                <div className="py-12 text-center text-text-muted text-[11px] font-medium leading-relaxed bg-bg-inset/10 rounded-xl border border-dashed border-border-subtle my-auto flex-1 flex flex-col justify-center">
                  No tasks matched your active filter "<strong>{activeFilter}</strong>".
                </div>
              )}

              {filteredTasks.length > 0 && (
                <div className="space-y-2.5 flex-1 min-h-0 overflow-y-auto py-10 p-4 scroll-smooth [scrollbar-width:thin] [scrollbar-color:rgba(249,115,22,0.15)_transparent]">
                  {filteredTasks.map((task) => {
                    const meta = categoryMeta[task.category];
                    const CategoryIcon = meta.Icon;

                    return (
                      <div
                        key={task.id}
                        className={`flex gap-3 p-3 transition-all duration-300 relative overflow-hidden ${task.completed
                          ? "neu-inset !border-0 opacity-60 shadow-none"
                          : "neu-raised !border-0 hover:scale-[1.005]"
                          }`}
                      >
                        <button
                          onClick={() => handleToggleComplete(task.id)}
                          className="mt-0.5 text-text-muted hover:text-gt-orange-500 transition-colors flex-shrink-0"
                        >
                          {task.completed ? (
                            <CheckCircle2 className="w-4.5 h-4.5 text-gt-orange-500" />
                          ) : (
                            <div className="w-4.5 h-4.5 rounded-md border-2 border-border-strong hover:border-gt-orange-500 transition-colors flex items-center justify-center shadow-[inset_1px_1px_3px_rgba(0,0,0,0.06)]">
                              <Check className="w-3 h-3 text-transparent hover:text-gt-orange-500" />
                            </div>
                          )}
                        </button>

                        <div className="flex-1 min-w-0 space-y-1.5">
                          <p
                            className={`text-[10px] font-bold leading-snug text-text-primary transition-all duration-300 ${task.completed ? "text-text-muted/60" : ""
                              }`}
                          >
                            {task.text}
                          </p>

                          <div className="flex flex-wrap gap-1.5 items-center">
                            <span className={`text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${meta.bg.replace('border-gt-orange-500/20', '').replace('border', '')} font-mono`}>
                              <CategoryIcon className="w-2.5 h-2.5 inline mr-1" />
                              {meta.label}
                            </span>

                            <span className="text-[7px] font-black uppercase tracking-wider bg-bg-inset text-text-muted px-1.5 py-0.5 rounded-md font-mono">
                              Est. -{(task.savingsKg / 1000).toFixed(1)}t CO₂ / yr
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-500/5 transition-colors self-start"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>

          </div>

        </div>

      </div>
    </PageLayout>
  );
}
