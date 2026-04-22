"use client";
import { useState, useEffect } from "react";
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
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const successParam = searchParams.get("success");
  const cancelledParam = searchParams.get("cancelled");

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/billing");
      if (res.ok) setOrg(await res.json());
      setLoading(false);
    }
    load();
  }, []);

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your plan and payment details</p>
      </div>

      {/* Success / cancelled banners */}
      {successParam && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 text-sm text-green-700">
          <CheckCircle className="w-5 h-5 shrink-0" />
          Subscription activated — your plan is now live. Thank you!
        </div>
      )}
      {cancelledParam && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3 text-sm text-yellow-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          Checkout was cancelled — no charge was made.
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Current plan banner */}
      {!loading && currentTier !== "free" && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-semibold text-green-800 capitalize">
                Currently on {currentTier} Plan
              </p>
              <p className="text-sm text-green-600">
                Manage invoices, update card, or cancel via the billing portal.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={portalLoading}
            onClick={handlePortal}
            className="flex items-center gap-2 text-sm bg-white border border-green-300 text-green-700 px-4 py-2 rounded-lg font-medium hover:bg-green-50 disabled:opacity-50 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {portalLoading ? "Opening…" : "Manage Billing"}
          </button>
        </div>
      )}

      {/* Plans grid */}
      <div className="grid grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentTier;
          const vatAmount = plan.price * (plan.vatRate ?? 0);
          const totalPrice = plan.price + vatAmount;

          return (
            <div
              key={plan.id}
              className={`bg-white rounded-xl border-2 p-6 relative transition-all ${
                isCurrent
                  ? "border-green-600 shadow-lg shadow-green-100"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {plan.popular && !isCurrent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                  Most Popular
                </span>
              )}
              {isCurrent && (
                <span className="absolute -top-3 right-4 bg-green-800 text-white text-xs px-3 py-1 rounded-full font-medium">
                  Current Plan
                </span>
              )}

              <h3 className="font-bold text-gray-900 text-lg">{plan.name}</h3>
              <div className="mt-2 mb-4">
                {plan.price === 0 ? (
                  <p className="text-2xl font-bold text-gray-900">Free</p>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-gray-900">
                      £{plan.price}
                      <span className="text-sm font-normal text-gray-500">/mo</span>
                    </p>
                    <p className="text-xs text-gray-400">
                      + £{vatAmount.toFixed(2)} VAT = £{totalPrice.toFixed(2)}/mo
                    </p>
                  </>
                )}
              </div>

              <ul className="space-y-2 mb-5">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                disabled={isCurrent || upgrading !== null}
                onClick={() => plan.price > 0 && handleUpgrade(plan.id)}
                className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isCurrent
                    ? "bg-green-100 text-green-700 cursor-default"
                    : plan.price === 0
                    ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                {isCurrent
                  ? "Current Plan"
                  : upgrading === plan.id
                  ? "Redirecting…"
                  : plan.price === 0
                  ? "Contact support to downgrade"
                  : "Upgrade →"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Manage billing via Stripe portal */}
      {!loading && currentTier !== "free" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Payment & Invoices
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            View invoices, download receipts, update your payment method, or cancel your
            subscription through the secure Stripe billing portal.
          </p>
          <button
            type="button"
            disabled={portalLoading}
            onClick={handlePortal}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            {portalLoading ? "Opening portal…" : "Open Billing Portal"}
          </button>
        </div>
      )}

      {/* GDPR deletion */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-red-700">Delete Account & Data</p>
          <p className="text-xs text-red-600 mt-1">
            Permanently anonymises all personal data and cancels your subscription
            (GDPR Article 17 — right to erasure).
          </p>
          <a
            href="/api/account/delete"
            className="mt-2 inline-block text-xs text-red-600 hover:text-red-800 font-medium underline"
          >
            Request Account Deletion →
          </a>
        </div>
      </div>
    </div>
  );
}
