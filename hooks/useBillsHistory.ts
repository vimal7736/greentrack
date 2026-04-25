import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { BillRow } from "@/types";

export function useBillsHistory(yearsBack = 2) {
  const [bills, setBills]     = useState<BillRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data: profile } = await supabase
        .from("profiles").select("org_id").eq("id", user.id).single();
      if (!profile?.org_id) { setLoading(false); return; }
      const since = new Date();
      since.setFullYear(since.getFullYear() - yearsBack);
      const { data } = await supabase
        .from("bills")
        .select("bill_date,bill_type,co2_kg,usage_amount,usage_unit,cost_gbp")
        .eq("org_id", profile.org_id)
        .gte("bill_date", since.toISOString().slice(0, 10))
        .order("bill_date", { ascending: true });
      setBills(data ?? []);
      setLoading(false);
    })();
  }, [yearsBack]);

  return { bills, loading };
}
