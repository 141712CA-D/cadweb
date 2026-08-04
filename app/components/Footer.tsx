"use client";

import Link from "next/link";
import SocialLinks from "./SocialLinks";

const GITHUB_URL = "https://github.com/141712CA-D";
const INSTAGRAM_URL = "https://www.instagram.com/parametra.ai/";
const DISCORD_URL = "https://discord.gg/4CDr6ZyFd";
const LINKEDIN_URL = "https://www.linkedin.com/company/parametra-ai/";

const linkClass = "font-mono text-xs text-[#64748b] hover:text-[#3b82f6] transition-colors";
const iconLinkClass =
  "flex items-center gap-2 font-mono text-xs text-[#64748b] hover:text-[#3b82f6] transition-colors";

// "how-it-works" is kept here even though the footer no longer links to it —
// the page still exists (hidden from nav, reachable by direct URL) and passes it.
type FooterPage = "home" | "how-it-works" | "pitch" | "contact" | "signup" | "terms" | "privacy";

interface FooterProps {
  currentPage?: FooterPage;
  onJoinWaitlist?: () => void;
}

const DISCLAIMER = (
  <>
    Generative Artificial Intelligence <em>can</em> make mistakes. Although we have made a very
    strong effort to make Parametra as deterministic as possible, we are still operating with a
    Large Language Model. Please review all the models it produces in detail.
  </>
);

export default function Footer({ currentPage = "home", onJoinWaitlist }: FooterProps) {
  const year = new Date().getFullYear();

  const waitlistLink = onJoinWaitlist ? (
    <button type="button" onClick={onJoinWaitlist} className={`cursor-pointer text-left ${linkClass}`}>
      Join Waitlist
    </button>
  ) : (
    <Link href="/signup" className={linkClass}>
      Join Waitlist
    </Link>
  );

  return (
    <footer className="relative z-10 bg-[#f8fafc] border-t border-[#dbe6f5] px-6 py-8 sm:py-10">
      <div className="max-w-7xl mx-auto">
        {/* Mobile layout — unchanged from before, with the disclaimer flowing in beneath */}
        <div className="flex flex-col items-center gap-6 sm:hidden">
          <div className="flex flex-col items-center gap-2">
            <p className="font-mono text-xs text-[#64748b]">© {year} Parametra</p>
            <SocialLinks />
          </div>
          <p className="font-mono text-xs text-[#94a3b8]">v1.5.1.1</p>
          <div className="grid grid-cols-3 justify-items-center gap-x-6 gap-y-3">
            {currentPage !== "pitch" && (
              <Link href="/pitch" className={linkClass}>
                The Pitch
              </Link>
            )}
            {currentPage !== "contact" && (
              <Link href="/contact" className={linkClass}>
                Contact Us
              </Link>
            )}
            <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
              Join Discord
            </a>
            {currentPage !== "signup" && waitlistLink}
            {currentPage !== "terms" && (
              <Link href="/terms" className={linkClass}>
                Terms
              </Link>
            )}
            {currentPage !== "privacy" && (
              <Link href="/privacy-policy" className={linkClass}>
                Privacy
              </Link>
            )}
          </div>
          <p className="max-w-sm text-center font-mono text-[11px] leading-5 text-[#64748b]">
            {DISCLAIMER}
          </p>
        </div>

        {/* Desktop layout — copyright next to the link columns, centered version, and a left-aligned disclaimer on the right */}
        <div className="relative hidden sm:flex sm:items-start sm:justify-between sm:gap-10">
          <div className="flex gap-12 lg:gap-16">
            <p className="font-mono text-xs text-[#64748b] transition-colors hover:text-[#3b82f6]">
              © {year} Parametra
            </p>

            <div className="flex flex-col items-start gap-2">
              <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-[#94a3b8]">
                Other Pages
              </p>
              {currentPage !== "pitch" && (
                <Link href="/pitch" className={linkClass}>
                  The Pitch
                </Link>
              )}
              {currentPage !== "signup" && waitlistLink}
              {currentPage !== "terms" && (
                <Link href="/terms" className={linkClass}>
                  Terms
                </Link>
              )}
              {currentPage !== "privacy" && (
                <Link href="/privacy-policy" className={linkClass}>
                  Privacy
                </Link>
              )}
            </div>

            <div className="flex flex-col items-start gap-2">
              <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-[#94a3b8]">
                Connect With Us
              </p>
              {currentPage !== "contact" && (
                <Link href="/contact" className={linkClass}>
                  Contact Us
                </Link>
              )}
              <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className={iconLinkClass}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                </svg>
                Join Discord
              </a>
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className={iconLinkClass}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
                Follow Instagram
              </a>
              <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" className={iconLinkClass}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                Follow LinkedIn
              </a>
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className={iconLinkClass}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                  <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.9.57.1.78-.25.78-.55 0-.27-.01-1.13-.02-2.04-3.2.7-3.88-1.35-3.88-1.35-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.75 2.7 1.25 3.36.96.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.74.8 1.18 1.83 1.18 3.08 0 4.41-2.7 5.39-5.27 5.67.41.36.78 1.06.78 2.14 0 1.54-.01 2.79-.01 3.17 0 .3.21.66.79.55A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5z" />
                </svg>
                Follow GitHub
              </a>
            </div>
          </div>

          <p className="absolute left-1/2 top-0 -translate-x-1/2 font-mono text-xs text-[#94a3b8]">
            v1.5.1.1
          </p>

          <div className="flex max-w-md flex-1 flex-col items-start gap-2 text-left">
            <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-[#94a3b8]">
              Disclaimer
            </p>
            <p className="font-mono text-[11px] leading-5 text-[#64748b]">{DISCLAIMER}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
