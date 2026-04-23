import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: ".env.local" });

async function checkTables() {
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  console.log("Checking tables...");
  const tables = ["organisations", "organizations", "profiles", "bills"];

  console.log("\n--- EXHAUSTIVE VERIFICATION ---");
  for (const t of tables) {
    console.log(`Checking '${t}'...`);
    const { data, error, status, statusText } = await serviceClient.from(t).select('*').limit(0);
    
    if (error) {
      console.log(`  FAILED: [${error.code}] ${error.message}`);
      console.log(`  Status: ${status} ${statusText}`);
    } else {
      console.log(`  SUCCESS: Table exists. Status: ${status} ${statusText}`);
    }
  }

  // Try to list ALL tables in public schema if possible
  console.log("\n--- Listing all tables in 'public' ---");
  const { data: allTables, error: listErr } = await serviceClient.from('information_schema.tables').select('table_name').eq('table_schema', 'public');
  if (listErr) {
    console.log("Could not list tables:", listErr.message);
  } else {
    console.log("Public tables:", allTables.map(t => t.table_name).join(", "));
  }
}







checkTables();

