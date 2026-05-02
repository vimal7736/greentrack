export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading admin panel">
      {/* KPI Cards skeleton */}
      <div className="grid grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="premium-card p-6 space-y-3"
            style={{ borderTop: "3px solid var(--border-subtle)" }}
          >
            <div className="flex items-center justify-between">
              <div className="h-2.5 w-20 rounded-full" style={{ background: "var(--bg-inset)" }} />
              <div
                className="w-9 h-9 rounded-xl"
                style={{ background: "var(--bg-inset)", boxShadow: "var(--shadow-inset-xs)" }}
              />
            </div>
            <div className="h-7 w-16 rounded-lg" style={{ background: "var(--bg-inset)" }} />
          </div>
        ))}
      </div>

      {/* Two column cards skeleton */}
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl p-6 space-y-4"
            style={{
              background: "var(--neu-base)",
              boxShadow: "var(--shadow-raised)",
              border: "var(--card-border)",
            }}
          >
            <div className="h-2.5 w-32 rounded-full" style={{ background: "var(--bg-inset)" }} />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--bg-inset)" }} />
                  <div className="flex-1 h-2.5 rounded-full" style={{ background: "var(--bg-inset)" }} />
                  <div className="w-8 h-4 rounded" style={{ background: "var(--bg-inset)" }} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "var(--neu-base)",
          boxShadow: "var(--shadow-raised)",
          border: "var(--card-border)",
        }}
      >
        <div className="px-6 py-5 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <div className="w-2 h-2 rounded-full" style={{ background: "var(--brand-orange)", opacity: 0.3 }} />
          <div className="h-2.5 w-28 rounded-full" style={{ background: "var(--bg-inset)" }} />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <div className="w-9 h-9 rounded-xl" style={{ background: "var(--bg-inset)", boxShadow: "var(--shadow-inset-xs)" }} />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-40 rounded" style={{ background: "var(--bg-inset)" }} />
              <div className="h-2 w-24 rounded" style={{ background: "var(--bg-inset)", opacity: 0.5 }} />
            </div>
            <div className="h-3 w-16 rounded" style={{ background: "var(--bg-inset)" }} />
          </div>
        ))}
      </div>
    </div>
  );
}
