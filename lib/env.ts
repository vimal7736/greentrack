/**
 * Validates that all required server-side environment variables are present.
 * Import this in any server-only module to catch misconfiguration at startup
 * rather than at runtime deep inside a request handler.
 *
 * Usage: import "@/lib/env" at the top of lib/supabase/admin.ts or lib/stripe.ts
 */

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_STARTER_PRICE_ID",
  "STRIPE_BUSINESS_PRICE_ID",
  "MINDEE_API_KEY",
  "RESEND_API_KEY",
  "NEXT_PUBLIC_APP_URL",
] as const;

function validateEnv() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map((k) => `  • ${k}`).join("\n")}\n\nSet these in .env.local (dev) or your deployment environment (prod).`
    );
  }
}

// Only validate on the server — NEXT_PUBLIC_ vars are inlined at build time on the client
if (typeof window === "undefined") {
  validateEnv();
}

export {};
