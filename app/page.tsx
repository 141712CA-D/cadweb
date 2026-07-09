"use client";

import { useState, useEffect } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import IntroAnimation from "./components/IntroAnimation";
import DevBanner from "./components/DevBanner";
import SignupModal from "./components/SignupModal";
import DemoSection from "./components/DemoSection";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const [skipIntro, setSkipIntro] = useState(false);
  const [signupModalOpen, setSignupModalOpen] = useState(false);

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
        className="flex flex-col min-h-screen bg-[#0f0f0f]"
        style={{
          opacity: introComplete ? 1 : 0,
          transition: skipIntro ? "none" : "opacity 0.15s ease",
        }}
      >
        <Header onJoinWaitlist={() => setSignupModalOpen(true)} />
        <Hero onJoinWaitlist={() => setSignupModalOpen(true)} />

        <DemoSection />

        <section className="bg-[#0f0f0f] border-t border-[#262626] py-16 px-6">
          <div className="max-w-7xl mx-auto flex flex-col items-center gap-6">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#555]">Partners</p>
            <a
              href="https://www.onshape.com/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Onshape"
            >
              <img
                src="/onshape-logo.png"
                alt="Onshape"
                className="h-20 w-20 sm:h-[120px] sm:w-[120px] object-contain bg-transparent grayscale hover:grayscale-0 transition-all duration-300"
              />
            </a>
          </div>
        </section>
        <footer className="bg-[#0f0f0f] border-t border-[#262626] py-6 px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="font-mono text-xs text-[#555]">© {new Date().getFullYear()} Parametra</p>
            <p className="font-mono text-xs text-[#333] sm:absolute sm:left-1/2 sm:-translate-x-1/2">v1.5.1.1</p>
            <div className="grid grid-cols-3 justify-items-center gap-x-6 gap-y-3 sm:flex sm:items-center sm:gap-6">
              <a href="/how-it-works" className="font-mono text-xs text-[#555] hover:text-[#00ff41] transition-colors">How It Works</a>
              <a href="/about" className="font-mono text-xs text-[#555] hover:text-[#00ff41] transition-colors">About</a>
              <a href="/contact" className="font-mono text-xs text-[#555] hover:text-[#00ff41] transition-colors">Contact Us</a>
              <button
                type="button"
                onClick={() => setSignupModalOpen(true)}
                className="cursor-pointer font-mono text-xs text-[#555] hover:text-[#00ff41] transition-colors"
              >
                Join Waitlist
              </button>
              <a href="/terms" className="font-mono text-xs text-[#555] hover:text-[#00ff41] transition-colors">Terms</a>
              <a href="/privacy-policy" className="font-mono text-xs text-[#555] hover:text-[#00ff41] transition-colors">Privacy</a>
            </div>
          </div>
        </footer>
        <SignupModal isOpen={signupModalOpen} onClose={() => setSignupModalOpen(false)} />
      </main>
    </>
  );
}
