import Link from "next/link";
import DevBanner from "../components/DevBanner";
import Header from "../components/Header";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#1E293B] flex flex-col">
      <DevBanner />
      <Header />

      <main className="flex-1 max-w-3xl mx-auto px-6 py-32 sm:py-40 w-full">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2 gradient-text">Terms of Service</h1>
        <p className="text-xs text-[#1E293B]/30 mb-12">Last updated: June 30, 2026</p>

        <div className="space-y-10 text-sm text-[#1E293B]/60 leading-relaxed">

          <section>
            <h2 className="text-base font-semibold text-[#1E293B]/80 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Parametra (&quot;the Service&quot;), you agree to be bound by these Terms of Service.
              If you do not agree, do not use the Service. We reserve the right to update these terms at any time;
              continued use after changes constitutes acceptance of the revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#1E293B]/80 mb-3">2. Description of Service</h2>
            <p>
              Parametra provides AI-powered CAD design tools that generate and manipulate 3D models in
              platforms such as Onshape, Fusion 360, and SolidWorks. The Service is currently in pre-launch
              development. Features, availability, and pricing are subject to change without notice.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#1E293B]/80 mb-3">3. Waitlist and Early Access</h2>
            <p>
              Joining the waitlist does not guarantee access to the Service. We may invite users in any order
              we choose. We reserve the right to decline access to any applicant at our sole discretion.
              Waitlist submissions must use a valid email address you own.
            </p>
            <p className="mt-3">
              Waitlist enrollment uses a two-step email verification flow: you submit your information, receive
              a one-time verification code, and must enter that code before your waitlist entry is finalized.
              Verification codes may expire and may be rate-limited after repeated failed attempts.
            </p>
            <p className="mt-3">
              To reduce duplicate submissions and improve consistency, we perform synchronization operations:
              (1) during signup and verification, for real-time dedup checks across our systems; and (2) via a 
              background sync that runs at most once per hour per browser (throttled by a functional cookie called 
              <strong> waitlistSynced</strong>). The background sync ensures our database remains synchronized with our 
              upstream data sources. You agree not to attempt to bypass or interfere with these verification and 
              synchronization controls.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#1E293B]/80 mb-3">4. User Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to reverse-engineer, scrape, or reproduce the Service</li>
              <li>Submit false or misleading information</li>
              <li>Interfere with or disrupt the Service or its servers</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#1E293B]/80 mb-3">5. Intellectual Property</h2>
            <p>
              All content, branding, and software on the Service is the property of Parametra or its licensors
              and is protected by applicable intellectual property laws. You may not copy, modify, or distribute
              any part of the Service without our written permission.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#1E293B]/80 mb-3">6. Disclaimer of Warranties</h2>
            <p>
              The Service is provided &quot;as is&quot; without warranties of any kind, express or implied. We do not
              warrant that the Service will be uninterrupted, error-free, or suitable for any particular purpose.
              Use of AI-generated CAD output is at your own risk and should be independently verified before
              use in any engineering or manufacturing context.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#1E293B]/80 mb-3">7. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, Parametra shall not be liable for any indirect,
              incidental, special, or consequential damages arising out of or related to your use of the Service,
              even if advised of the possibility of such damages.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#1E293B]/80 mb-3">8. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the State of Michigan,
              without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#1E293B]/80 mb-3">9. Contact</h2>
            <p>
              For questions about these Terms, please contact us via the{" "}
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
