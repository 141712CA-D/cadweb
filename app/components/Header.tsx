"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SignupModal from "./SignupModal";

interface HeaderProps {
  onJoinWaitlist?: () => void;
}

export default function Header({ onJoinWaitlist }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signupModalOpen, setSignupModalOpen] = useState(false);

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
            ? "header-glass border-b border-[#262626]"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.svg"
              alt="Parametra"
              style={{ width: 32, height: 32, display: "block", flexShrink: 0, filter: "brightness(0) invert(1)" }}
            />
            <span className="text-[#e8e8e8] font-semibold text-base sm:text-lg tracking-tight whitespace-nowrap">
              Parametra
            </span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Desktop nav links */}
            <Link
              href="/how-it-works"
              className="hidden sm:block font-mono text-xs uppercase tracking-widest px-4 py-2 border border-[#262626] text-[#888] hover:border-[#00ff41] hover:text-[#00ff41] transition-all duration-200"
            >
              How It Works
            </Link>
            <Link
              href="/about"
              className="hidden sm:block font-mono text-xs uppercase tracking-widest px-4 py-2 border border-[#262626] text-[#888] hover:border-[#00ff41] hover:text-[#00ff41] transition-all duration-200"
            >
              About Us
            </Link>

            {/* Waitlist button */}
            <button
              onClick={handleWaitlistClick}
              className="cursor-pointer font-mono text-xs uppercase tracking-widest px-4 sm:px-5 py-2 bg-[#00ff41] text-black hover:bg-[#00cc33] transition-all duration-200 whitespace-nowrap"
            >
              <span className="sm:hidden">Waitlist</span>
              <span className="hidden sm:inline">Join the Waitlist</span>
            </button>

            {/* Mobile hamburger */}
            <div className="relative sm:hidden" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex flex-col justify-center items-center w-9 h-9 border border-[#262626] text-[#888] hover:border-[#00ff41] hover:text-[#00ff41] transition-all duration-200 gap-1.5"
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
                  className="absolute right-0 top-12 w-44 border border-[#262626] overflow-hidden"
                  style={{ background: "rgba(15,15,15,0.98)", backdropFilter: "blur(20px)" }}
                >
                  <Link
                    href="/how-it-works"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 font-mono text-xs uppercase tracking-widest text-[#888] hover:text-[#00ff41] hover:bg-[#161616] transition-colors"
                  >
                    How It Works
                  </Link>
                  <div className="h-px bg-[#262626]" />
                  <Link
                    href="/about"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 font-mono text-xs uppercase tracking-widest text-[#888] hover:text-[#00ff41] hover:bg-[#161616] transition-colors"
                  >
                    About Us
                  </Link>
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
