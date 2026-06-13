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
        <footer className="bg-[#F5F0E8] border-t border-slate-300 py-6 px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-700">© {new Date().getFullYear()} Parametra. All rights reserved.</p>
            <p className="text-xs text-slate-600 font-mono sm:absolute sm:left-1/2 sm:-translate-x-1/2">v1.5.1.1</p>
            <div className="grid grid-cols-3 gap-x-6 gap-y-3 sm:flex sm:items-center sm:gap-6">
              <a href="/how-it-works" className="text-xs text-slate-800 hover:text-slate-900 transition-colors">How it works</a>
              <a href="/about" className="text-xs text-slate-800 hover:text-slate-900 transition-colors">About</a>
              <a href="/contact" className="text-xs text-slate-800 hover:text-slate-900 transition-colors">Contact us</a>
              <a href="/signup" className="text-xs text-slate-800 hover:text-slate-900 transition-colors">Join waitlist</a>
              <a href="/terms" className="text-xs text-slate-800 hover:text-slate-900 transition-colors">Terms</a>
              <a href="/privacy-policy" className="text-xs text-slate-800 hover:text-slate-900 transition-colors">Privacy</a>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
