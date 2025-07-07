import type { Metadata } from "next"
import { ShieldCheck, FileText, Lock, Cookie } from "lucide-react"

export const metadata: Metadata = {
  title: "Terms & Policies | DataFlexAgent.com",
  description:
    "Read the full Terms & Conditions, Privacy Policy and Cookie Policy for using DataFlexAgent.com – Ghana’s premier data-reseller platform.",
  robots: "index,follow",
}

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 prose prose-headings:font-semibold prose-a:text-emerald-600 dark:prose-invert">
      {/* hero */}
      <header className="mb-12 text-center">
        <h1 className="flex items-center justify-center gap-2 text-3xl font-bold">
          <FileText className="h-8 w-8 text-emerald-600" />
          {"Terms & Conditions"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Last updated&nbsp;
          {new Intl.DateTimeFormat("en-GB", {
            year: "numeric",
            month: "long",
          }).format(new Date())}
        </p>
      </header>

      {/* GENERAL TERMS  */}
      <section id="general-terms">
        <h2 className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          {"General Terms"}
        </h2>
        <ul>
          <li>No refunds – double-check all phone numbers & amounts before submitting.</li>
          <li>Usual processing time is 1–30 minutes; allow up to 3 hours during network congestion.</li>
          <li>Bundles are valid for 90 days and roll over with the next purchase.</li>
          <li>Platform operates 24 / 7 including weekends.</li>
          <li>
            Prices are market-driven and may change without notice&nbsp;
            <em>(e.g. ₵6 MTN bundle can drop to ₵4 and remain low for a week)</em>.
          </li>
        </ul>
      </section>

      {/* AGENT RULES */}
      <section id="agent-rules">
        <h2 className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {"Agent Rules & Guidelines"}
        </h2>
        <p>
          Registration fee is&nbsp;<strong>₵35</strong>&nbsp;and is valid for three months. Renewal is based on
          performance and platform activity.
        </p>

        <h3 className="mt-4">Allowed promotion channels</h3>
        <ul>
          <li>WhatsApp groups</li>
          <li>Close friends & family</li>
          <li>Trusted associates</li>
        </ul>

        <h3>Strictly forbidden promotion channels</h3>
        <ul className="list-disc pl-6 marker:text-red-600">
          <li>TikTok, Facebook, Instagram, LinkedIn, X (Twitter)</li>
          <li>Any form of public advertising using the DataFlex brand name</li>
        </ul>

        <blockquote className="border-l-4 border-emerald-600 pl-4 italic">
          Violation results in permanent ban and loss of all agent privileges. No refunds.
        </blockquote>
      </section>

      {/* IMPORTANT USAGE RULES */}
      <section id="usage-rules">
        <h2 className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {"Important Usage Rules"}
        </h2>
        <ol className="list-decimal pl-5">
          <li>Join our official WhatsApp update group after registration.</li>
          <li>Do not advertise the platform publicly.</li>
          <li>Never contact MTN, AirtelTigo, Vodafone or Telecel for bundle issues—contact DataFlex support.</li>
          <li>Do not use SIMs with borrowed airtime/data; bundles may auto-expire.</li>
          <li>Sent bundles cannot be cancelled or corrected once processed.</li>
          <li>Only refer people through DataFlexAgent.com referral links.</li>
        </ol>
      </section>

      {/* PRIVACY POLICY */}
      <section id="privacy-policy" className="pt-12">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Lock className="h-6 w-6" />
          {"Privacy Policy"}
        </h1>
        <p>
          Your privacy is important to us. We collect only the data required to operate the service, such as your name,
          phone number, email address and transaction history. We never sell your data to third parties.
        </p>
        <h3>1. Data collection</h3>
        <p>
          We collect personal information when you register as an agent, purchase bundles or interact with our support
          team.
        </p>
        <h3>2. Cookies</h3>
        <p>
          Small cookies are used solely for authentication and analytics. You can disable cookies in your browser but
          the platform may not function correctly.
        </p>
        <h3>3. Data storage & security</h3>
        <p>
          All data is stored on secure servers provided by Supabase and protected with industry-standard encryption.
        </p>
        <h3>4. Data retention</h3>
        <p>
          Transaction data is retained for audit purposes for a minimum of six years in compliance with Ghanaian tax
          regulations.
        </p>
        <h3>5. Contact</h3>
        <p>
          For any privacy enquiries, email&nbsp;
          <a href="mailto:sales.dataflex@gmail.com">sales.dataflex@gmail.com</a>.
        </p>
      </section>

      {/* COOKIE POLICY */}
      <section id="cookie-policy" className="pt-12">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Cookie className="h-6 w-6" />
          {"Cookie Policy"}
        </h1>
        <p>
          DataFlexAgent.com uses essential cookies to keep you logged in and to remember your preferences. Optional
          analytics cookies help us improve the service. By using the site you agree to our use of cookies.
        </p>
      </section>

      {/* CONTACT */}
      <section id="contact" className="pt-12">
        <h2>Contact Information</h2>
        <p>
          Email:&nbsp;
          <a href="mailto:sales.dataflex@gmail.com" className="font-medium">
            sales.dataflex@gmail.com
          </a>
          <br />
          WhatsApp:&nbsp;
          <a href="https://wa.me/233242799990" target="_blank" rel="noreferrer noopener">
            +233 242 799 990
          </a>
        </p>
      </section>
    </main>
  )
}
