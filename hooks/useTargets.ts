import { useState, useEffect, useCallback } from "react";
import type { OrgTarget } from "@/types";

interface SaveTargetPayload {
  annual_carbon_cap_kg: number;
  yearly_reduction_rate: number;
  net_zero_target_year?: number | null;
  baseline_year?: number;
  sbti_pathway?: string;
  notes?: string;
}

export function useTargets() {
  const [target, setTarget]   = useState<OrgTarget | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const fetchTarget = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/targets");
      if (res.ok) {
        const json = await res.json();
        setTarget(json.target ?? null);
      }
    } catch {
      // table may not exist yet — treat as no saved target
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTarget(); }, [fetchTarget]);

  const saveTarget = async (payload: SaveTargetPayload): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        setTarget(json.target ?? null);
        return true;
      }
      const json = await res.json();
      setError(json.error ?? "Failed to save");
      return false;
    } catch {
      setError("Network error");
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { target, loading, saving, error, saveTarget, refetch: fetchTarget };
}
