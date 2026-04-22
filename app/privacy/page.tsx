export const metadata = { title: "Privacy Policy — GreenTrack AI" };

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto py-16 px-6 prose prose-sm prose-gray">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-400 mb-8">Last updated: April 2025</p>

      <section className="space-y-4 text-sm text-gray-700">
        <div>
          <h2 className="text-base font-semibold text-gray-900">1. Who we are</h2>
          <p>GreenTrack AI is a carbon footprint management platform for UK SMEs. References to "we", "us", or "GreenTrack AI" refer to the operator of this service.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-gray-900">2. Data we collect</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Account data:</strong> your name, email address, and company name when you register.</li>
            <li><strong>Utility bill data:</strong> usage figures, costs, and emission calculations you upload.</li>
            <li><strong>PDF files:</strong> utility bills stored securely in Supabase Storage (eu-west-2, London).</li>
            <li><strong>Payment data:</strong> handled entirely by Stripe — we never see your card details.</li>
            <li><strong>Usage analytics:</strong> anonymous page views (only with your consent).</li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-semibold text-gray-900">3. Legal basis (UK GDPR)</h2>
          <p>We process your data under <strong>contract</strong> (to deliver the service you signed up for) and <strong>legitimate interests</strong> (to improve the product). Where we use analytics cookies we rely on your <strong>consent</strong>.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-gray-900">4. Data storage &amp; security</h2>
          <p>All data is stored in the United Kingdom (AWS eu-west-2, London) in compliance with UK GDPR Article 44. Data is encrypted at rest and in transit (TLS 1.2+). Row-level security restricts access so each organisation can only see its own data.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-gray-900">5. Data retention</h2>
          <p>We retain your data for as long as your account is active. When you delete your account, personal identifiers are anonymised within 30 days. Aggregated emissions data may be retained for benchmarking.</p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-gray-900">6. Your rights</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Access</strong> — request a copy of your data.</li>
            <li><strong>Rectification</strong> — correct inaccurate data.</li>
            <li><strong>Erasure</strong> — delete your account from Billing settings.</li>
            <li><strong>Portability</strong> — export your bills as CSV from Bill History.</li>
            <li><strong>Object</strong> — opt out of analytics cookies at any time.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-semibold text-gray-900">7. Third-party services</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Supabase</strong> — database and file storage (London region).</li>
            <li><strong>Stripe</strong> — payment processing (PCI DSS Level 1).</li>
            <li><strong>Mindee</strong> — OCR processing of uploaded PDFs.</li>
            <li><strong>Resend</strong> — transactional email delivery.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-semibold text-gray-900">8. Contact</h2>
          <p>For any privacy questions or to exercise your rights, email <strong>privacy@greentrack.ai</strong>.</p>
        </div>
      </section>

      <div className="mt-8 text-xs text-gray-400">
        <a href="/" className="text-green-600 hover:underline">← Back to GreenTrack AI</a>
      </div>
    </div>
  );
}
