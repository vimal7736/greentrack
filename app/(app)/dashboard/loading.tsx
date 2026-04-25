export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse pb-20" aria-label="Loading dashboard" aria-busy="true">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-bg-inset shadow-premium" />
          <div className="space-y-2">
            <div className="h-7 w-48 bg-bg-inset rounded-lg" />
            <div className="h-4 w-32 bg-bg-inset/50 rounded" />
          </div>
        </div>
        <div className="h-10 w-44 bg-bg-inset rounded-xl" />
      </div>

      {/* Stat cards skeleton - Now 5 cards to match the dashboard */}
      <div className="grid grid-cols-5 gap-4">
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

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8 premium-card border-none p-8 space-y-6">
           <div className="h-4 w-40 bg-bg-inset rounded-full" />
           <div className="h-64 bg-bg-inset/30 rounded-2xl" />
        </div>
        <div className="col-span-4 premium-card border-none p-8 flex flex-col items-center justify-center space-y-6">
           <div className="w-48 h-48 rounded-full border-[16px] border-bg-inset opacity-20" />
           <div className="h-4 w-24 bg-bg-inset rounded-full" />
        </div>
      </div>

      {/* Secondary Row Skeleton */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-5 premium-card border-none p-8 space-y-4">
           <div className="h-4 w-32 bg-bg-inset rounded-full" />
           <div className="space-y-3">
              <div className="h-20 bg-bg-inset/30 rounded-xl" />
              <div className="h-20 bg-bg-inset/30 rounded-xl" />
           </div>
        </div>
        <div className="col-span-4 premium-card border-none p-8 space-y-6">
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
        <div className="col-span-3 premium-card border-none p-8 space-y-4">
           <div className="h-4 w-24 bg-bg-inset rounded-full" />
           {[1, 2].map(j => (
             <div key={j} className="h-24 bg-bg-inset/20 rounded-xl" />
           ))}
        </div>
      </div>
    </div>
  );
}
