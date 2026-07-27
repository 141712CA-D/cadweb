"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SignupModal from "./SignupModal";
import { isPageTransitioning } from "@/lib/pageTransitionState";

interface HeaderProps {
  onJoinWaitlist?: () => void;
}

export default function Header({ onJoinWaitlist }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signupModalOpen, setSignupModalOpen] = useState(false);

  const [hiddenForDemo, setHiddenForDemo] = useState(false);

  useEffect(() => {
    let obs: IntersectionObserver;
    const attach = () => {
      const demo = document.getElementById("live-demo");
      if (!demo) { setTimeout(attach, 100); return; }
      obs = new IntersectionObserver(
        ([e]) => { if (!isPageTransitioning()) setHiddenForDemo(e.isIntersecting); },
        { threshold: 0.1 }
      );
      obs.observe(demo);
    };
    attach();
    return () => obs?.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuOpen]);

  const handleWaitlistClick = (e: React.MouseEvent) => {
    if (onJoinWaitlist) {
      e.preventDefault();
      setMenuOpen(false);
      onJoinWaitlist();
      return;
    }

    e.preventDefault();
    setMenuOpen(false);
    setSignupModalOpen(true);
  };

  return (
    <>
      <header
        className={`fixed top-8 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "header-glass border-b border-[#dbe6f5]"
            : "bg-transparent border-b border-transparent"
        } ${hiddenForDemo ? "-translate-y-[calc(100%+2rem)] opacity-0 pointer-events-none" : "translate-y-0 opacity-100"}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.svg"
              alt="Parametra"
              style={{ width: 32, height: 32, display: "block", flexShrink: 0, filter: "brightness(0)" }}
            />
            <span className="text-[#0f172a] font-semibold text-base sm:text-lg tracking-tight whitespace-nowrap">
              Parametra
            </span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Desktop nav links */}
            {/* /how-it-works is intentionally unlinked — the page still exists
                and is reachable by direct URL, but it's hidden from navigation. */}
            <Link
              href="/pitch"
              className="hidden sm:block rounded-md font-mono text-xs uppercase tracking-widest px-4 py-2 border border-[#dbe6f5] text-[#475569] hover:border-[#3b82f6] hover:text-[#3b82f6] transition-all duration-200"
            >
              The Pitch
            </Link>

            <Link
              href="/contact"
              className="hidden sm:block rounded-md font-mono text-xs uppercase tracking-widest px-4 py-2 border border-[#dbe6f5] text-[#475569] hover:border-[#3b82f6] hover:text-[#3b82f6] transition-all duration-200"
            >
              Contact Us
            </Link>

            <a
              href="https://discord.gg/4CDr6ZyFd"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:block rounded-md font-mono text-xs uppercase tracking-widest px-4 py-2 border border-[#dbe6f5] text-[#475569] hover:border-[#3b82f6] hover:text-[#3b82f6] transition-all duration-200"
            >
              Join Discord
            </a>

            {/* Waitlist button */}
            <button
              onClick={handleWaitlistClick}
              className="cursor-pointer rounded-md font-mono text-xs uppercase tracking-widest px-4 sm:px-5 py-2 bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-all duration-200 whitespace-nowrap"
            >
              <span className="sm:hidden">Waitlist</span>
              <span className="hidden sm:inline">Join the Waitlist</span>
            </button>

            {/* Mobile hamburger */}
            <div className="relative sm:hidden" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex flex-col justify-center items-center w-9 h-9 rounded-md border border-[#dbe6f5] text-[#475569] hover:border-[#3b82f6] hover:text-[#3b82f6] transition-all duration-200 gap-1.5"
                aria-label="Menu"
              >
                <span
                  className="w-4 h-px bg-current transition-all duration-200"
                  style={{ transform: menuOpen ? "translateY(4px) rotate(45deg)" : "none" }}
                />
                <span
                  className="w-4 h-px bg-current transition-all duration-200"
                  style={{ opacity: menuOpen ? 0 : 1 }}
                />
                <span
                  className="w-4 h-px bg-current transition-all duration-200"
                  style={{ transform: menuOpen ? "translateY(-6px) rotate(-45deg)" : "none" }}
                />
              </button>

              {/* Dropdown */}
              {menuOpen && (
                <div
                  className="absolute right-0 top-12 w-44 rounded-md border border-[#dbe6f5] overflow-hidden shadow-lg"
                  style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(20px)" }}
                >
                  <Link
                    href="/pitch"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 font-mono text-xs uppercase tracking-widest text-[#475569] hover:text-[#3b82f6] hover:bg-[#eef2f9] transition-colors"
                  >
                    The Pitch
                  </Link>
                  <Link
                    href="/contact"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 font-mono text-xs uppercase tracking-widest text-[#475569] hover:text-[#3b82f6] hover:bg-[#eef2f9] transition-colors"
                  >
                    Contact Us
                  </Link>
                  <a
                    href="https://discord.gg/4CDr6ZyFd"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 font-mono text-xs uppercase tracking-widest text-[#475569] hover:text-[#3b82f6] hover:bg-[#eef2f9] transition-colors"
                  >
                    Join Discord
                  </a>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {!onJoinWaitlist && (
        <SignupModal isOpen={signupModalOpen} onClose={() => setSignupModalOpen(false)} />
      )}
    </>
  );
}
