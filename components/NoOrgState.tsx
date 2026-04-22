"use client";

import { useState } from "react";
import { TrendingDown, Building2, Loader2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { createOrganisationAction } from "@/app/(app)/dashboard/actions";

export default function NoOrgState() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("name", name);

    const result = await createOrganisationAction(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      // Success - the action revalidated paths, so we just need to refresh to see the dashboard
      router.refresh();
      // Force a hard refresh if the soft refresh doesn't trigger the server component to re-render
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-gray-100 shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <TrendingDown className="w-8 h-8 text-green-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to GreenTrack AI</h1>
        <p className="text-gray-500 text-sm mb-8">
          To start tracking your carbon footprint, you first need to set up your organisation profile.
        </p>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg animate-in fade-in slide-in-from-top-1">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label htmlFor="orgName" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ml-1">
              Organisation Name
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Building2 className="w-4 h-4" />
              </div>
              <input
                id="orgName"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Acme Industries Ltd"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-green-200 flex items-center justify-center gap-2 group"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Setting up...
              </>
            ) : (
              <>
                Create Organisation
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-xs text-gray-400">
          Already invited to an organisation? <br />
          <a href="mailto:support@greentrack.ai" className="text-green-600 hover:underline">Contact Support</a>
        </p>
      </div>
    </div>
  );
}

