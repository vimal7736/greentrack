export default function TeamLoading() {
  return (
    <div className="space-y-6 animate-pulse px-4 md:px-0" aria-label="Loading team page" aria-busy="true">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-28 bg-bg-inset rounded-lg" />
          <div className="h-4 w-52 bg-bg-inset/50 rounded" />
        </div>
        <div className="h-10 w-full md:w-32 bg-bg-inset rounded-lg" />
      </div>

      <div className="premium-card border-none overflow-hidden">
        <div className="border-b border-border-subtle bg-bg-inset/10 px-6 py-4">
          <div className="h-4 w-24 bg-bg-inset rounded" />
        </div>
        <div className="divide-y divide-border-subtle">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-4 py-4 md:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-bg-inset rounded-full shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-32 bg-bg-inset rounded" />
                  <div className="h-3 w-full md:w-40 bg-bg-inset/50 rounded" />
                </div>
              </div>
              <div className="flex items-center justify-between md:justify-end gap-2">
                <div className="h-6 w-16 bg-bg-inset/50 rounded-full" />
                <div className="h-8 w-8 bg-bg-inset/30 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
