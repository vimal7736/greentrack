"use client";
import { useState, useEffect } from "react";
import {
  Beaker, Edit3, Save, X, AlertTriangle, CheckCircle,
} from "lucide-react";
import type { EmissionFactor } from "@/types";
import { DataTable, type ColumnDef } from "@/components/ui/DataTable";
import { AlertBanner } from "@/components/ui/AlertBanner";

/* ── Scope badge colors ────────────────────────────────────── */
const SCOPE_STYLES: Record<number, { bg: string; text: string; ring: string }> = {
  1: { bg: "rgba(249,115,22,0.10)", text: "var(--brand-orange-dark)", ring: "rgba(249,115,22,0.20)" },
  2: { bg: "rgba(59,130,246,0.10)", text: "#3b82f6",                 ring: "rgba(59,130,246,0.20)" },
  3: { bg: "rgba(168,85,247,0.10)", text: "#a855f7",                 ring: "rgba(168,85,247,0.20)" },
};

const FUEL_DOT_COLORS: Record<string, string> = {
  electricity: "var(--brand-green)",
  gas: "#3b82f6",
  fuel_diesel: "var(--brand-orange)",
  fuel_petrol: "var(--brand-orange-dark)",
  water: "#06b6d4",
};

export default function AdminFactorsPage() {
  const [factors, setFactors] = useState<EmissionFactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchFactors();
  }, []);

  async function fetchFactors() {
    setLoading(true);
    const res = await fetch("/api/admin/factors");
    if (res.ok) {
      const d = await res.json();
      setFactors(d.factors ?? []);
    }
    setLoading(false);
  }

  function startEdit(factor: EmissionFactor) {
    setEditingId(factor.id);
    setEditValue(String(factor.kg_co2e_per_unit));
    setError(null);
    setSuccess(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValue("");
  }

  async function handleSave(id: string) {
    const numValue = Number(editValue);
    if (isNaN(numValue) || numValue <= 0) {
      setError("Value must be a positive number");
      return;
    }

    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/factors", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, kg_co2e_per_unit: numValue }),
    });
    setSaving(false);

    if (res.ok) {
      setFactors((prev) =>
        prev.map((f) => f.id === id ? { ...f, kg_co2e_per_unit: numValue } : f)
      );
      setEditingId(null);
      setSuccess("Emission factor updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } else {
      const d = await res.json();
      setError(d.error ?? "Failed to save");
    }
  }

  /* ── Columns ────────────────────────────────────────────── */
  const columns: ColumnDef<EmissionFactor>[] = [
    {
      key: "fuel_type",
      header: "Fuel Type",
      render: (f) => (
        <div className="flex items-center gap-3">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ background: FUEL_DOT_COLORS[f.fuel_type] ?? "var(--text-muted)" }}
          />
          <span className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--text-primary)" }}>
            {f.fuel_type.replace("_", " ")}
          </span>
        </div>
      ),
    },
    {
      key: "unit",
      header: "Unit",
      render: (f) => (
        <span
          className="inline-flex items-center px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest"
          style={{
            background: "var(--bg-inset)",
            color: "var(--text-secondary)",
            border: "var(--card-border)",
          }}
        >
          {f.unit}
        </span>
      ),
    },
    {
      key: "value",
      header: "kgCO₂e / Unit",
      align: "right",
      render: (f) => {
        if (editingId === f.id) {
          return (
            <div className="flex items-center gap-2 justify-end">
              <input
                type="number"
                step="0.001"
                min="0"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave(f.id)}
                autoFocus
                className="w-28 px-3 py-2 rounded-xl text-sm font-black text-right focus:outline-none transition-all"
                style={{
                  background: "var(--bg-inset)",
                  color: "var(--brand-orange)",
                  border: "2px solid var(--brand-orange)",
                  boxShadow: "0 0 0 4px rgba(249,115,22,0.10)",
                }}
              />
            </div>
          );
        }
        return (
          <span className="text-sm font-black tracking-tight font-mono" style={{ color: "var(--text-primary)" }}>
            {f.kg_co2e_per_unit}
          </span>
        );
      },
    },
    {
      key: "scope",
      header: "Scope",
      align: "center",
      render: (f) => {
        const style = SCOPE_STYLES[f.scope] ?? SCOPE_STYLES[1];
        return (
          <span
            className="inline-flex items-center px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest"
            style={{
              background: style.bg,
              color: style.text,
              border: `1px solid ${style.ring}`,
            }}
          >
            Scope {f.scope}
          </span>
        );
      },
    },
    {
      key: "valid_from",
      header: "Valid From",
      render: (f) => (
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
          {f.valid_from}
        </span>
      ),
    },
    {
      key: "valid_to",
      header: "Valid To",
      render: (f) => (
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
          {f.valid_to}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (f) => {
        if (editingId === f.id) {
          return (
            <div className="flex items-center gap-1 justify-end">
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSave(f.id)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 disabled:opacity-40"
                style={{
                  background: "rgba(34,197,94,0.10)",
                  color: "var(--brand-green)",
                }}
                title="Save"
              >
                <Save className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                style={{
                  background: "rgba(239,68,68,0.10)",
                  color: "#ef4444",
                }}
                title="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        }
        return (
          <button
            type="button"
            onClick={() => startEdit(f)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 ml-auto"
            style={{
              background: "var(--bg-inset)",
              color: "var(--text-muted)",
            }}
            title="Edit factor"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 animate-scale-in">
      {/* ── Warning Banner ─────────────────────────────────── */}
      <div
        className="premium-card p-5 flex items-start gap-4 border-l-4"
        style={{
          borderLeftColor: "var(--brand-orange)",
          background: "rgba(249,115,22,0.04)",
        }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(249,115,22,0.10)" }}
        >
          <AlertTriangle className="w-5 h-5" style={{ color: "var(--brand-orange)" }} />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: "var(--brand-orange-dark)" }}>
            Critical Configuration
          </p>
          <p className="text-[11px] font-bold leading-relaxed" style={{ color: "var(--text-muted)" }}>
            These are official 2025 DEFRA emission factors used to calculate CO₂e for every bill on the platform.
            Changes here will affect <strong>all future calculations</strong> across all organisations. Proceed with caution.
          </p>
        </div>
      </div>

      {/* ── Success / Error Banners ────────────────────────── */}
      {success && <AlertBanner variant="success" message={success} />}
      {error && <AlertBanner variant="error" message={error} />}

      {/* ── Stat row ───────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <div
          className="premium-card p-5"
          style={{ borderTop: "3px solid var(--brand-orange)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted opacity-50">Active Factors</span>
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "var(--neu-base)", boxShadow: "var(--shadow-inset-sm)", color: "var(--brand-orange-dark)" }}
            >
              <Beaker className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black tracking-tighter" style={{ color: "var(--text-primary)" }}>
            {factors.length}
          </span>
        </div>
        <div
          className="premium-card p-5"
          style={{ borderTop: "3px solid var(--brand-green)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted opacity-50">Fuel Types</span>
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "var(--neu-base)", boxShadow: "var(--shadow-inset-sm)", color: "var(--brand-green-dark)" }}
            >
              <Beaker className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black tracking-tighter" style={{ color: "var(--text-primary)" }}>
            {new Set(factors.map((f) => f.fuel_type)).size}
          </span>
        </div>
        <div
          className="premium-card p-5"
          style={{ borderTop: "3px solid #3b82f6" }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted opacity-50">Source</span>
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "var(--neu-base)", boxShadow: "var(--shadow-inset-sm)", color: "#3b82f6" }}
            >
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <span className="text-lg font-black tracking-tighter" style={{ color: "var(--text-primary)" }}>
            DEFRA 2025
          </span>
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────── */}
      <DataTable
        columns={columns}
        data={factors}
        rowKey={(f) => f.id}
        loading={loading}
        loadingLabel="Loading emission factors..."
        emptyIcon={<Beaker className="w-10 h-10" />}
        emptyTitle="No Factors Found"
        emptyMessage="Emission factors have not been configured yet."
      />
    </div>
  );
}
