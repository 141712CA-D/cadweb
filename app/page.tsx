"use client";

import { useState, useEffect } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import IntroAnimation from "./components/IntroAnimation";
import DevBanner from "./components/DevBanner";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const [skipIntro, setSkipIntro] = useState(false);

  useEffect(() => {
    const initIntro = () => {
      const played = sessionStorage.getItem("introPlayed") === "true";
      setSkipIntro(played);
      setIntroComplete(played);
      setMounted(true);
    };

    initIntro();
  }, []);

  function handleIntroDone() {
    sessionStorage.setItem("introPlayed", "true");
    setIntroComplete(true);
  }

  return (
    <>
      <DevBanner />
      {mounted && !skipIntro && <IntroAnimation onDone={handleIntroDone} />}

      <main
        className="flex flex-col min-h-screen bg-[#F5F0E8]"
        style={{
          opacity: introComplete ? 1 : 0,
          transition: skipIntro ? "none" : "opacity 0.15s ease",
        }}
      >
        <Header />
        <Hero />
        <section className="bg-[#F5F0E8] py-16 px-6">
          <div className="max-w-7xl mx-auto flex flex-col items-center gap-8">
            <h2 className="text-2xl font-semibold text-slate-900">Our Partners</h2>
            <a
              href="https://www.onshape.com/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Onshape"
            >
              <img
                src="/onshape-logo.png"
                alt="Onshape"
                className="h-24 w-24 sm:h-[150px] sm:w-[150px] object-contain bg-transparent grayscale hover:grayscale-0 transition-all duration-300"
              />
            </a>
          </div>
        </section>
        <footer className="bg-[#F5F0E8] border-t border-slate-300 py-6 px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-700">© {new Date().getFullYear()} Parametra. All rights reserved.</p>
            <p className="text-xs text-slate-600 font-mono sm:absolute sm:left-1/2 sm:-translate-x-1/2">v1.5.1.1</p>
            <div className="grid grid-cols-3 justify-items-center gap-x-6 gap-y-3 sm:flex sm:items-center sm:gap-6">
              <a href="/how-it-works" className="text-xs text-slate-800 hover:text-slate-900 transition-colors">How It Works</a>
              <a href="/about" className="text-xs text-slate-800 hover:text-slate-900 transition-colors">About</a>
              <a href="/contact" className="text-xs text-slate-800 hover:text-slate-900 transition-colors">Contact Us</a>
              <a href="/signup" className="text-xs text-slate-800 hover:text-slate-900 transition-colors">Join Waitlist</a>
              <a href="/terms" className="text-xs text-slate-800 hover:text-slate-900 transition-colors">Terms</a>
              <a href="/privacy-policy" className="text-xs text-slate-800 hover:text-slate-900 transition-colors">Privacy</a>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
