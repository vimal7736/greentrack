export default function ReportsLoading() {
  return (
    <div className="space-y-6 animate-pulse px-4 md:px-0" aria-busy="true" aria-label="Loading reports page">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="h-7 w-28 bg-bg-inset rounded-lg" />
        <div className="h-10 w-full md:w-36 bg-bg-inset rounded-lg" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="premium-card border-none p-5 space-y-2">
            <div className="h-3 w-24 bg-bg-inset rounded opacity-50" />
            <div className="h-7 w-28 bg-bg-inset rounded" />
          </div>
        ))}
      </div>

      <div className="premium-card border-none p-6 space-y-4">
        <div className="h-4 w-40 bg-bg-inset rounded" />
        <div className="h-40 md:h-52 bg-bg-inset/20 rounded-2xl" />
      </div>

      <div className="premium-card border-none p-6 space-y-4">
        <div className="h-4 w-32 bg-bg-inset rounded" />
        <div className="h-32 md:h-36 bg-bg-inset/20 rounded-2xl" />
      </div>
    </div>
  );
}
