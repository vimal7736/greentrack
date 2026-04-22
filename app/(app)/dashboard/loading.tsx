export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Loading dashboard" aria-busy="true">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-32 bg-gray-200 rounded-lg" />
          <div className="h-4 w-56 bg-gray-100 rounded" />
        </div>
        <div className="h-7 w-44 bg-gray-100 rounded-full" />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 bg-gray-100 rounded" />
              <div className="w-9 h-9 bg-gray-100 rounded-lg" />
            </div>
            <div className="h-6 w-28 bg-gray-200 rounded" />
            <div className="h-3 w-20 bg-gray-100 rounded" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
        <div className="h-48 bg-gray-100 rounded-lg" />
      </div>

      {/* Recent bills skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
        <div className="h-4 w-28 bg-gray-200 rounded" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-100 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
