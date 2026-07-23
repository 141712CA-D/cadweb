"use client";

import { useState } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import DevBanner from "./components/DevBanner";
import SignupModal from "./components/SignupModal";
import Footer from "./components/Footer";

export default function Home() {
  const [signupModalOpen, setSignupModalOpen] = useState(false);

  return (
    <>
      <DevBanner />
      <main className="flex flex-col min-h-screen bg-[#0f0f0f]">
        <Header onJoinWaitlist={() => setSignupModalOpen(true)} />
        <Hero onJoinWaitlist={() => setSignupModalOpen(true)} />

        <section className="bg-[#0f0f0f] border-t border-[#262626] py-24 px-6">
          <div className="max-w-3xl mx-auto flex flex-col items-center text-center gap-6">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#00ff41]">Releasing Soon</p>
            <h2 className="text-3xl font-black leading-tight text-[#e8e8e8] sm:text-4xl lg:text-5xl">
              Stop modeling by hand.
            </h2>
            <p className="max-w-xl text-sm leading-6 text-[#888] sm:text-base">
              Describe the part. Get back real, editable CAD. Join the waitlist and be first in line when Parametra releases.
            </p>
            <button
              type="button"
              onClick={() => setSignupModalOpen(true)}
              className="cursor-pointer inline-flex min-h-12 items-center justify-center bg-[#00ff41] px-8 font-mono text-xs uppercase tracking-widest text-black transition hover:bg-[#00cc33]"
            >
              Join the Waitlist
            </button>
          </div>
        </section>

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

        <Footer currentPage="home" onJoinWaitlist={() => setSignupModalOpen(true)} />
        <SignupModal isOpen={signupModalOpen} onClose={() => setSignupModalOpen(false)} />
      </main>
    </>
  );
}
