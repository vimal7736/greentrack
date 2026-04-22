"use client";
import { useState, useEffect } from "react";
import { FileText, Download, TrendingDown, BarChart2, AlertCircle, Calendar } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

const TYPE_LABELS: Record<string, string> = {
  electricity: "UK Electricity",
  gas: "Natural Gas",
  fuel_diesel: "Diesel",
  fuel_petrol: "Petrol",
  water: "Water",
};

const SCOPE_LABELS: Record<string, string> = {
  electricity: "Scope 2",
  gas: "Scope 1",
  fuel_diesel: "Scope 1",
  fuel_petrol: "Scope 1",
  water: "Scope 3",
};

interface Summary {
  org: { name: string; tier: string };
  year: string;
  total_co2_kg: number;
  total_kwh: number;
  total_cost_gbp: number;
  by_type: { type: string; co2_kg: number }[];
  by_scope: { scope1: number; scope2: number; scope3: number };
  by_quarter: { period: string; co2: number }[];
  bill_count: number;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

export default function ReportsPage() {
  const [year, setYear] = useState(String(CURRENT_YEAR));
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/reports/summary?year=${year}`);
      if (res.ok) setSummary(await res.json());
      else setError("Failed to load report data");
      setLoading(false);
    }
    load();
  }, [year]);

  function handleDownload() {
    window.open(`/api/reports/print?year=${year}`, "_blank");
  }

  const isFreePlan = summary?.org.tier === "free";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 text-sm mt-1">
            SECR-ready PDF reports and year-on-year comparisons
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="text-sm text-gray-700 bg-transparent focus:outline-none"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            disabled={isFreePlan || loading}
            onClick={handleDownload}
            title={isFreePlan ? "Upgrade to download PDF reports" : ""}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {isFreePlan && !loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 text-sm text-blue-700">
          <FileText className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">PDF reports require a paid plan</p>
            <p className="text-xs mt-1 text-blue-600">
              Upgrade to Starter or Business to download SECR-compliant PDF reports.{" "}
              <a href="/billing" className="underline font-medium">View plans →</a>
            </p>
          </div>
        </div>
      )}

      {/* Report preview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-600" />
              SECR Carbon Report — {summary?.org.name ?? "Loading…"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {summary?.bill_count ?? 0} bills · Uses official 2025 DEFRA emission factors
            </p>
          </div>
          <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium capitalize">
            {summary?.org.tier ?? "free"} Plan
          </span>
        </div>

        {/* Preview panel */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-green-800 px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-white font-bold text-lg">{summary?.org.name ?? "—"}</p>
              <p className="text-green-300 text-sm">Carbon Emissions Report · {year}</p>
            </div>
            <div className="text-right">
              <p className="text-green-300 text-xs">GreenTrack AI</p>
              <p className="text-white text-xs font-medium">SECR Compliant</p>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  label: "Total CO₂e",
                  value: loading ? "—" : `${((summary?.total_co2_kg ?? 0) / 1000).toFixed(3)} tCO₂e`,
                  note: "Scope 1 + 2 + 3",
                },
                {
                  label: "Total Energy",
                  value: loading ? "—" : `${(summary?.total_kwh ?? 0).toLocaleString()} kWh`,
                  note: "Electricity + Gas",
                },
                {
                  label: "Bills Analysed",
                  value: loading ? "—" : String(summary?.bill_count ?? 0),
                  note: `In ${year}`,
                },
              ].map(({ label, value, note }) => (
                <div key={label} className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-base font-bold text-gray-900 mt-1">{value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{note}</p>
                </div>
              ))}
            </div>

            {/* Scope split */}
            {summary && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Scope 1", value: summary.by_scope.scope1, color: "bg-orange-50 text-orange-800", sub: "Gas + Fuel" },
                  { label: "Scope 2", value: summary.by_scope.scope2, color: "bg-blue-50 text-blue-800", sub: "Electricity" },
                  { label: "Scope 3", value: summary.by_scope.scope3, color: "bg-cyan-50 text-cyan-800", sub: "Water" },
                ].map(({ label, value, color, sub }) => (
                  <div key={label} className={`${color.split(" ")[0]} rounded-lg p-3 text-center`}>
                    <p className={`text-xs font-semibold ${color.split(" ")[1]}`}>{label}</p>
                    <p className={`text-sm font-bold ${color.split(" ")[1]} mt-1`}>{Math.round(value)} kg</p>
                    <p className="text-xs opacity-70 mt-0.5">{sub}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Emissions table */}
            <div>
              <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                Emissions by Source
              </h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b">
                    <th className="text-left pb-2">Source</th>
                    <th className="text-left pb-2">Scope</th>
                    <th className="text-right pb-2">kgCO₂e</th>
                    <th className="text-right pb-2">% of Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr><td colSpan={4} className="py-4 text-center text-gray-400 text-xs">Loading…</td></tr>
                  ) : (
                    summary?.by_type.map(({ type, co2_kg }) => (
                      <tr key={type}>
                        <td className="py-1.5">{TYPE_LABELS[type] ?? type}</td>
                        <td className="py-1.5 text-xs text-gray-500">{SCOPE_LABELS[type] ?? "—"}</td>
                        <td className="py-1.5 text-right">{co2_kg.toFixed(2)}</td>
                        <td className="py-1.5 text-right text-xs text-gray-500">
                          {summary.total_co2_kg > 0
                            ? ((co2_kg / summary.total_co2_kg) * 100).toFixed(1)
                            : "0"}%
                        </td>
                      </tr>
                    ))
                  )}
                  {summary && (
                    <tr className="font-bold border-t border-gray-300">
                      <td className="pt-2">Total</td>
                      <td></td>
                      <td className="pt-2 text-right">{summary.total_co2_kg.toFixed(2)}</td>
                      <td className="pt-2 text-right text-xs">100%</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-gray-400 border-t border-gray-100 pt-3">
              Emission factors from UK Government 2025 Greenhouse Gas Conversion Factors (DESNZ).
              Report generated by GreenTrack AI.
            </p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-green-600" /> Quarterly CO₂ Breakdown
          </h2>
          <p className="text-xs text-gray-400 mb-4">CO₂e per quarter (kg) — {year}</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={summary?.by_quarter ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="co2" fill="#16a34a" radius={[4, 4, 0, 0]} name="CO₂e (kg)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-blue-600" /> Emissions by Type
          </h2>
          <p className="text-xs text-gray-400 mb-4">kgCO₂e — {year}</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={(summary?.by_type ?? []).map((b) => ({
                name: TYPE_LABELS[b.type] ?? b.type,
                co2: b.co2_kg,
              }))}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
              <Tooltip formatter={(v) => [`${v} kg CO₂e`, "Emissions"]} />
              <Bar dataKey="co2" radius={[0, 4, 4, 0]} fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
