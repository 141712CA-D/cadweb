"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menu on route change / outside tap
  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuOpen]);

  return (
    <header
      className={`fixed top-8 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "header-glass border-b border-white/10"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-0">
          <div className="flex-shrink-0" style={{ width: 64, height: 64 }}>
            <Image
              src="/logo.svg"
              alt="Project CADen"
              width={64}
              height={64}
              className="drop-shadow-[0_0_8px_rgba(37,99,235,0.6)]"
              style={{ width: 64, height: "auto" }}
            />
          </div>
          <span className="-ml-2 text-white font-semibold text-base sm:text-lg tracking-tight whitespace-nowrap">
            Project <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-sky-400">CADen</span>
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Desktop nav links */}
          <Link
            href="/overview"
            className="hidden sm:block text-sm font-medium px-4 py-2 rounded-full border border-blue-500/30 text-white/60 hover:border-blue-400/50 hover:text-white transition-all duration-200"
          >
            Overview
          </Link>
          <Link
            href="/about"
            className="hidden sm:block text-sm font-medium px-4 py-2 rounded-full border border-blue-500/30 text-white/60 hover:border-blue-400/50 hover:text-white transition-all duration-200"
          >
            About Us
          </Link>

          {/* Waitlist button */}
          <Link
            href="/signup"
            className="text-xs sm:text-sm font-medium px-4 sm:px-5 py-2 rounded-full bg-gradient-to-r from-blue-600 to-sky-400 text-white hover:opacity-90 transition-opacity duration-200 shadow-lg shadow-blue-600/25 whitespace-nowrap"
          >
            <span className="sm:hidden">Waitlist</span>
            <span className="hidden sm:inline">Join the waitlist</span>
          </Link>

          {/* Mobile hamburger */}
          <div className="relative sm:hidden" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex flex-col justify-center items-center w-9 h-9 rounded-full border border-blue-500/30 text-white/60 hover:border-blue-400/50 hover:text-white transition-all duration-200 gap-1.5"
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
                className="absolute right-0 top-12 w-44 rounded-2xl border border-white/10 overflow-hidden"
                style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(20px)" }}
              >
                <Link
                  href="/overview"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Overview
                </Link>
                <div className="h-px bg-white/5 mx-4" />
                <Link
                  href="/about"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                >
                  About Us
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
