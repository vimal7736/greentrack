"use client";
import { useState, useEffect, useCallback } from "react";
import { Search, Filter, Download, Eye, Trash2, AlertCircle } from "lucide-react";

import { PageBackground }           from "@/components/ui/PageBackground";
import { PageHeader }               from "@/components/ui/PageHeader";
import { StatCard }                 from "@/components/ui/StatCard";
import { BillTypeBadge }            from "@/components/ui/BillTypeBadge";
import { EmptyState }               from "@/components/ui/EmptyState";
import { Pagination }               from "@/components/ui/Pagination";
import { Button }                   from "@/components/ui/Button";
import { Input }                    from "@/components/ui/Input";
import { DataTable, type ColumnDef }from "@/components/ui/DataTable";
import { BILL_TYPE_FILTER_OPTIONS } from "@/lib/carbon/constants";
import { formatCost, formatCarbonTonnes } from "@/lib/utils/format";
import { type Bill, type BillsApiResponse } from "@/types";

const PAGE_SIZE = 10;

export default function HistoryPage() {
  const [page,            setPage]           = useState(1);
  const [typeFilter,      setTypeFilter]     = useState("all");
  const [search,          setSearch]         = useState("");
  const [debouncedSearch, setDebouncedSearch]= useState("");
  const [data,            setData]           = useState<BillsApiResponse | null>(null);
  const [loading,         setLoading]        = useState(true);
  const [error,           setError]          = useState<string | null>(null);
  const [deletingId,      setDeletingId]     = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchBills = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      page:      String(page),
      page_size: String(PAGE_SIZE),
      type:      typeFilter,
      search:    debouncedSearch,
    });
    const res = await fetch(`/api/bills?${params}`);
    if (!res.ok) { setError("Failed to load bills"); setLoading(false); return; }
    setData(await res.json());
    setLoading(false);
  }, [page, typeFilter, debouncedSearch]);

  useEffect(() => { fetchBills(); }, [fetchBills]);
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
    const res    = await fetch(`/api/bills/export?${params}`);
    if (!res.ok) { setError("Export failed"); return; }
    const blob   = await res.blob();
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement("a");
    a.href       = url;
    a.download   = "greentrack-bills.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const bills      = data?.bills ?? [];
  const total      = data?.total ?? 0;
  const totalPages = data?.total_pages ?? 1;
  const summary    = data?.summary;

  /* ── Column definitions for DataTable ─────────────────────────── */
  const columns: ColumnDef<Bill>[] = [
    {
      key: "type", header: "Status / Type",
      render: (bill) => <BillTypeBadge type={bill.bill_type} />,
    },
    {
      key: "date", header: "Audit Date",
      render: (bill) => <span className="text-xs font-black text-text-secondary">{bill.bill_date}</span>,
    },
    {
      key: "supplier", header: "Supplier",
      render: (bill) => <span className="text-xs font-bold text-text-muted">{bill.supplier ?? "—"}</span>,
    },
    {
      key: "usage", header: "Consumption", align: "right",
      render: (bill) => (
        <span className="text-xs font-black text-text-primary">
          {bill.usage_amount.toLocaleString()} <span className="opacity-40 text-[9px]">{bill.usage_unit}</span>
        </span>
      ),
    },
    {
      key: "co2", header: "Carbon Impact", align: "right",
      render: (bill) => (
        <span className="text-sm font-black text-gt-green-700">
          {bill.co2_kg.toFixed(1)} <span className="text-[9px] opacity-40 uppercase">kg</span>
        </span>
      ),
    },
    {
      key: "cost", header: "Cost", align: "right",
      render: (bill) => <span className="text-xs font-black text-text-primary">{formatCost(bill.cost_gbp)}</span>,
    },
    {
      key: "actions", header: "", align: "right",
      render: (bill) => (
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
          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 className="w-4 h-4" />}
            disabled={deletingId === bill.id}
            onClick={() => handleDelete(bill.id)}
            title="Archive Record"
            className="w-9 h-9 p-0"
          >
            {""}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="relative space-y-8 animate-fade-in pb-20">
      <PageBackground />

      <PageHeader
        icon={<Eye className="w-5 h-5" />}
        title="Bill History"
        subtitle={loading ? "Refreshing records…" : `Archiving ${total} verified utility records`}
        right={
          <>
            <Button variant="secondary" size="md" icon={<Download className="w-4 h-4" />} onClick={handleExportCsv}>
              Export CSV
            </Button>
            <div className="neu-raised inline-flex items-center gap-2 px-4 py-2 rounded-xl" style={{ color: "var(--brand-green-dark)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-gt-green-500 animate-pulse-green inline-block" />
              <span className="text-xs font-bold uppercase tracking-widest">Live Sync</span>
            </div>
          </>
        }
      />

      <div className="grid grid-cols-3 gap-6">
        <StatCard label="Total Records"    value={total}                                          unit="Bills"  icon={<Eye className="w-4 h-4" />} />
        <StatCard label="Carbon Footprint" value={formatCarbonTonnes(summary?.total_co2_kg ?? 0)} unit="tCO₂e" icon={<AlertCircle className="w-4 h-4" />} />
        <StatCard label="Aggregate Cost"   value={formatCost(summary?.total_cost_gbp)}            unit="GBP"   icon={<Download className="w-4 h-4" />} />
      </div>

      {error && (
        <div className="glass-orange rounded-2xl p-4 flex items-center gap-3 text-xs font-bold border-none">
          <AlertCircle className="w-4 h-4 shrink-0 text-brand-orange-dark" />
          <span style={{ color: "var(--brand-orange-dark)" }}>{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center justify-between gap-6">
        <div className="flex-1 max-w-sm">
          <Input
            icon={<Search className="w-4 h-4" />}
            placeholder="Search archive..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-bg-inset/30 border border-border-subtle">
          <Filter className="w-3.5 h-3.5 text-text-muted ml-1 mr-2" />
          {BILL_TYPE_FILTER_OPTIONS.map(({ key, label }) => (
            <Button
              key={key}
              variant="ghost"
              size="sm"
              onClick={() => setTypeFilter(key)}
              className={typeFilter === key ? "!bg-gt-green-600 !text-white shadow-lg shadow-gt-green-500/30 scale-[1.02]" : ""}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* DataTable */}
      <DataTable<Bill>
        columns={columns}
        data={bills}
        rowKey={(b) => b.id}
        loading={loading}
        loadingLabel="Syncing Data..."
        emptyIcon={<Search className="w-10 h-10" />}
        emptyTitle="No Records Found"
        emptyMessage="Your archive is empty. Try adjusting your filters or upload your first utility bill to start tracking."
        emptyCtaLabel="Upload First Bill"
        emptyCtaHref="/upload"
        footer={
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={PAGE_SIZE}
            onPrev={() => setPage(page - 1)}
            onNext={() => setPage(page + 1)}
            onPage={setPage}
          />
        }
      />
    </div>
  );
}
