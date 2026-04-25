"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, CreditCard, AlertCircle, ExternalLink } from "lucide-react";

interface OrgData {
  tier: string;
  name: string;
  stripe_subscription_id: string | null;
}

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    features: [
      "3 electricity bills/month",
      "Basic dashboard",
      "No PDF reports",
      "1 user seat",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    price: 24,
    vatRate: 0.2,
    features: [
      "Unlimited bills (all types)",
      "Full dashboard & charts",
      "PDF SECR reports",
      "12-month history",
      "5 user seats",
    ],
    popular: true,
  },
  {
    id: "business",
    name: "Business",
    price: 99,
    vatRate: 0.2,
    features: [
      "Everything in Starter",
      "Up to 20 user seats",
      "Branded PDF reports",
      "CSV export",
      "Priority support",
    ],
  },
];

export default function BillingPage() {
  const searchParams = useSearchParams();
  const [org, setOrg] = useState<OrgData | null>(null);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const successParam = searchParams.get("success");
  const cancelledParam = searchParams.get("cancelled");

  async function handleUpgrade(plan: string) {
    setError(null);
    setUpgrading(plan);
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    setUpgrading(null);
    if (res.ok && data.url) {
      window.location.href = data.url;
    } else {
      setError(data.error ?? "Failed to start checkout");
    }
  }

  async function handlePortal() {
    setPortalLoading(true);
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const data = await res.json();
    setPortalLoading(false);
    if (res.ok && data.url) {
      window.location.href = data.url;
    } else {
      setError(data.error ?? "Failed to open billing portal");
    }
  }

  const currentTier = org?.tier ?? "free";

  return (
    <div className="relative space-y-10 animate-fade-in pb-24">
      {/* Background Decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gt-green-500/5 rounded-full blur-[140px] -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-orange/5 rounded-full blur-[120px] translate-y-1/4 -translate-x-1/4" />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-bg-surface shadow-premium flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-gt-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-text-primary uppercase">Financial Settlement</h1>
            <p className="text-sm font-bold text-text-muted opacity-60">
               Audit your plan, manage subscription cycles, and secure invoices
            </p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="space-y-4">
        {successParam && (
          <div className="premium-card p-4 border-l-4 border-l-gt-green-500 bg-gt-green-500/5 flex items-center gap-3 animate-scale-in">
            <CheckCircle className="w-5 h-5 text-gt-green-600" />
            <p className="text-xs font-black text-gt-green-800 uppercase tracking-widest">Subscription Activated — Deployment complete</p>
          </div>
        )}
        {cancelledParam && (
          <div className="premium-card p-4 border-l-4 border-l-brand-orange bg-brand-orange/5 flex items-center gap-3 animate-scale-in">
            <AlertCircle className="w-5 h-5 text-brand-orange" />
            <p className="text-xs font-black text-brand-orange-dark uppercase tracking-widest">Transaction Interrupted — No resources were committed</p>
          </div>
        )}
        {error && (
          <div className="premium-card p-4 border-l-4 border-l-red-500 bg-red-500/5 flex items-center gap-3 animate-scale-in">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-xs font-black text-red-700 uppercase tracking-widest">{error}</p>
          </div>
        )}
      </div>

      {/* Current plan banner */}
      {currentTier !== "free" && (
        <div className="premium-card p-8 border-none bg-gradient-to-r from-gt-green-900 to-black text-white relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
             <CheckCircle className="w-40 h-40" />
          </div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-xl flex items-center justify-center shadow-2xl border border-white/20">
                <CreditCard className="w-8 h-8 text-gt-green-400" />
              </div>
              <div>
                <p className="text-lg font-black tracking-tight flex items-center gap-2">
                  <span className="text-gt-green-400">ACTIVE:</span> {currentTier.toUpperCase()} SYSTEM
                </p>
                <p className="text-xs font-bold text-white/50 uppercase tracking-widest mt-1">
                   Self-service portal enabled for billing & invoices
                </p>
              </div>
            </div>
            <button
              disabled={portalLoading}
              onClick={handlePortal}
              className="flex items-center gap-2 px-6 py-4 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gt-green-500 hover:text-white transition-all shadow-xl"
            >
              <ExternalLink className="w-4 h-4" />
              {portalLoading ? "Opening..." : "Manage Financials"}
            </button>
          </div>
        </div>
      )}

      {/* Plans grid */}
      <div className="grid grid-cols-3 gap-8">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentTier;
          const isStarter = plan.id === "starter";
          const vatAmount = plan.price * (plan.vatRate ?? 0);
          const totalPrice = plan.price + vatAmount;

          return (
            <div
              key={plan.id}
              className={`premium-card p-8 border-none flex flex-col relative transition-all duration-500 overflow-hidden ${
                isCurrent ? "shadow-2xl ring-2 ring-gt-green-500" : "hover:shadow-2xl"
              }`}
            >
              {plan.popular && !isCurrent && (
                <div className="absolute top-0 right-0 p-4">
                  <div className="bg-gt-green-600 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                    Highest Adoption
                  </div>
                </div>
              )}
              {isCurrent && (
                <div className="absolute top-0 right-0 p-4">
                  <div className="bg-white text-black text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                    Deployed Now
                  </div>
                </div>
              )}

              <div className="mb-8">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted mb-2">{plan.name}</h3>
                 {plan.price === 0 ? (
                   <div className="flex items-baseline gap-1">
                     <span className="text-4xl font-black text-text-primary tracking-tighter">0.00</span>
                     <span className="text-xs font-black text-text-muted opacity-40 uppercase tracking-widest">GBP</span>
                   </div>
                 ) : (
                   <div>
                     <div className="flex items-baseline gap-1">
                       <span className="text-4xl font-black text-text-primary tracking-tighter">{plan.price}</span>
                       <span className="text-xs font-black text-text-muted opacity-40 uppercase tracking-widest">GBP / MO</span>
                     </div>
                     <p className="text-[9px] font-bold text-text-muted mt-1 uppercase tracking-widest opacity-40">
                       + £{vatAmount.toFixed(2)} VAT = £{totalPrice.toFixed(2)} NET
                     </p>
                   </div>
                 )}
              </div>

              <div className="flex-1 space-y-4 mb-8">
                {plan.features.map((f, i) => (
                  <div key={i} className="flex items-start gap-3 group">
                    <div className="mt-1 w-4 h-4 rounded-full bg-gt-green-500/10 flex items-center justify-center shrink-0 group-hover:bg-gt-green-500/20 transition-colors">
                       <CheckCircle className="w-3 h-3 text-gt-green-600" />
                    </div>
                    <span className="text-[11px] font-bold text-text-muted group-hover:text-text-primary transition-colors leading-relaxed">{f}</span>
                  </div>
                ))}
              </div>

              <button
                disabled={isCurrent || upgrading !== null}
                onClick={() => plan.price > 0 && handleUpgrade(plan.id)}
                className={`w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg ${
                  isCurrent
                    ? "bg-bg-inset text-text-muted cursor-default shadow-none"
                    : plan.price === 0
                    ? "bg-bg-inset/50 text-text-muted/40 cursor-not-allowed shadow-none"
                    : "bg-gt-green-600 hover:bg-gt-green-700 text-white shadow-gt-green-500/20 hover:-translate-y-1"
                }`}
              >
                {isCurrent
                  ? "Active Instance"
                  : upgrading === plan.id
                  ? "Provisioning..."
                  : plan.price === 0
                  ? "Support Required"
                  : "Upgrade Cluster"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Support / Security Section */}
      <div className="grid grid-cols-2 gap-8 mt-4">
        <div className="premium-card p-8 border-none bg-bg-inset/30 flex gap-6">
           <div className="w-14 h-14 rounded-2xl bg-white shadow-premium flex items-center justify-center shrink-0">
              <CreditCard className="w-7 h-7 text-text-muted" />
           </div>
           <div>
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-text-primary mb-2">Secure Financial Operations</h2>
              <p className="text-[10px] font-bold text-text-muted leading-relaxed uppercase tracking-widest opacity-60">
                 All transactions are handled via Stripe's encrypted infrastructure. We do not store primary credit card data on our servers.
              </p>
           </div>
        </div>

        <div className="premium-card p-8 border-none bg-red-500/5 flex gap-6 border-l-4 border-l-red-500">
           <div className="w-14 h-14 rounded-2xl bg-white shadow-premium flex items-center justify-center shrink-0">
              <AlertCircle className="w-7 h-7 text-red-500" />
           </div>
           <div>
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-red-700 mb-2">Account Erasure (GDPR)</h2>
              <p className="text-[10px] font-bold text-red-600/70 leading-relaxed uppercase tracking-widest">
                 Article 17: Right to Erasure. This will immediately terminate all active reporting cycles and anonymise your profile data.
              </p>
              <a href="/api/account/delete" className="inline-block mt-4 text-[9px] font-black text-red-700 uppercase tracking-[0.2em] underline decoration-2">
                 Execute Data Wipe
              </a>
           </div>
        </div>
      </div>
    </div>
  );
}
