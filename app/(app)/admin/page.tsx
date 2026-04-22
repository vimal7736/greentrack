"use client";
import { useState, useEffect } from "react";
import { Users, Building2, TrendingUp, FileText, Shield, Edit3, Save, AlertCircle } from "lucide-react";

const TABS = ["Overview", "Organisations", "Emission Factors"];

const TIER_COLORS: Record<string, string> = {
  free: "bg-gray-100 text-gray-600",
  starter: "bg-blue-100 text-blue-700",
  business: "bg-green-100 text-green-700",
};

interface Stats {
  total_orgs: number;
  total_users: number;
  bills_today: number;
  total_bills: number;
  mrr: number;
  tier_counts: { free: number; starter: number; business: number };
}

interface Org {
  id: string;
  name: string;
  tier: string;
  created_at: string;
  user_count: number;
  bill_count: number;
}

interface Factor {
  id: string;
  fuel_type: string;
  unit: string;
  kg_co2e_per_unit: number;
  scope: number;
  valid_from: string;
  valid_to: string;
}

export default function AdminPage() {
  const [tab, setTab] = useState("Overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [factors, setFactors] = useState<Factor[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    if (tab === "Overview") fetchStats();
    if (tab === "Organisations") fetchOrgs();
    if (tab === "Emission Factors") fetchFactors();
  }, [tab]);

  async function fetchStats() {
    const res = await fetch("/api/admin/stats");
    if (res.status === 403) { setForbidden(true); return; }
    if (res.ok) setStats(await res.json());
  }

  async function fetchOrgs() {
    const res = await fetch("/api/admin/orgs");
    if (res.status === 403) { setForbidden(true); return; }
    if (res.ok) { const d = await res.json(); setOrgs(d.orgs); }
  }

  async function fetchFactors() {
    const res = await fetch("/api/admin/factors");
    if (res.status === 403) { setForbidden(true); return; }
    if (res.ok) { const d = await res.json(); setFactors(d.factors); }
  }

  async function handleSaveFactor(id: string) {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/factors", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, kg_co2e_per_unit: Number(editValue) }),
    });
    setSaving(false);
    if (res.ok) {
      setFactors(factors.map((f) => f.id === id ? { ...f, kg_co2e_per_unit: Number(editValue) } : f));
      setEditingId(null);
    } else {
      const d = await res.json();
      setError(d.error ?? "Failed to save");
    }
  }

  if (forbidden) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Shield className="w-12 h-12 text-red-300" />
        <p className="text-lg font-semibold text-gray-700">Access Denied</p>
        <p className="text-sm text-gray-400">This page requires superadmin access.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center">
          <Shield className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-500 text-sm">Super Admin · GreenTrack AI</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "Overview" && (
        <div className="space-y-5">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Total Organisations", value: stats?.total_orgs ?? "—", icon: <Building2 className="w-5 h-5 text-blue-600" />, color: "bg-blue-50" },
              { label: "Total Users", value: stats?.total_users ?? "—", icon: <Users className="w-5 h-5 text-green-600" />, color: "bg-green-50" },
              { label: "Monthly MRR", value: stats ? `£${stats.mrr.toLocaleString()}` : "—", icon: <TrendingUp className="w-5 h-5 text-purple-600" />, color: "bg-purple-50" },
              { label: "Bills Today", value: stats?.bills_today ?? "—", icon: <FileText className="w-5 h-5 text-orange-500" />, color: "bg-orange-50" },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-gray-500 font-medium">{label}</p>
                  <div className={`w-9 h-9 ${color} rounded-lg flex items-center justify-center`}>{icon}</div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              </div>
            ))}
          </div>

          {stats && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-xs text-gray-500 font-medium mb-3">Plan Distribution</p>
                <div className="space-y-2">
                  {[
                    { name: "Free", count: stats.tier_counts.free, color: "bg-gray-300" },
                    { name: "Starter", count: stats.tier_counts.starter, color: "bg-blue-400" },
                    { name: "Business", count: stats.tier_counts.business, color: "bg-green-500" },
                  ].map(({ name, count, color }) => {
                    const pct = stats.total_orgs > 0 ? (count / stats.total_orgs) * 100 : 0;
                    return (
                      <div key={name} className="flex items-center gap-2 text-xs">
                        <div className={`w-2 h-2 rounded-full ${color}`} />
                        <span className="text-gray-600 w-16">{name}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-gray-500 w-6 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-xs text-gray-500 font-medium mb-3">Revenue Breakdown</p>
                <div className="space-y-1.5 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>{stats.tier_counts.starter} × Starter (£24)</span>
                    <span className="font-semibold">£{(stats.tier_counts.starter * 24).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{stats.tier_counts.business} × Business (£99)</span>
                    <span className="font-semibold">£{(stats.tier_counts.business * 99).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-100 pt-1.5 font-bold text-gray-900">
                    <span>Total MRR (ex VAT)</span>
                    <span>£{stats.mrr.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Organisations */}
      {tab === "Organisations" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Organisation</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Plan</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Users</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Bills</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orgs.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">Loading…</td></tr>
              )}
              {orgs.map((org) => (
                <tr key={org.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{org.name}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIER_COLORS[org.tier] ?? TIER_COLORS.free}`}>
                      {org.tier.charAt(0).toUpperCase() + org.tier.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-600">{org.user_count}</td>
                  <td className="px-6 py-4 text-center text-gray-600">{org.bill_count}</td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {new Date(org.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Emission Factors */}
      {tab === "Emission Factors" && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Edit the official DEFRA emission factors. Changes apply to all future calculations.
          </p>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Fuel Type</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Unit</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">kgCO₂e/unit</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Scope</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Valid From</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Valid To</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {factors.length === 0 && (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-400">Loading…</td></tr>
                )}
                {factors.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900 capitalize">{f.fuel_type.replace("_", " ")}</td>
                    <td className="px-6 py-4 text-gray-600">{f.unit}</td>
                    <td className="px-6 py-4 text-right">
                      {editingId === f.id ? (
                        <input
                          type="number"
                          step="0.001"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-24 border border-green-400 rounded px-2 py-1 text-sm text-right focus:outline-none"
                        />
                      ) : (
                        <span className="font-mono font-semibold text-gray-900">{f.kg_co2e_per_unit}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        f.scope === 1 ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        Scope {f.scope}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{f.valid_from}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{f.valid_to}</td>
                    <td className="px-6 py-4">
                      {editingId === f.id ? (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => handleSaveFactor(f.id)}
                          className="text-green-600 hover:text-green-800 transition-colors disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => { setEditingId(f.id); setEditValue(String(f.kg_co2e_per_unit)); }}
                          className="text-gray-400 hover:text-green-600 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
