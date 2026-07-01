"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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

  return (
    <header
      className={`fixed top-8 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "header-glass border-b border-slate-200"
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
            style={{ width: 32, height: 32, display: "block", flexShrink: 0, filter: "brightness(0)" }}
          />
          <span className="text-slate-900 font-semibold text-base sm:text-lg tracking-tight whitespace-nowrap">
            Parametra
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">

          {/* Desktop nav links */}
          <Link
            href="/how-it-works"
            className="hidden sm:block text-sm font-medium px-4 py-2 rounded-full border border-slate-300 bg-white/60 text-slate-600 hover:border-blue-500 hover:bg-white hover:text-slate-900 transition-all duration-200"
          >
            How It Works
          </Link>
          <Link
            href="/about"
            className="hidden sm:block text-sm font-medium px-4 py-2 rounded-full border border-slate-300 bg-white/60 text-slate-600 hover:border-blue-500 hover:bg-white hover:text-slate-900 transition-all duration-200"
          >
            About Us
          </Link>

          {/* Waitlist button */}
          <Link
            href="/signup"
            className="text-xs sm:text-sm font-medium px-4 sm:px-5 py-2 rounded-full bg-slate-900 text-[#F5F0E8] hover:bg-slate-700 transition-all duration-200 shadow-sm whitespace-nowrap"
          >
            <span className="sm:hidden">Waitlist</span>
            <span className="hidden sm:inline">Join the Waitlist</span>
          </Link>

          {/* Mobile hamburger */}
          <div className="relative sm:hidden" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex flex-col justify-center items-center w-9 h-9 rounded-full border border-slate-300 bg-white/60 text-slate-600 hover:border-blue-500 hover:bg-white hover:text-slate-900 transition-all duration-200 gap-1.5"
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
                className="absolute right-0 top-12 w-44 rounded-2xl border border-slate-200 overflow-hidden"
                style={{ background: "rgba(245,240,232,0.97)", backdropFilter: "blur(20px)" }}
              >
                <Link
                  href="/how-it-works"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
                >
                  How It Works
                </Link>
                <div className="h-px bg-slate-100 mx-4" />
                <Link
                  href="/about"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
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
