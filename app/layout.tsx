import type { Metadata } from "next";
import "./globals.css";
import CookieBanner from "@/components/CookieBanner";
import { Analytics } from "@vercel/analytics/next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://greentrack.ai";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "GreenTrack AI — Carbon Footprint Tracking for UK Businesses",
    template: "%s | GreenTrack AI",
  },
  description:
    "GreenTrack AI helps UK businesses track, report, and reduce their carbon footprint. Automated CO₂ calculations from utility bills, SECR-ready reports, and team collaboration tools.",
  keywords: [
    "carbon footprint tracking",
    "carbon emissions UK",
    "SECR reporting",
    "sustainability software",
    "CO2 calculator business",
    "net zero UK",
    "carbon accounting",
    "greenhouse gas reporting",
  ],
  authors: [{ name: "GreenTrack AI", url: baseUrl }],
  creator: "GreenTrack AI",
  publisher: "GreenTrack AI",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: baseUrl,
    siteName: "GreenTrack AI",
    title: "GreenTrack AI — Carbon Footprint Tracking for UK Businesses",
    description:
      "Automated CO₂ calculations from utility bills, SECR-ready reports, and team collaboration tools for UK businesses.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "GreenTrack AI — Carbon Footprint Tracking",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GreenTrack AI — Carbon Footprint Tracking for UK Businesses",
    description:
      "Automated CO₂ calculations from utility bills, SECR-ready reports, and team tools for UK businesses.",
    images: ["/og-image.png"],
    creator: "@greentrackai",
  },
  alternates: {
    canonical: baseUrl,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`,
      name: "GreenTrack AI",
      url: baseUrl,
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/og-image.png`,
      },
      sameAs: [],
      contactPoint: {
        "@type": "ContactPoint",
        email: "support@greentrack.ai",
        contactType: "customer support",
        areaServed: "GB",
        availableLanguage: "English",
      },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${baseUrl}/#software`,
      name: "GreenTrack AI",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: baseUrl,
      description:
        "Carbon footprint tracking and SECR reporting software for UK businesses. Automated CO₂ calculations from utility bills.",
      offers: [
        {
          "@type": "Offer",
          name: "Free Plan",
          price: "0",
          priceCurrency: "GBP",
        },
        {
          "@type": "Offer",
          name: "Starter Plan",
          price: "24",
          priceCurrency: "GBP",
          billingIncrement: "P1M",
        },
        {
          "@type": "Offer",
          name: "Business Plan",
          price: "99",
          priceCurrency: "GBP",
          billingIncrement: "P1M",
        },
      ],
      publisher: {
        "@id": `${baseUrl}/#organization`,
      },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-gray-50 text-gray-900 antialiased" suppressHydrationWarning>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-green-700 focus:text-white focus:rounded-lg focus:font-medium"
        >
          Skip to main content
        </a>
        {children}
        <CookieBanner />
        <Analytics />
      </body>
    </html>
  );
}
