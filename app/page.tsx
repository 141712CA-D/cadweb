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
    const played = sessionStorage.getItem("introPlayed") === "true";
    setSkipIntro(played);
    setIntroComplete(played);
    setMounted(true);
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
        className="flex flex-col min-h-screen bg-black"
        style={{
          opacity: introComplete ? 1 : 0,
          transform: introComplete ? "translateY(0)" : "translateY(12px)",
          transition: skipIntro ? "none" : "opacity 0.8s ease, transform 0.8s ease",
        }}
      >
        <Header />
        <Hero />
        <footer className="bg-black border-t border-white/5 py-6 px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/20">© {new Date().getFullYear()} Project CADen. All rights reserved.</p>
            <p className="text-xs text-white/15 font-mono sm:absolute sm:left-1/2 sm:-translate-x-1/2">v1.4.0</p>
            <div className="flex items-center gap-6">
              <a href="/about" className="text-xs text-white/25 hover:text-white/60 transition-colors">About</a>
              <a href="/contact" className="text-xs text-white/25 hover:text-white/60 transition-colors">Contact us</a>
              <a href="/signup" className="text-xs text-white/25 hover:text-white/60 transition-colors">Join waitlist</a>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
