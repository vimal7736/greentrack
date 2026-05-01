export default function HistoryLoading() {
  return (
    <div className="space-y-6 animate-pulse px-4 md:px-0" aria-busy="true" aria-label="Loading history page">
      <div className="flex items-center justify-between">
        <div className="h-7 w-20 bg-bg-inset rounded-lg" />
        <div className="h-9 w-28 bg-bg-inset rounded-lg" />
      </div>
      
      {/* Search and Filters Skeleton */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="h-10 flex-1 bg-bg-inset/50 rounded-lg" />
        <div className="flex gap-2">
          <div className="h-10 w-28 bg-bg-inset/50 rounded-lg" />
          <div className="h-10 w-28 bg-bg-inset/50 rounded-lg" />
        </div>
      </div>

      {/* Table/Card Skeleton */}
      <div className="premium-card border-none overflow-hidden">
        <div className="hidden md:block h-10 bg-bg-inset/30 border-b border-border-subtle" />
        <div className="divide-y divide-border-subtle">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 px-4 py-4 md:px-6">
              {/* Mobile layout: stack info */}
              <div className="flex justify-between items-center md:hidden">
                <div className="h-5 w-24 bg-bg-inset rounded-full" />
                <div className="h-4 w-16 bg-bg-inset/50 rounded" />
              </div>
              
              {/* Desktop layout: horizontal */}
              <div className="hidden md:block h-5 w-20 bg-bg-inset rounded-full" />
              <div className="h-4 w-full md:w-24 bg-bg-inset/50 rounded md:flex-1" />
              <div className="hidden md:block h-4 w-20 bg-bg-inset/50 rounded" />
              <div className="flex justify-between items-center md:block">
                <div className="md:hidden text-[10px] text-text-muted font-bold uppercase tracking-widest">Amount</div>
                <div className="h-4 w-16 bg-bg-inset/50 rounded" />
              </div>
              <div className="hidden md:block h-4 w-20 bg-bg-inset/50 rounded" />
              <div className="hidden md:flex justify-end h-7 w-7 bg-bg-inset rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-2 mt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-8 w-8 bg-bg-inset/50 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
