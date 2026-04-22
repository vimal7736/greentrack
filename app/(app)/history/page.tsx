"use client";
import { useState, useEffect, useCallback } from "react";
import { Search, Filter, Download, Eye, Trash2, AlertCircle } from "lucide-react";

const PAGE_SIZE = 10;

const BILL_TYPE_LABELS: Record<string, string> = {
  electricity: "Electricity",
  gas: "Gas",
  water: "Water",
  fuel_diesel: "Diesel",
  fuel_petrol: "Petrol",
};

const TYPE_COLORS: Record<string, string> = {
  electricity: "bg-yellow-100 text-yellow-700",
  gas: "bg-blue-100 text-blue-700",
  water: "bg-cyan-100 text-cyan-700",
  fuel_diesel: "bg-orange-100 text-orange-700",
  fuel_petrol: "bg-orange-100 text-orange-700",
};

const FILTER_OPTIONS = [
  { key: "all", label: "All" },
  { key: "electricity", label: "Electricity" },
  { key: "gas", label: "Gas" },
  { key: "water", label: "Water" },
  { key: "fuel_diesel", label: "Diesel" },
  { key: "fuel_petrol", label: "Petrol" },
];

interface Bill {
  id: string;
  bill_type: string;
  bill_date: string;
  usage_amount: number;
  usage_unit: string;
  co2_kg: number;
  cost_gbp: number | null;
  supplier: string | null;
  pdf_url: string | null;
  created_at: string;
}

interface ApiResponse {
  bills: Bill[];
  total: number;
  page: number;
  total_pages: number;
  summary: { total_co2_kg: number; total_cost_gbp: number };
}

export default function HistoryPage() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchBills = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(PAGE_SIZE),
      type: typeFilter,
      search: debouncedSearch,
    });
    const res = await fetch(`/api/bills?${params}`);
    if (!res.ok) {
      setError("Failed to load bills");
      setLoading(false);
      return;
    }
    setData(await res.json());
    setLoading(false);
  }, [page, typeFilter, debouncedSearch]);

  useEffect(() => { fetchBills(); }, [fetchBills]);

  // Reset to page 1 when filter/search changes
  useEffect(() => { setPage(1); }, [typeFilter, debouncedSearch]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this bill? This cannot be undone.")) return;
    setDeletingId(id);
    const res = await fetch(`/api/bills?id=${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) fetchBills();
    else setError("Failed to delete bill");
  }

  async function handleExportCsv() {
    const params = new URLSearchParams({ type: typeFilter, search: debouncedSearch, page_size: "1000" });
    const res = await fetch(`/api/bills/export?${params}`);
    if (!res.ok) { setError("Export failed"); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "greentrack-bills.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const bills = data?.bills ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.total_pages ?? 1;
  const summary = data?.summary;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bill History</h1>
          <p className="text-gray-500 text-sm mt-1">
            {loading ? "Loading…" : `${total} bills · ${((summary?.total_co2_kg ?? 0) / 1000).toFixed(3)} tCO₂e total`}
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportCsv}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by date or supplier…"
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400" />
          {FILTER_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTypeFilter(key)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                typeFilter === key
                  ? "bg-green-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Supplier</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Usage</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">CO₂e (kg)</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cost</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-400">Loading…</td>
              </tr>
            )}
            {!loading && bills.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-400">
                  No bills found.{" "}
                  <a href="/upload" className="text-green-600 hover:underline">Upload your first bill →</a>
                </td>
              </tr>
            )}
            {bills.map((bill) => (
              <tr key={bill.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${TYPE_COLORS[bill.bill_type] ?? "bg-gray-100 text-gray-600"}`}>
                    {BILL_TYPE_LABELS[bill.bill_type] ?? bill.bill_type}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600">{bill.bill_date}</td>
                <td className="px-6 py-4 text-gray-600">{bill.supplier ?? "—"}</td>
                <td className="px-6 py-4 text-right text-gray-700">{bill.usage_amount} {bill.usage_unit}</td>
                <td className="px-6 py-4 text-right font-semibold text-gray-900">{bill.co2_kg}</td>
                <td className="px-6 py-4 text-right text-gray-600">
                  {bill.cost_gbp != null ? `£${bill.cost_gbp.toFixed(2)}` : "—"}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {bill.pdf_url && (
                      <a
                        href={`/api/bills/view?path=${encodeURIComponent(bill.pdf_url)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-green-600 transition-colors"
                        title="View PDF"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      type="button"
                      disabled={deletingId === bill.id}
                      onClick={() => handleDelete(bill.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
                      title="Delete bill"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 text-xs rounded-lg font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-40"
              >
                ← Prev
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 text-xs rounded-lg font-medium transition-colors ${
                    page === p ? "bg-green-600 text-white" : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 text-xs rounded-lg font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-xs text-gray-500">Total Bills</p>
          <p className="text-lg font-bold text-gray-900 mt-1">{total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-xs text-gray-500">Total CO₂e</p>
          <p className="text-lg font-bold text-gray-900 mt-1">{summary?.total_co2_kg.toFixed(1) ?? "—"} kg</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-xs text-gray-500">Total Cost</p>
          <p className="text-lg font-bold text-gray-900 mt-1">
            {summary?.total_cost_gbp != null ? `£${summary.total_cost_gbp.toFixed(2)}` : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
