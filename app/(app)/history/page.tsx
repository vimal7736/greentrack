"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Filter, Download, Eye, Trash2, AlertCircle, ArrowUpRight } from "lucide-react";

const PAGE_SIZE = 10;

const BILL_TYPE_LABELS: Record<string, string> = {
  electricity: "Electricity",
  gas: "Gas",
  water: "Water",
  fuel_diesel: "Diesel",
  fuel_petrol: "Petrol",
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
    <div className="relative space-y-8 animate-fade-in pb-20">
      {/* Background Decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gt-green-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-orange/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />
      </div>
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Eye className="w-5 h-5" style={{ color: "var(--brand-green)" }} />
            <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
              Bill History
            </h1>
          </div>
          <p className="text-sm font-bold opacity-60" style={{ color: "var(--text-muted)" }}>
            {loading ? "Refreshing records…" : `Archiving ${total} verified utility records`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportCsv}
            className="neu-btn flex items-center gap-2 bg-white text-text-primary text-xs px-4 py-2.5 rounded-xl font-black uppercase tracking-widest transition-all hover:bg-black hover:text-white border-none"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          
          <div
            className="neu-raised inline-flex items-center gap-2 px-4 py-2 rounded-xl"
            style={{ color: "var(--brand-green-dark)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-gt-green-500 animate-pulse-green inline-block" />
            <span className="text-xs font-bold uppercase tracking-widest">Live Sync</span>
          </div>
        </div>
      </div>

      {/* ── Summary Bento ────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-6">
        {[
          { label: "Total Records", value: total, unit: "Bills", icon: <Eye className="w-4 h-4" /> },
          { label: "Carbon Footprint", value: ((summary?.total_co2_kg ?? 0) / 1000).toFixed(3), unit: "tCO₂e", icon: <AlertCircle className="w-4 h-4" /> },
          { label: "Aggregate Cost", value: summary?.total_cost_gbp != null ? `£${summary.total_cost_gbp.toLocaleString()}` : "—", unit: "GBP", icon: <Download className="w-4 h-4" /> },
        ].map((stat, i) => (
          <div key={i} className="premium-card p-6 flex flex-col justify-between h-32 relative overflow-hidden group">
            <div className="flex items-start justify-between relative z-10">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">
                {stat.label}
              </span>
              <div className="w-8 h-8 rounded-xl bg-bg-inset flex items-center justify-center text-text-muted group-hover:bg-gt-green-500 group-hover:text-white transition-all">
                {stat.icon}
              </div>
            </div>
            <div className="relative z-10 flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tighter text-text-primary">
                {stat.value}
              </span>
              <span className="text-xs font-bold text-text-muted">{stat.unit}</span>
            </div>
            {/* Background accent */}
            <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-gt-green-500/5 rounded-full blur-2xl group-hover:bg-gt-green-500/10 transition-colors" />
          </div>
        ))}
      </div>

      {error && (
        <div className="glass-orange rounded-2xl p-4 flex items-center gap-3 text-xs font-bold border-none">
          <AlertCircle className="w-4 h-4 shrink-0 text-brand-orange-dark" />
          <span style={{ color: "var(--brand-orange-dark)" }}>{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center justify-between gap-6">
        <div className="relative group flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-gt-green-500 transition-colors" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search archive..."
            className="w-full bg-bg-inset/50 border-2 border-transparent rounded-2xl pl-11 pr-4 py-3.5 text-sm font-black focus:border-gt-green-500 focus:bg-white transition-all outline-none"
            style={{ color: "var(--text-primary)" }}
          />
        </div>
        
        <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-bg-inset/30 border border-border-subtle">
          <Filter className="w-3.5 h-3.5 text-text-muted ml-1 mr-2" />
          {FILTER_OPTIONS.map(({ key, label }) => {
            const active = typeFilter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTypeFilter(key)}
                className={`text-[10px] px-4 py-2 rounded-xl font-black uppercase tracking-widest transition-all ${
                  active
                    ? "bg-gt-green-600 text-white shadow-lg shadow-gt-green-500/30 scale-[1.02]"
                    : "text-text-muted hover:text-text-primary hover:bg-white"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table Container */}
      <div className="premium-card overflow-hidden border-none shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bg-inset/20 border-b border-border-subtle">
                <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Status / Type</th>
                <th className="text-left px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Audit Date</th>
                <th className="text-left px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Supplier</th>
                <th className="text-right px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Consumption</th>
                <th className="text-right px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Carbon Impact</th>
                <th className="text-right px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Cost</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/50">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 animate-pulse">
                       <div className="w-10 h-10 border-4 border-gt-green-500 border-t-transparent rounded-full animate-spin" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Syncing Data...</span>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && bills.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-6 max-w-sm mx-auto animate-scale-in">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-[2.5rem] bg-bg-inset/50 flex items-center justify-center text-text-muted/20 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                           <Search className="w-10 h-10" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl shadow-premium flex items-center justify-center">
                           <AlertCircle className="w-5 h-5 text-brand-orange-dark" />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-xl font-black tracking-tight text-text-primary">
                          No Records Found
                        </h3>
                        <p className="text-sm font-bold text-text-muted leading-relaxed">
                          Your archive is empty. Try adjusting your filters or upload your first utility bill to start tracking.
                        </p>
                      </div>

                      <Link 
                        href="/upload" 
                        className="group relative px-8 py-4 rounded-[1.5rem] bg-black text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:bg-gt-green-600 hover:shadow-xl hover:shadow-gt-green-500/20 active:scale-95 overflow-hidden"
                      >
                         <div className="absolute inset-0 bg-gradient-to-r from-gt-green-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                         <span className="relative z-10 flex items-center gap-2">
                            Upload First Bill <ArrowUpRight className="w-4 h-4" />
                         </span>
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
              {bills.map((bill) => {
                const colors = {
                  electricity: "text-gt-green-600 bg-gt-green-500/10 border-gt-green-500/20",
                  gas: "text-blue-600 bg-blue-500/10 border-blue-500/20",
                  water: "text-cyan-600 bg-cyan-500/10 border-cyan-500/20",
                  fuel_diesel: "text-brand-orange-dark bg-brand-orange/10 border-brand-orange/20",
                  fuel_petrol: "text-brand-orange-dark bg-brand-orange/10 border-brand-orange/20",
                }[bill.bill_type] || "text-text-muted bg-bg-inset border-border-subtle";

                return (
                  <tr key={bill.id} className="group hover:bg-gt-green-50/30 transition-all duration-300">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full animate-pulse-green bg-current ${colors.split(' ')[0]}`} />
                        <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest border ${colors}`}>
                          {BILL_TYPE_LABELS[bill.bill_type] ?? bill.bill_type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-xs font-black text-text-secondary">{bill.bill_date}</td>
                    <td className="px-6 py-5 text-xs font-bold text-text-muted">{bill.supplier ?? "—"}</td>
                    <td className="px-6 py-5 text-right text-xs font-black text-text-primary">
                      {bill.usage_amount.toLocaleString()} <span className="opacity-40 text-[9px]">{bill.usage_unit}</span>
                    </td>
                    <td className="px-6 py-5 text-right">
                       <span className="text-sm font-black text-gt-green-700">
                         {bill.co2_kg.toFixed(1)} <span className="text-[9px] opacity-40 uppercase">kg</span>
                       </span>
                    </td>
                    <td className="px-6 py-5 text-right text-xs font-black text-text-primary">
                      {bill.cost_gbp != null ? `£${bill.cost_gbp.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        {bill.pdf_url && (
                          <a
                            href={`/api/bills/view?path=${encodeURIComponent(bill.pdf_url)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center text-text-muted hover:bg-gt-green-500 hover:text-white transition-all hover:scale-110"
                            title="View Record"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          type="button"
                          disabled={deletingId === bill.id}
                          onClick={() => handleDelete(bill.id)}
                          className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center text-text-muted hover:bg-brand-orange-dark hover:text-white transition-all hover:scale-110 disabled:opacity-40"
                          title="Archive Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-8 py-6 bg-bg-inset/10 border-t border-border-subtle/50">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">
              Displaying <span className="text-text-primary">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)}</span> of <span className="text-text-primary">{total}</span> records
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl text-text-muted hover:bg-white hover:text-text-primary disabled:opacity-30 transition-all"
              >
                Prev
              </button>
              <div className="flex items-center gap-1 bg-bg-inset/30 p-1 rounded-xl">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                   const p = i + 1;
                   const active = page === p;
                   return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={`w-9 h-9 text-[10px] rounded-lg font-black transition-all ${
                        active ? "bg-white text-gt-green-600 shadow-sm" : "text-text-muted hover:text-text-primary"
                      }`}
                    >
                      {p}
                    </button>
                   );
                })}
              </div>
              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl text-text-muted hover:bg-white hover:text-text-primary disabled:opacity-30 transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
