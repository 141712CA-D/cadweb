import Link from "next/link";
import DevBanner from "../components/DevBanner";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] flex flex-col grid-bg">
      <DevBanner />
      <Header />

      <main className="flex-1 max-w-3xl mx-auto px-6 py-32 sm:py-40 w-full">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="font-mono text-xs text-[#64748b] mb-12">Last updated: July 23, 2026</p>

        <div className="space-y-10 text-sm text-[#475569] leading-relaxed">

          <section>
            <h2 className="text-base font-semibold text-[#0f172a] mb-3">1. Information We Collect</h2>
            <p>When you join our waitlist or contact us, we collect:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Name and email address</li>
              <li>Role, institution, or organization (where provided)</li>
              <li>Your stated reason for interest in the Service</li>
              <li>Messages you send via the contact form</li>
              <li>Verification metadata for one-time email codes (for example: code issuance time, expiry, and failed-attempt counters)</li>
            </ul>
            <p className="mt-3">
              We also collect standard server-side data such as IP addresses, browser type, and pages visited
              via Vercel&apos;s analytics infrastructure.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#0f172a] mb-3">2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Manage and communicate about waitlist access</li>
              <li>Respond to contact form inquiries</li>
              <li>Improve the Service and understand our user base</li>
              <li>Send product updates and launch announcements (you may opt out at any time)</li>
              <li>Operate and enforce email verification controls to prevent abuse and unauthorized submissions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#0f172a] mb-3">3. Data Storage</h2>
            <p>
              Waitlist and contact data is stored in a Postgres database hosted on Neon and synced to Google
              Sheets. We also use a managed Redis cache (hosted on Upstash) to speed up duplicate-email checks
              and to enforce rate limits on form submissions and verification attempts. Our infrastructure runs
              on AWS. All of the above are hosted in the United States. We take reasonable technical measures to
              protect your data, but no system is completely secure.
            </p>
            <p className="mt-3">
              As part of waitlist checks, we may synchronize records across systems during request processing and
              temporarily hold SHA-256 email hashes in the Redis cache so the client can perform local duplicate
              checks without exposing plaintext email addresses. These cached hashes expire automatically after a
              short period.
            </p>
            <p className="mt-3">
              Pending verification records (for waitlist signup, contact submissions, and unsubscribe requests) are
              stored server-side only as needed to complete verification and are removed after successful
              verification or expiration.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#0f172a] mb-3">4. Third-Party Services</h2>
            <p>We use the following third-party services which may process your data:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong className="text-[#0f172a]">Resend</strong> — transactional email delivery</li>
              <li><strong className="text-[#0f172a]">Google Sheets / Google Cloud</strong> — waitlist storage and sync</li>
              <li><strong className="text-[#0f172a]">Neon</strong> — Postgres database hosting</li>
              <li><strong className="text-[#0f172a]">Upstash</strong> — managed Redis cache for dedup checks and rate limiting</li>
              <li><strong className="text-[#0f172a]">AWS</strong> — server infrastructure</li>
              <li><strong className="text-[#0f172a]">Cloudflare Turnstile</strong> — bot protection on forms</li>
              <li><strong className="text-[#0f172a]">Vercel</strong> — hosting and analytics</li>
            </ul>
            <p className="mt-3">
              Each third party has its own privacy policy governing their data handling.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#0f172a] mb-3">5. Data Sharing</h2>
            <p>
              We do not sell or rent your personal data to any third party. We do not share your information
              with advertisers. We may disclose data if required by law or to protect our legal rights.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#0f172a] mb-3">6. Your Rights</h2>
            <p>
              You may request deletion of your personal data at any time by contacting us, or unsubscribe from the
              waitlist yourself using the unsubscribe link included in our emails. Unsubscribing follows the same
              two-step email verification flow as signup: you request removal, receive a 6-digit code by email, and
              confirm the code to complete removal. We will remove your information from our systems within a
              reasonable time frame. Note that removing your data will also remove your place on the waitlist.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#0f172a] mb-3">7. Cookies</h2>
            <p>
              We use functional cookies to optimize waitlist synchronization:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong className="text-[#0f172a]">waitlistSynced</strong> — set for 1 hour per browser to throttle background sync operations. This ensures our system resyncs waitlist data with our upstream database at most once per hour per browser, reducing unnecessary network traffic while keeping data fresh. This cookie is functional only and contains no personal data.</li>
            </ul>
            <p className="mt-3">
              Browser storage is also used for functional purposes: sessionStorage (to gate the first-visit demo experience so it only plays once per session).
              This client-side storage is functional only and is not used for advertising.
            </p>
            <p className="mt-3">
              We do not use tracking or advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#0f172a] mb-3">8. Children&apos;s Privacy</h2>
            <p>
              The Service is not directed to children under 13. We do not knowingly collect personal
              information from anyone under 13. If you believe we have inadvertently collected such data,
              please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#0f172a] mb-3">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will post the new policy on this page
              with an updated date. Your continued use of the Service after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#0f172a] mb-3">10. Contact</h2>
            <p>
              For privacy-related requests or questions, please reach out via the{" "}
              <Link href="/contact" className="text-[#3b82f6] hover:text-[#2563eb] transition-colors">contact page</Link>.
            </p>
          </section>

        </div>
      </main>

      <Footer currentPage="privacy" />
    </div>
  );
}
