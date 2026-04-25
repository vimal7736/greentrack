import type { ReactNode } from "react";
import { Spinner }    from "./Spinner";
import { EmptyState } from "./EmptyState";

export interface ColumnDef<T> {
  key:       string;
  header:    string;
  align?:    "left" | "right" | "center";
  render:    (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns:       ColumnDef<T>[];
  data:          T[];
  rowKey:        (row: T) => string;
  loading?:      boolean;
  loadingLabel?: string;
  emptyIcon?:    ReactNode;
  emptyTitle?:   string;
  emptyMessage?: string;
  emptyCtaLabel?: string;
  emptyCtaHref?:  string;
  onRowHover?:   boolean;
  footer?:       ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  loading       = false,
  loadingLabel  = "Loading...",
  emptyIcon,
  emptyTitle    = "No Records Found",
  emptyMessage  = "No data available.",
  emptyCtaLabel,
  emptyCtaHref,
  footer,
}: DataTableProps<T>) {
  const alignClass = { left: "text-left", right: "text-right", center: "text-center" };

  return (
    <div className="premium-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bg-inset/20 border-b border-border-subtle">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-6 first:px-8 last:px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ${alignClass[col.align ?? "left"]}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle/50">
            {loading && (
              <tr>
                <td colSpan={columns.length} className="py-20 text-center">
                  <Spinner label={loadingLabel} />
                </td>
              </tr>
            )}

            {!loading && data.length === 0 && (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState
                    icon={emptyIcon ?? null}
                    title={emptyTitle}
                    description={emptyMessage}
                    ctaLabel={emptyCtaLabel}
                    ctaHref={emptyCtaHref}
                  />
                </td>
              </tr>
            )}

            {!loading && data.map((row) => (
              <tr
                key={rowKey(row)}
                className="group hover:bg-gt-green-50/30 transition-all duration-300"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-6 first:px-8 last:px-8 py-5 ${alignClass[col.align ?? "left"]}`}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {footer && <div>{footer}</div>}
    </div>
  );
}
