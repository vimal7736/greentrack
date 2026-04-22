export default function UploadLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Loading upload page" aria-busy="true">
      <div className="space-y-2">
        <div className="h-7 w-36 bg-gray-200 rounded-lg" />
        <div className="h-4 w-64 bg-gray-100 rounded" />
      </div>

      <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 bg-gray-100 rounded-full" />
        <div className="h-5 w-48 bg-gray-200 rounded" />
        <div className="h-4 w-32 bg-gray-100 rounded" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="space-y-3">
            <div className="h-10 bg-gray-50 rounded-lg" />
            <div className="h-10 bg-gray-50 rounded-lg" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="space-y-3">
            <div className="h-10 bg-gray-50 rounded-lg" />
            <div className="h-10 bg-gray-50 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
