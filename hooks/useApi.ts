import { useState } from "react";

export function useApi() {
  const [error, setError] = useState<string | null>(null);

  async function call<T = any>(url: string, options?: RequestInit): Promise<{ ok: boolean; data: T | null }> {
    setError(null);
    try {
      const res = await fetch(url, { 
        headers: { "Content-Type": "application/json" }, 
        ...options 
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Request failed");
        return { ok: false, data };
      }
      return { ok: true, data };
    } catch (err: any) {
      setError(err.message ?? "An unexpected error occurred");
      return { ok: false, data: null };
    }
  }

  return { call, error, setError };
}
