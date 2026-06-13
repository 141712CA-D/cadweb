import Link from "next/link";
import DevBanner from "../components/DevBanner";
import Header from "../components/Header";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#1E293B] flex flex-col">
      <DevBanner />
      <Header />

      <main className="flex-1 max-w-3xl mx-auto px-6 py-32 sm:py-40 w-full">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2 gradient-text">Privacy Policy</h1>
        <p className="text-xs text-[#1E293B]/30 mb-12">Last updated: June 2026</p>

        <div className="space-y-10 text-sm text-[#1E293B]/60 leading-relaxed">

          <section>
            <h2 className="text-base font-semibold text-[#1E293B]/80 mb-3">1. Information We Collect</h2>
            <p>When you join our waitlist or contact us, we collect:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Name and email address</li>
              <li>Role, institution, or organization (where provided)</li>
              <li>Your stated reason for interest in the Service</li>
              <li>Messages you send via the contact form</li>
            </ul>
            <p className="mt-3">
              We also collect standard server-side data such as IP addresses, browser type, and pages visited
              via Vercel&apos;s analytics infrastructure.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#1E293B]/80 mb-3">2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Manage and communicate about waitlist access</li>
              <li>Respond to contact form inquiries</li>
              <li>Improve the Service and understand our user base</li>
              <li>Send product updates and launch announcements (you may opt out at any time)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#1E293B]/80 mb-3">3. Data Storage</h2>
            <p>
              Waitlist data is stored in a Neon Serverless Postgres database and synced to Google Sheets.
              Both are hosted in the United States. We take reasonable technical measures to protect your data,
              but no system is completely secure.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#1E293B]/80 mb-3">4. Third-Party Services</h2>
            <p>We use the following third-party services which may process your data:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong className="text-[#1E293B]/70">Resend</strong> — transactional email delivery</li>
              <li><strong className="text-[#1E293B]/70">Google Sheets / Google Cloud</strong> — waitlist storage and sync</li>
              <li><strong className="text-[#1E293B]/70">Neon</strong> — serverless Postgres database</li>
              <li><strong className="text-[#1E293B]/70">Cloudflare Turnstile</strong> — bot protection on forms</li>
              <li><strong className="text-[#1E293B]/70">Vercel</strong> — hosting and analytics</li>
            </ul>
            <p className="mt-3">
              Each third party has its own privacy policy governing their data handling.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#1E293B]/80 mb-3">5. Data Sharing</h2>
            <p>
              We do not sell or rent your personal data to any third party. We do not share your information
              with advertisers. We may disclose data if required by law or to protect our legal rights.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#1E293B]/80 mb-3">6. Your Rights</h2>
            <p>
              You may request deletion of your personal data at any time by contacting us. We will remove your
              information from our systems within a reasonable time frame. Note that removing your data will
              also remove your place on the waitlist.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#1E293B]/80 mb-3">7. Cookies</h2>
            <p>
              We do not use tracking cookies. Session-level storage (e.g., to remember whether the intro
              animation has played) stays in your browser and is never transmitted to our servers.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#1E293B]/80 mb-3">8. Children&apos;s Privacy</h2>
            <p>
              The Service is not directed to children under 13. We do not knowingly collect personal
              information from anyone under 13. If you believe we have inadvertently collected such data,
              please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#1E293B]/80 mb-3">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will post the new policy on this page
              with an updated date. Your continued use of the Service after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#1E293B]/80 mb-3">10. Contact</h2>
            <p>
              For privacy-related requests or questions, please reach out via the{" "}
              <Link href="/contact" className="text-indigo-500 hover:text-indigo-600 transition-colors">contact page</Link>.
            </p>
          </section>

        </div>
      </main>

      <footer className="bg-[#F5F0E8] border-t border-slate-300 py-6 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-700">© {new Date().getFullYear()} Parametra. All rights reserved.</p>
          <div className="grid grid-cols-3 gap-x-6 gap-y-3 sm:flex sm:items-center sm:gap-6">
            <Link href="/how-it-works" className="text-xs text-slate-800 hover:text-slate-900 transition-colors">How it works</Link>
            <Link href="/about" className="text-xs text-slate-800 hover:text-slate-900 transition-colors">About</Link>
            <Link href="/contact" className="text-xs text-slate-800 hover:text-slate-900 transition-colors">Contact us</Link>
            <Link href="/signup" className="text-xs text-slate-800 hover:text-slate-900 transition-colors">Join waitlist</Link>
            <Link href="/terms" className="text-xs text-slate-800 hover:text-slate-900 transition-colors">Terms</Link>
            <Link href="/privacy-policy" className="text-xs text-slate-800 hover:text-slate-900 transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
