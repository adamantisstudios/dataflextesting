import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DataFlex Agents – Earn Daily Income, Resell Data Bundles in Ghana",
  description:
    "Join DataFlex Agents to earn daily commissions, resell affordable data bundles, and build passive income. Ghana’s leading platform for mobile data agents.",
  keywords: [
    "DataFlex Ghana", "data reselling", "earn daily", "passive income", "Ghana internet", 
    "MTN bundles", "AirtelTigo", "Telecel Ghana", "mobile data agents", "make money online", 
    "referral commissions", "affordable internet", "Ghana reseller platform"
  ].join(", "),
  authors: [{ name: "DataFlex Ghana" }],
  creator: "DataFlex Ghana",
  publisher: "DataFlex Agents",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_GH",
    url: "https://agents.dataflexghana.com",
    siteName: "DataFlex Agents",
    title: "Join DataFlex Agents – Earn Commissions, Sell Data, and Make Daily Profits",
    description:
      "Earn daily by selling MTN, AirtelTigo, and Telecel bundles. Join DataFlex Agents – Ghana’s trusted data reseller platform.",
    images: [
      {
        url: "https://agents.dataflexghana.com/images/social-previewone.jpg",
        width: 1200,
        height: 630,
        alt: "DataFlex Agents – Start Earning Today",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Join DataFlex Agents – Earn Daily Income by Reselling Data",
    description:
      "Sell affordable data bundles and earn commissions daily. Become a DataFlex Agent in Ghana and start making money easily.",
    images: ["https://agents.dataflexghana.com/images/social-previewone.jpg"],
  },
  alternates: {
    canonical: "https://agents.dataflexghana.com",
  },
  other: {
    "geo.region": "GH",
    "geo.placename": "Ghana",
    "geo.position": "7.9465;-1.0232",
    ICBM: "7.9465, -1.0232",
  },
  generator: "v0.dev",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#10b981" />
        <meta name="msapplication-TileColor" content="#10b981" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />

        {/* SEO Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": "https://agents.dataflexghana.com/#organization",
                  name: "DataFlex Agents",
                  alternateName: "Adamantis Solutions",
                  url: "https://agents.dataflexghana.com",
                  logo: {
                    "@type": "ImageObject",
                    url: "https://agents.dataflexghana.com/images/logo.png",
                  },
                  contactPoint: {
                    "@type": "ContactPoint",
                    telephone: "+233-55-199-9901",
                    contactType: "customer service",
                    areaServed: "GH",
                    availableLanguage: ["English", "Twi"],
                  },
                  address: {
                    "@type": "PostalAddress",
                    addressCountry: "GH",
                    addressRegion: "Ghana",
                  },
                  sameAs: ["https://www.dataflexagents.com"],
                },
                {
                  "@type": "WebSite",
                  "@id": "https://agents.dataflexghana.com/#website",
                  url: "https://agents.dataflexghana.com",
                  name: "DataFlex Agents",
                  description: "Ghana's #1 Platform for Reselling Mobile Data Bundles",
                  publisher: {
                    "@id": "https://agents.dataflexghana.com/#organization",
                  },
                  inLanguage: "en-GH",
                },
                {
                  "@type": "Service",
                  "@id": "https://agents.dataflexghana.com/#service",
                  name: "Mobile Data Reselling",
                  description:
                    "Sell MTN, AirtelTigo, and Telecel data bundles across Ghana with instant commissions and flexible pricing.",
                  provider: {
                    "@id": "https://agents.dataflexghana.com/#organization",
                  },
                  areaServed: {
                    "@type": "Country",
                    name: "Ghana",
                  },
                  hasOfferCatalog: {
                    "@type": "OfferCatalog",
                    name: "Available Data Bundles",
                    itemListElement: [
                      {
                        "@type": "Offer",
                        itemOffered: {
                          "@type": "Service",
                          name: "MTN Data Bundles",
                        },
                      },
                      {
                        "@type": "Offer",
                        itemOffered: {
                          "@type": "Service",
                          name: "AirtelTigo Data Bundles",
                        },
                      },
                      {
                        "@type": "Offer",
                        itemOffered: {
                          "@type": "Service",
                          name: "Telecel Data Bundles",
                        },
                      },
                    ],
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
