export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse pb-20 px-4 md:px-0" aria-label="Loading dashboard" aria-busy="true">
      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-bg-inset shadow-premium" />
          <div className="space-y-2">
            <div className="h-7 w-48 bg-bg-inset rounded-lg" />
            <div className="h-4 w-32 bg-bg-inset/50 rounded" />
          </div>
        </div>
        <div className="h-10 w-full md:w-44 bg-bg-inset rounded-xl" />
      </div>

      {/* Stat cards skeleton - Responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="premium-card p-6 border-none space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-3 w-16 bg-bg-inset rounded-full opacity-50" />
              <div className="w-8 h-8 bg-bg-inset rounded-lg" />
            </div>
            <div className="space-y-2">
              <div className="h-8 w-24 bg-bg-inset rounded-xl" />
              <div className="h-3 w-20 bg-bg-inset/50 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid Skeleton - Responsive columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="col-span-1 lg:col-span-8 premium-card border-none p-6 md:p-8 space-y-6">
           <div className="h-4 w-40 bg-bg-inset rounded-full" />
           <div className="h-48 md:h-64 bg-bg-inset/30 rounded-2xl" />
        </div>
        <div className="col-span-1 lg:col-span-4 premium-card border-none p-6 md:p-8 flex flex-col items-center justify-center space-y-6">
           <div className="w-40 h-40 md:w-48 md:h-48 rounded-full border-[12px] md:border-[16px] border-bg-inset opacity-20" />
           <div className="h-4 w-24 bg-bg-inset rounded-full" />
        </div>
      </div>

      {/* Secondary Row Skeleton - Responsive columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
        <div className="col-span-1 lg:col-span-5 premium-card border-none p-6 md:p-8 space-y-4">
           <div className="h-4 w-32 bg-bg-inset rounded-full" />
           <div className="space-y-3">
              <div className="h-20 bg-bg-inset/30 rounded-xl" />
              <div className="h-20 bg-bg-inset/30 rounded-xl" />
           </div>
        </div>
        <div className="col-span-1 lg:col-span-4 premium-card border-none p-6 md:p-8 space-y-6">
           <div className="h-4 w-32 bg-bg-inset rounded-full" />
           <div className="space-y-4">
              {[1, 2, 3].map(j => (
                <div key={j} className="space-y-2">
                   <div className="flex justify-between"><div className="h-2 w-12 bg-bg-inset rounded" /><div className="h-2 w-8 bg-bg-inset rounded" /></div>
                   <div className="h-2 w-full bg-bg-inset/30 rounded-full" />
                </div>
              ))}
           </div>
        </div>
        <div className="col-span-1 md:col-span-2 lg:col-span-3 premium-card border-none p-6 md:p-8 space-y-4">
           <div className="h-4 w-24 bg-bg-inset rounded-full" />
           {[1, 2].map(j => (
             <div key={j} className="h-24 bg-bg-inset/20 rounded-xl" />
           ))}
        </div>
      </div>
    </div>
  );
}
