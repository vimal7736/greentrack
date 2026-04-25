"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, CreditCard, AlertCircle, ExternalLink } from "lucide-react";

import type { Organisation } from "@/types";
import { PLANS } from "@/lib/billing/plans";
import { formatPriceWithVat } from "@/lib/utils/format";
import { PageBackground } from "@/components/ui/PageBackground";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { HeroBanner } from "@/components/ui/HeroBanner";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useApi } from "@/hooks/useApi";

export default function BillingPage() {
  const searchParams = useSearchParams();
  const [org, setOrg] = useState<Organisation | null>(null);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const { call, error } = useApi();

  useEffect(() => {
    fetch("/api/billing")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data) setOrg(data); })
      .catch(() => {});
  }, []);

  const successParam = searchParams.get("success");
  const cancelledParam = searchParams.get("cancelled");

  async function handleUpgrade(plan: string) {
    setUpgrading(plan);
    const { ok, data } = await call<{ url: string }>("/api/billing/checkout", {
      method: "POST",
      body: JSON.stringify({ plan }),
    });
    setUpgrading(null);
    if (ok && data?.url) {
      window.location.href = data.url;
    }
  }

  async function handlePortal() {
    setPortalLoading(true);
    const { ok, data } = await call<{ url: string }>("/api/billing/portal", { method: "POST" });
    setPortalLoading(false);
    if (ok && data?.url) {
      window.location.href = data.url;
    }
  }

  const currentTier = org?.tier ?? "free";

  return (
    <div className="relative space-y-10 animate-fade-in pb-24">
      <PageBackground />

      <PageHeader
        icon={<CreditCard className="w-6 h-6" />}
        title="Financial Settlement"
        subtitle="Audit your plan, manage subscription cycles, and secure invoices"
      />

      {/* Alerts */}
      <div className="space-y-4">
        {successParam && <AlertBanner variant="success" message="Subscription Activated — Deployment complete" />}
        {cancelledParam && <AlertBanner variant="warning" message="Transaction Interrupted — No resources were committed" />}
        {error && <AlertBanner variant="error" message={error} />}
      </div>

      {/* Current plan banner */}
      {currentTier !== "free" && (
        <HeroBanner
          icon={<CreditCard className="w-8 h-8 text-gt-green-400" />}
          bgIcon={<CheckCircle className="w-40 h-40" />}
          title={<><span className="text-gt-green-400">ACTIVE:</span> {currentTier.toUpperCase()} SYSTEM</>}
          subtitle="Self-service portal enabled for billing & invoices"
          action={
            <Button
              variant="secondary"
              size="lg"
              icon={<ExternalLink className="w-4 h-4" />}
              disabled={portalLoading}
              onClick={handlePortal}
            >
              {portalLoading ? "Opening..." : "Manage Financials"}
            </Button>
          }
        />
      )}

      {/* Plans grid */}
      <div className="grid grid-cols-3 gap-8">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentTier;
          const { vatAmount, totalPrice } = formatPriceWithVat(plan.price, plan.vatRate);

          return (
            <div
              key={plan.id}
              className={`premium-card p-8 border-none flex flex-col relative transition-all duration-500 overflow-hidden ${isCurrent ? "shadow-2xl ring-2 ring-gt-green-500" : "hover:shadow-2xl"
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
                      + £{vatAmount} VAT = £{totalPrice} NET
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

              <Button
                variant={isCurrent || plan.price === 0 ? "ghost" : "primary"}
                fullWidth
                size="lg"
                disabled={isCurrent || upgrading !== null}
                onClick={() => plan.price > 0 && handleUpgrade(plan.id)}
                className={
                  isCurrent
                    ? "bg-bg-inset text-text-muted cursor-default shadow-none"
                    : plan.price === 0
                      ? "bg-bg-inset/50 text-text-muted/40 cursor-not-allowed shadow-none"
                      : ""
                }
              >
                {isCurrent
                  ? "Active Instance"
                  : upgrading === plan.id
                    ? "Provisioning..."
                    : plan.price === 0
                      ? "Support Required"
                      : "Upgrade Cluster"}
              </Button>
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
            <SectionHeader
              title="Secure Financial Operations"
              subtitle="All transactions are handled via Stripe's encrypted infrastructure. We do not store primary credit card data on our servers."
            />
          </div>
        </div>

        <div className="premium-card p-8 border-none bg-red-500/5 flex gap-6 border-l-4 border-l-red-500">
          <div className="w-14 h-14 rounded-2xl bg-white shadow-premium flex items-center justify-center shrink-0">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <div>
            <SectionHeader
              title="Account Erasure (GDPR)"
              subtitle="Article 17: Right to Erasure. This will immediately terminate all active reporting cycles and anonymise your profile data."
            />
            <a href="/api/account/delete" className="inline-block mt-4 text-[9px] font-black text-red-700 uppercase tracking-[0.2em] underline decoration-2">
              Execute Data Wipe
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
