"use client";
import { useState, useEffect } from "react";
import { Package, ToggleLeft, ToggleRight, Edit3, Trash2, Plus, X, Save } from "lucide-react";

interface PlanFeature { key: string; label: string; enabled: boolean }
interface PlanQuotas { bills_per_month: number; max_organisations: number }
interface Plan {
  id: string; name: string; slug: string; monthly_price: number; yearly_price: number;
  description: string; features: PlanFeature[]; quotas: PlanQuotas; is_active: boolean;
}

const PLAN_COLORS: Record<string, string> = { free: "#6b7280", starter: "#3b82f6", business: "#22c55e" };

export default function PlansTab() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<Plan>>({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/subscriptions?view=plans")
      .then((r) => r.json())
      .then((d) => { setPlans(d.plans ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function openEdit(plan: Plan) {
    setEditing(plan);
    setEditDraft({ name: plan.name, monthly_price: plan.monthly_price, yearly_price: plan.yearly_price, description: plan.description });
    setSaveMsg(null);
  }

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    const res = await fetch("/api/admin/subscriptions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_plan", plan_id: editing.id, ...editDraft }),
    });
    if (res.ok) {
      setPlans((prev) => prev.map((p) => p.id === editing.id ? { ...p, ...editDraft } as Plan : p));
      setSaveMsg({ type: "success", text: "Plan updated successfully" });
      setTimeout(() => { setEditing(null); setSaveMsg(null); }, 1200);
    } else {
      setSaveMsg({ type: "error", text: "Failed to save changes" });
    }
    setSaving(false);
  }

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

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="premium-card p-5 h-80" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-black" style={{ color: "var(--text-primary)" }}>Plan Catalog</p>
          <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">{plans.length} plans configured</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold text-text-muted opacity-50 uppercase tracking-widest">
            Feature toggles apply immediately
          </span>
        </div>
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
                  <button onClick={() => openEdit(plan)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:scale-110 transition-transform"
                    style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}
                    title="Edit plan">
                    <Edit3 className="w-3 h-3" />
                  </button>
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
                      <span className="text-[10px] font-bold transition-colors"
                        style={{ color: f.enabled ? "var(--text-primary)" : "var(--text-muted)", opacity: f.enabled ? 1 : 0.5 }}>
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
                <input
                  value={editDraft.name ?? ""}
                  onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm font-black"
                  style={{ background: "var(--bg-inset)", color: "var(--text-primary)", border: "var(--card-border)" }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Monthly (£)</label>
                  <input type="number"
                    value={editDraft.monthly_price ?? 0}
                    onChange={(e) => setEditDraft((d) => ({ ...d, monthly_price: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm font-black"
                    style={{ background: "var(--bg-inset)", color: "var(--text-primary)", border: "var(--card-border)" }} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Yearly (£)</label>
                  <input type="number"
                    value={editDraft.yearly_price ?? 0}
                    onChange={(e) => setEditDraft((d) => ({ ...d, yearly_price: Number(e.target.value) }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm font-black"
                    style={{ background: "var(--bg-inset)", color: "var(--text-primary)", border: "var(--card-border)" }} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Description</label>
                <textarea
                  value={editDraft.description ?? ""}
                  onChange={(e) => setEditDraft((d) => ({ ...d, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl text-sm font-black resize-none"
                  style={{ background: "var(--bg-inset)", color: "var(--text-primary)", border: "var(--card-border)" }} />
              </div>
            </div>

            {saveMsg && (
              <div className="mt-3 px-3 py-2 rounded-xl text-[10px] font-black"
                style={{
                  background: saveMsg.type === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                  color: saveMsg.type === "success" ? "var(--brand-green)" : "#ef4444",
                }}>
                {saveMsg.text}
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="mt-5 w-full px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: "var(--brand-orange)", color: "#fff" }}>
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
