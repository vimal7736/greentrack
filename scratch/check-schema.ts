import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: ".env.local" });

async function checkTables() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log("Checking tables...");
  
  // Querying pg_catalog to see real table names
  const { data, error } = await supabase.rpc('get_tables'); // Hope this exists, if not use raw query
  
  if (error) {
    console.log("RPC get_tables failed, trying raw query via .from().select()");
    const tables = ["organisations", "organizations", "profiles", "bills"];
    for (const t of tables) {
      const { error: tErr } = await supabase.from(t).select('count', { count: 'exact', head: true });
      if (tErr) {
        console.log(`Table '${t}' error:`, tErr.message);
      } else {
        console.log(`Table '${t}' exists!`);
      }
    }
  } else {
    console.log("Tables:", data);
  }
}

checkTables();
