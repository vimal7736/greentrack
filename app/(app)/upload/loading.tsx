export default function UploadLoading() {
  return (
    <div className="space-y-6 animate-pulse px-4 md:px-0" aria-label="Loading upload page" aria-busy="true">
      <div className="space-y-2">
        <div className="h-7 w-36 bg-bg-inset rounded-lg" />
        <div className="h-4 w-full md:w-64 bg-bg-inset/50 rounded" />
      </div>

      <div className="premium-card border-2 border-dashed border-border-strong p-8 md:p-12 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 bg-bg-inset rounded-full" />
        <div className="h-5 w-48 bg-bg-inset rounded" />
        <div className="h-4 w-32 bg-bg-inset/50 rounded" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="premium-card border-none p-6 space-y-4">
            <div className="h-4 w-32 bg-bg-inset rounded" />
            <div className="space-y-3">
              <div className="h-10 bg-bg-inset/30 rounded-lg" />
              <div className="h-10 bg-bg-inset/30 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
