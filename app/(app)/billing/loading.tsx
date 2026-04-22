export default function BillingLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading billing page">
      <div className="h-7 w-28 bg-gray-200 rounded-lg" />
      <div className="grid grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <div className="h-4 w-20 bg-gray-200 rounded" />
            <div className="h-8 w-24 bg-gray-200 rounded" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="h-3 w-full bg-gray-100 rounded" />
              ))}
            </div>
            <div className="h-10 w-full bg-gray-200 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
