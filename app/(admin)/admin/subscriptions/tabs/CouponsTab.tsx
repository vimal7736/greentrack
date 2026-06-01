"use client";
import { useEffect, useState } from "react";
import { Tag, Percent, DollarSign, ToggleLeft, ToggleRight } from "lucide-react";
import type { CouponRow } from "@/types";
import { AdminSelect } from "@/components/ui/AdminSelect";
import { formatDate } from "@/lib/utils/format";

interface CreateForm {
  code: string;
  type: "percentage" | "fixed";
  value: string;
  usage_limit: string;
  valid_until: string;
}

const EMPTY_FORM: CreateForm = { code: "", type: "percentage", value: "", usage_limit: "", valid_until: "" };

export default function CouponsTab() {
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/subscriptions?view=coupons")
      .then((r) => r.json())
      .then((d) => { setCoupons(d.coupons ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleCreate() {
    if (!form.code || !form.value || !form.usage_limit) {
      setCreateError("Code, value and usage limit are required");
      return;
    }
    setCreating(true);
    setCreateError(null);
    const res = await fetch("/api/admin/subscriptions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_coupon",
        code: form.code,
        type: form.type,
        value: Number(form.value),
        usage_limit: Number(form.usage_limit),
        valid_until: form.valid_until || undefined,
      }),
    });
    const data = await res.json();
    if (res.ok && data.coupon) {
      setCoupons((prev) => [data.coupon, ...prev]);
      setForm(EMPTY_FORM);
      setShowCreate(false);
    } else {
      setCreateError(data.error || "Failed to create coupon");
    }
    setCreating(false);
  }

  function toggleCoupon(id: string) {
    setCoupons((prev) => prev.map((c) => c.id === id ? { ...c, is_active: !c.is_active } : c));
    fetch("/api/admin/subscriptions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle_coupon", coupon_id: id, is_active: !coupons.find((c) => c.id === id)?.is_active }),
    });
  }

  if (loading) {
    return <div className="space-y-4 animate-pulse"><div className="premium-card p-6 h-64" /></div>;
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-black" style={{ color: "var(--text-primary)" }}>Discount Codes</p>
          <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">{coupons.length} coupons configured</p>
        </div>
        <button onClick={() => { setShowCreate(!showCreate); setCreateError(null); setForm(EMPTY_FORM); }}
          className="px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
          style={{ background: "var(--brand-orange)", color: "#fff" }}>
          + New Coupon
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="rounded-2xl p-5" style={{ background: "var(--neu-base)", boxShadow: "var(--shadow-raised)", border: "var(--card-border)" }}>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted opacity-50 mb-4">Create New Coupon</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Code</label>
              <input
                placeholder="e.g. SAVE20"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm font-black"
                style={{ background: "var(--bg-inset)", color: "var(--text-primary)", border: "var(--card-border)" }} />
            </div>
            <div className="flex flex-col gap-1.5 z-10">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Type</label>
              <AdminSelect
                value={form.type}
                onChange={(val) => setForm((f) => ({ ...f, type: val as "percentage" | "fixed" }))}
                options={[
                  { label: "Percentage (%)", value: "percentage" },
                  { label: "Fixed (£)", value: "fixed" },
                ]}
                triggerClassName="px-3 py-2.5 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                Value {form.type === "percentage" ? "(%)" : "(£)"}
              </label>
              <input
                type="number"
                placeholder={form.type === "percentage" ? "25" : "10"}
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm font-black"
                style={{ background: "var(--bg-inset)", color: "var(--text-primary)", border: "var(--card-border)" }} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Usage Limit</label>
              <input
                type="number"
                placeholder="100"
                value={form.usage_limit}
                onChange={(e) => setForm((f) => ({ ...f, usage_limit: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm font-black"
                style={{ background: "var(--bg-inset)", color: "var(--text-primary)", border: "var(--card-border)" }} />
            </div>
          </div>
          <div className="mt-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted block mb-1.5">Expires On (optional)</label>
            <input
              type="date"
              value={form.valid_until}
              onChange={(e) => setForm((f) => ({ ...f, valid_until: e.target.value }))}
              className="w-full sm:w-48 px-3 py-2.5 rounded-xl text-sm font-black"
              style={{ background: "var(--bg-inset)", color: "var(--text-primary)", border: "var(--card-border)" }} />
          </div>
          {createError && (
            <p className="text-[10px] font-black text-red-500 mt-2">{createError}</p>
          )}
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              style={{ background: "var(--brand-green)", color: "#fff" }}>
              {creating ? "Creating..." : "Create Coupon"}
            </button>
            <button onClick={() => { setShowCreate(false); setCreateError(null); }}
              className="px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest"
              style={{ background: "var(--bg-inset)", color: "var(--text-muted)" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Coupon Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        {coupons.map((c) => {
          const usagePct = c.usage_limit > 0 ? (c.times_used / c.usage_limit) * 100 : 0;
          const isExpired = new Date(c.valid_until) < new Date();
          const isFull = c.times_used >= c.usage_limit;
          return (
            <div key={c.id} className="rounded-2xl p-5 relative overflow-hidden group transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: "var(--neu-base)", boxShadow: "var(--shadow-raised)", border: "var(--card-border)",
                opacity: (!c.is_active || isExpired || isFull) ? 0.6 : 1,
              }}>
              {/* Status indicator */}
              <div className="absolute top-0 left-0 right-0 h-[3px]"
                style={{ background: c.is_active && !isExpired && !isFull ? "var(--brand-green)" : "var(--text-muted)" }} />

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: c.type === "percentage" ? "rgba(168,85,247,0.1)" : "rgba(34,197,94,0.1)", boxShadow: "var(--shadow-inset-xs)" }}>
                    {c.type === "percentage" ? <Percent className="w-4 h-4 text-purple-500" /> : <DollarSign className="w-4 h-4 text-green-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-black tracking-tight" style={{ color: "var(--text-primary)" }}>{c.code}</p>
                    <p className="text-[9px] font-bold text-text-muted">
                      {c.type === "percentage" ? `${c.value}% off` : `£${c.value} off`}
                    </p>
                  </div>
                </div>
                <button onClick={() => toggleCoupon(c.id)} title={c.is_active ? "Deactivate" : "Activate"}
                  className="transition-transform hover:scale-110">
                  {c.is_active
                    ? <ToggleRight className="w-6 h-6" style={{ color: "var(--brand-green)" }} />
                    : <ToggleLeft className="w-6 h-6 text-text-muted opacity-40" />}
                </button>
              </div>

              {/* Usage bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-text-muted">{c.times_used} / {c.usage_limit} used</span>
                  <span className="text-[9px] font-bold text-text-muted">{usagePct.toFixed(0)}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-inset)" }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(usagePct, 100)}%`, background: isFull ? "#ef4444" : "var(--brand-green)" }} />
                </div>
              </div>

              {/* Validity */}
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-text-muted">
                  {formatDate(c.valid_from)} → {formatDate(c.valid_until)}
                </span>
                {isExpired && <span className="text-[8px] font-black uppercase text-red-500 bg-red-500/10 px-2 py-0.5 rounded">Expired</span>}
                {isFull && !isExpired && <span className="text-[8px] font-black uppercase text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded">Limit Reached</span>}
              </div>
            </div>
          );
        })}
      </div>

      {coupons.length === 0 && (
        <div className="premium-card p-12 text-center">
          <Tag className="w-10 h-10 mx-auto mb-3 text-text-muted opacity-30" />
          <p className="text-sm font-bold text-text-muted opacity-50">No coupons configured yet</p>
        </div>
      )}
    </div>
  );
}
