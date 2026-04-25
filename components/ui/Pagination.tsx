interface PaginationProps {
  page:       number;
  totalPages: number;
  total:      number;
  pageSize:   number;
  onPrev:     () => void;
  onNext:     () => void;
  onPage:     (p: number) => void;
}

export function Pagination({ page, totalPages, total, pageSize, onPrev, onNext, onPage }: PaginationProps) {
  if (totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end   = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between px-8 py-6 bg-bg-inset/10 border-t border-border-subtle/50">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">
        Displaying{" "}
        <span className="text-text-primary">{start}–{end}</span> of{" "}
        <span className="text-text-primary">{total}</span> records
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page === 1}
          onClick={onPrev}
          className="px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl text-text-muted hover:bg-white hover:text-text-primary disabled:opacity-30 transition-all"
        >
          Prev
        </button>

        <div className="flex items-center gap-1 bg-bg-inset/30 p-1 rounded-xl">
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const p      = i + 1;
            const active = page === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPage(p)}
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
          onClick={onNext}
          className="px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl text-text-muted hover:bg-white hover:text-text-primary disabled:opacity-30 transition-all"
        >
          Next
        </button>
      </div>
    </div>
  );
}
