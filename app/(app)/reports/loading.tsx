export default function ReportsLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading reports page">
      <div className="flex items-center justify-between">
        <div className="h-7 w-28 bg-gray-200 rounded-lg" />
        <div className="h-9 w-36 bg-gray-200 rounded-lg" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
            <div className="h-3 w-24 bg-gray-100 rounded" />
            <div className="h-7 w-28 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
        <div className="h-4 w-40 bg-gray-200 rounded" />
        <div className="h-52 bg-gray-100 rounded-lg" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
        <div className="h-4 w-32 bg-gray-200 rounded" />
        <div className="h-36 bg-gray-100 rounded-lg" />
      </div>
    </div>
  );
}
