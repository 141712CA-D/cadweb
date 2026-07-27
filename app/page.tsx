"use client";

import { useState } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import DevBanner from "./components/DevBanner";
import SignupModal from "./components/SignupModal";
import Footer from "./components/Footer";
import NodeIntro from "./components/NodeIntro";

export default function Home() {
  const [signupModalOpen, setSignupModalOpen] = useState(false);

  return (
    <>
      <NodeIntro />
      <DevBanner />
      <main className="flex flex-col min-h-screen bg-[#f8fafc]">
        <Header onJoinWaitlist={() => setSignupModalOpen(true)} />
        <Hero onJoinWaitlist={() => setSignupModalOpen(true)} />

        <section className="bg-[#f8fafc] border-t border-[#dbe6f5] py-24 px-6">
          <div className="max-w-3xl mx-auto flex flex-col items-center text-center gap-6">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#3b82f6]">Releasing Soon</p>
            <h2 className="text-3xl font-black leading-tight text-[#0f172a] sm:text-4xl lg:text-5xl">
              Stop rebuilding the same model.
            </h2>
            <p className="max-w-xl text-sm leading-6 text-[#475569] sm:text-base">
              Move a design between CAD tools with its feature tree intact. Join the waitlist and be first in line when Parametra releases.
            </p>
            <button
              type="button"
              onClick={() => setSignupModalOpen(true)}
              className="cursor-pointer rounded-md inline-flex min-h-12 items-center justify-center bg-[#3b82f6] px-8 font-mono text-xs uppercase tracking-widest text-white transition hover:bg-[#2563eb]"
            >
              Join the Waitlist
            </button>
          </div>
        </section>

        <section className="bg-[#f8fafc] border-t border-[#dbe6f5] py-16 px-6">
          <div className="max-w-7xl mx-auto flex flex-col items-center gap-6">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#64748b]">Partners</p>
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

        <Footer currentPage="home" onJoinWaitlist={() => setSignupModalOpen(true)} />
        <SignupModal isOpen={signupModalOpen} onClose={() => setSignupModalOpen(false)} />
      </main>
    </>
  );
}
