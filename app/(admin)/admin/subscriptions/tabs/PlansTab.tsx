"use client";
import { useState } from "react";
import { Package, ToggleLeft, ToggleRight, Edit3, Trash2, Plus, X } from "lucide-react";

interface PlanFeature { key: string; label: string; enabled: boolean }
interface PlanQuotas { bills_per_month: number; max_organisations: number }
interface Plan {
  id: string; name: string; slug: string; monthly_price: number; yearly_price: number;
  description: string; features: PlanFeature[]; quotas: PlanQuotas; is_active: boolean;
}

const DEFAULT_FEATURES: PlanFeature[] = [
  { key: "ai_bill_processing", label: "AI Bill Processing", enabled: false },
  { key: "secr_reporting", label: "SECR Reporting", enabled: false },
  { key: "team_management", label: "Team Management", enabled: false },
  { key: "api_access", label: "API Access", enabled: false },
  { key: "priority_support", label: "Priority Support", enabled: false },
  { key: "custom_branding", label: "Custom Branding", enabled: false },
];

const INITIAL_PLANS: Plan[] = [
  {
    id: "plan_free", name: "Free", slug: "free", monthly_price: 0, yearly_price: 0,
    description: "Basic carbon tracking for small teams",
    features: DEFAULT_FEATURES.map((f) => ({ ...f, enabled: f.key === "ai_bill_processing" })),
    quotas: { bills_per_month: 10, max_organisations: 1 }, is_active: true,
  },
  {
    id: "plan_starter", name: "Starter", slug: "starter", monthly_price: 24, yearly_price: 240,
    description: "Professional carbon management with AI-powered insights",
    features: DEFAULT_FEATURES.map((f) => ({ ...f, enabled: ["ai_bill_processing", "secr_reporting", "team_management"].includes(f.key) })),
    quotas: { bills_per_month: 100, max_organisations: 3 }, is_active: true,
  },
  {
    id: "plan_business", name: "Business", slug: "business", monthly_price: 99, yearly_price: 990,
    description: "Enterprise-grade sustainability platform with full API access",
    features: DEFAULT_FEATURES.map((f) => ({ ...f, enabled: true })),
    quotas: { bills_per_month: 500, max_organisations: 10 }, is_active: true,
  },
];

const PLAN_COLORS: Record<string, string> = { free: "#6b7280", starter: "#3b82f6", business: "#22c55e" };

export default function PlansTab() {
  const [plans, setPlans] = useState<Plan[]>(INITIAL_PLANS);
  const [editing, setEditing] = useState<Plan | null>(null);

  function toggleFeature(planId: string, featureKey: string) {
    setPlans((prev) => prev.map((p) =>
      p.id === planId
        ? { ...p, features: p.features.map((f) => f.key === featureKey ? { ...f, enabled: !f.enabled } : f) }
        : p
    ));
  }

  function updateQuota(planId: string, field: keyof PlanQuotas, value: number) {
    setPlans((prev) => prev.map((p) =>
      p.id === planId ? { ...p, quotas: { ...p.quotas, [field]: value } } : p
    ));
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-black" style={{ color: "var(--text-primary)" }}>Plan Catalog</p>
          <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">{plans.length} plans configured</p>
        </div>
        <button className="px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
          style={{ background: "var(--brand-orange)", color: "#fff" }}>
          <span className="flex items-center gap-1.5"><Plus className="w-3 h-3" /> Add Plan</span>
        </button>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const color = PLAN_COLORS[plan.slug] ?? "var(--text-muted)";
          return (
            <div key={plan.id} className="rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
              style={{ background: "var(--neu-base)", boxShadow: "var(--shadow-raised)", border: "var(--card-border)" }}>
              {/* Header */}
              <div className="p-5 pb-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-8 rounded-full" style={{ background: color }} />
                    <div>
                      <p className="text-base font-black tracking-tight" style={{ color: "var(--text-primary)" }}>{plan.name}</p>
                      <p className="text-[9px] font-bold text-text-muted">{plan.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setEditing(plan)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:scale-110 transition-transform"
                      style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}>
                      <Edit3 className="w-3 h-3" />
                    </button>
                    {plan.slug !== "free" && (
                      <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:scale-110 transition-transform"
                        style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                {/* Pricing */}
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black tracking-tighter" style={{ color }}>
                    £{plan.monthly_price}
                  </span>
                  <span className="text-[9px] font-bold text-text-muted">/mo</span>
                  <span className="text-[9px] font-bold text-text-muted ml-2">
                    £{plan.yearly_price}/yr
                  </span>
                </div>
              </div>

              {/* Features */}
              <div className="p-5 pb-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted opacity-50 mb-3">Feature Flags</p>
                <div className="space-y-2">
                  {plan.features.map((f) => (
                    <div key={f.key} className="flex items-center justify-between">
                      <span className="text-[10px] font-bold" style={{ color: f.enabled ? "var(--text-primary)" : "var(--text-muted)", opacity: f.enabled ? 1 : 0.5 }}>
                        {f.label}
                      </span>
                      <button onClick={() => toggleFeature(plan.id, f.key)} className="transition-transform hover:scale-110">
                        {f.enabled
                          ? <ToggleRight className="w-5 h-5" style={{ color }} />
                          : <ToggleLeft className="w-5 h-5 text-text-muted opacity-30" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quotas */}
              <div className="p-5">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted opacity-50 mb-3">Usage Quotas</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-[9px] font-bold text-text-muted block mb-1">Bills / month</label>
                    <input type="number" value={plan.quotas.bills_per_month}
                      onChange={(e) => updateQuota(plan.id, "bills_per_month", Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg text-xs font-black"
                      style={{ background: "var(--bg-inset)", color: "var(--text-primary)", border: "var(--card-border)" }} />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-text-muted block mb-1">Max Organisations</label>
                    <input type="number" value={plan.quotas.max_organisations}
                      onChange={(e) => updateQuota(plan.id, "max_organisations", Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg text-xs font-black"
                      style={{ background: "var(--bg-inset)", color: "var(--text-primary)", border: "var(--card-border)" }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative rounded-2xl p-6 w-full max-w-md animate-scale-in"
            style={{ background: "var(--bg-surface)", border: "var(--card-border)", boxShadow: "var(--shadow-premium)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm font-black" style={{ color: "var(--text-primary)" }}>Edit {editing.name} Plan</p>
              <button onClick={() => setEditing(null)} className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "var(--bg-inset)", color: "var(--text-muted)" }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Plan Name</label>
                <input defaultValue={editing.name} className="w-full px-3 py-2.5 rounded-xl text-sm font-black"
                  style={{ background: "var(--bg-inset)", color: "var(--text-primary)", border: "var(--card-border)" }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Monthly (£)</label>
                  <input type="number" defaultValue={editing.monthly_price} className="w-full px-3 py-2.5 rounded-xl text-sm font-black"
                    style={{ background: "var(--bg-inset)", color: "var(--text-primary)", border: "var(--card-border)" }} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Yearly (£)</label>
                  <input type="number" defaultValue={editing.yearly_price} className="w-full px-3 py-2.5 rounded-xl text-sm font-black"
                    style={{ background: "var(--bg-inset)", color: "var(--text-primary)", border: "var(--card-border)" }} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Description</label>
                <textarea defaultValue={editing.description} rows={2} className="w-full px-3 py-2.5 rounded-xl text-sm font-black resize-none"
                  style={{ background: "var(--bg-inset)", color: "var(--text-primary)", border: "var(--card-border)" }} />
              </div>
            </div>
            <button className="mt-5 w-full px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95"
              style={{ background: "var(--brand-orange)", color: "#fff" }}
              onClick={() => setEditing(null)}>
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
