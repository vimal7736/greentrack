import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Read GreenTrack AI's terms of service. Understand your rights and responsibilities when using our carbon tracking platform.",
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || "https://greentrack.ai"}/terms`,
  },
  openGraph: {
    title: "Terms of Service | GreenTrack AI",
    description: "Your rights and responsibilities when using the GreenTrack AI platform.",
    url: `${process.env.NEXT_PUBLIC_APP_URL || "https://greentrack.ai"}/terms`,
  },
};

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto py-16 px-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-400 mb-8">Last updated: April 2025</p>

      <div className="space-y-5 text-sm text-gray-700">
        <div>
          <h2 className="text-base font-semibold text-gray-900">1. Acceptance</h2>
          <p>By creating an account you agree to these Terms. If you use GreenTrack AI on behalf of an organisation, you confirm you have authority to bind that organisation.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-gray-900">2. Service description</h2>
          <p>GreenTrack AI provides carbon footprint tracking, SECR reporting tools, and emission calculations using DEFRA factors. Calculations are provided for informational purposes. You should obtain professional advice before submitting regulatory reports.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-gray-900">3. Acceptable use</h2>
          <p>You must not use the service to upload false data, attempt to access other organisations' data, reverse-engineer the platform, or violate any applicable law.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-gray-900">4. Subscription &amp; billing</h2>
          <p>Paid plans are billed monthly in advance. Prices are shown exclusive of VAT; 20% UK VAT is added at checkout. Subscriptions renew automatically and can be cancelled via the billing portal. No refunds are given for partial months.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-gray-900">5. Free plan limits</h2>
          <p>The free plan is limited to 3 electricity bills per calendar month and 1 user seat. We may change these limits with 30 days notice.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-gray-900">6. Intellectual property</h2>
          <p>GreenTrack AI and its software remain our property. Your data remains yours. You grant us a licence to process it solely to deliver the service.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-gray-900">7. Limitation of liability</h2>
          <p>We are not liable for indirect, incidental, or consequential losses. Our total liability for any claim is limited to the fees you paid in the 3 months preceding the claim.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-gray-900">8. Termination</h2>
          <p>Either party may terminate at any time. We may suspend accounts that violate these Terms. On termination, your data is retained for 30 days then anonymised per our Privacy Policy.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-gray-900">9. Governing law</h2>
          <p>These Terms are governed by the laws of England and Wales. Disputes shall be resolved in the courts of England and Wales.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-gray-900">10. Contact</h2>
          <p>Questions? Email <strong>hello@greentrack.ai</strong>.</p>
        </div>
      </div>

      <div className="mt-8 text-xs text-gray-400">
        <a href="/" className="text-green-600 hover:underline">← Back to GreenTrack AI</a>
      </div>
    </div>
  );
}
