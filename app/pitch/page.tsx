"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import DevBanner from "@/app/components/DevBanner";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import SignupModal from "@/app/components/SignupModal";

// Fires once an element scrolls into view, then disconnects — drives every
// scroll-triggered reveal on this page.
function useReveal<T extends HTMLElement>(threshold = 0.3) {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, visible };
}

function Reveal({
  children,
  className = "",
  animation = "animate-fade-up",
  threshold = 0.3,
}: {
  children: ReactNode;
  className?: string;
  animation?: string;
  threshold?: number;
}) {
  const { ref, visible } = useReveal<HTMLDivElement>(threshold);
  return (
    <div ref={ref} className={`${className} ${visible ? animation : "opacity-0"}`}>
      {children}
    </div>
  );
}

// Marker-style emphasis: a thick rounded bar that grows in under the phrase
// once it scrolls into view. Absolutely positioned, so the draw-in never
// shifts surrounding text on any breakpoint.
function MarkUnderline({
  children,
  color = "red",
}: {
  children: ReactNode;
  color?: "red" | "blue";
}) {
  const { ref, visible } = useReveal<HTMLSpanElement>(0.9);
  return (
    <span ref={ref} className="relative inline-block">
      <span className="relative z-10">{children}</span>
      <span
        aria-hidden
        className={`absolute left-0 bottom-[-0.08em] h-[0.18em] w-full origin-left rounded-full transition-transform duration-700 delay-300 ${
          color === "red" ? "bg-red-400" : "bg-[#3b82f6]"
        } ${visible ? "scale-x-100" : "scale-x-0"}`}
        style={{ transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }}
      />
    </span>
  );
}

function StampWord({
  children,
  size = "lg",
  delay = "",
}: {
  children: ReactNode;
  size?: "lg" | "md";
  delay?: string;
}) {
  const { ref, visible } = useReveal<HTMLDivElement>(0.6);

  const sizeClass =
    size === "lg"
      ? "text-[clamp(1.75rem,9.5vw,2.5rem)] px-6 py-3 sm:text-5xl sm:px-8 sm:py-4 lg:text-6xl"
      : "text-[clamp(1.125rem,6vw,1.5rem)] px-5 py-2.5 sm:text-3xl sm:px-7 sm:py-3";

  return (
    <div ref={ref} className="relative z-10">
      <span
        className={`inline-block max-w-full select-none whitespace-nowrap rounded-md border-2 border-dashed border-white/70 bg-red-600 font-black uppercase tracking-tight text-white shadow-[0_12px_28px_-8px_rgba(220,38,38,0.45)] ${sizeClass} ${
          visible ? `animate-stamp-slam ${delay}` : "opacity-0 -rotate-2"
        }`}
      >
        {children}
      </span>
    </div>
  );
}

export default function PitchPage() {
  const [signupModalOpen, setSignupModalOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#f8fafc]">
      <DevBanner />
      <Header onJoinWaitlist={() => setSignupModalOpen(true)} />

      {/* ── Hero: the mandate ── */}
      <section className="relative flex min-h-screen w-full flex-col items-center justify-center gap-6 overflow-hidden px-6 pt-24 text-center">
        <div className="bg-drift pointer-events-none absolute left-1/2 top-1/2 h-[320px] w-[320px] rounded-full bg-blue-400/10 blur-3xl sm:h-[560px] sm:w-[560px]" />
        <div className="bg-drift-alt pointer-events-none absolute left-1/2 top-1/2 h-[260px] w-[260px] rounded-full bg-red-400/10 blur-3xl sm:h-[420px] sm:w-[420px]" />

        <p className="animate-fade-up relative z-10 font-mono text-xs uppercase tracking-[0.3em] text-[#3b82f6]">
          The Pitch
        </p>

        <h1 className="animate-fade-up delay-100 relative z-10 text-[clamp(1.875rem,8.5vw,2.5rem)] font-black leading-tight text-[#0f172a] sm:text-5xl lg:text-6xl">
          It&apos;s finally time to say
        </h1>

        <StampWord size="lg" delay="delay-300">
          F**K STEP FILES
        </StampWord>

        <p className="animate-fade-up delay-400 relative z-10 max-w-lg font-mono text-base text-[#475569] sm:text-lg">
          Here&apos;s why we built Parametra — and why Big CAD never wanted you to have it.
        </p>

        <div className="animate-fade-in delay-800 absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-[#94a3b8]">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </section>

      {/* ── The problem: Big CAD ── */}
      <section className="relative border-t border-[#dbe6f5] bg-[#f8fafc] px-6 py-20 sm:py-32">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 text-center sm:gap-8">
          <Reveal>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#94a3b8]">The Problem</p>
          </Reveal>

          <Reveal className="delay-100">
            <h2 className="text-[clamp(2rem,9.5vw,2.75rem)] font-black leading-tight text-[#0f172a] sm:text-5xl lg:text-6xl">
              Big CAD is limiting
              <br className="hidden sm:block" /> your engineering.
            </h2>
          </Reveal>

          <Reveal className="delay-200">
            <p className="max-w-xl text-lg leading-8 text-[#475569] sm:text-xl">
              They trap <MarkUnderline color="red">your feature information</MarkUnderline> — the
              constraints and relations you worked hard to create.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Welcome Parametra ── */}
      <section className="relative border-t border-[#dbe6f5] bg-[#eef2f9] px-6 py-20 sm:py-32">
        <div className="mx-auto flex max-w-5xl flex-col gap-10 sm:gap-14">
          <div className="flex flex-col items-center gap-5 text-center">
            <Reveal>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#3b82f6]">Welcome Parametra</p>
            </Reveal>
            <Reveal className="delay-100">
              <h2 className="text-[clamp(2rem,9.5vw,2.75rem)] font-black leading-tight text-[#0f172a] sm:text-5xl lg:text-6xl">
                The <MarkUnderline color="blue">first</MarkUnderline> AI CAD interoperability tool.
              </h2>
            </Reveal>
            <Reveal className="delay-200">
              <p className="rounded-full border border-[#dbe6f5] bg-[#f8fafc] px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-[#3b82f6] sm:text-sm">
                The Git for CAD
              </p>
            </Reveal>
          </div>

          <div className="grid gap-10 sm:grid-cols-2 sm:items-center">
            <Reveal className="flex flex-col gap-4">
              <p className="text-xl font-bold leading-8 text-[#0f172a] sm:text-2xl">
                With Parametra your relations and design intent <span className="text-[#3b82f6]">CAN</span> persist
                across CAD tools.
              </p>
              <p className="font-mono text-sm text-[#64748b]">Design and collaborate without preferences.</p>
            </Reveal>

            <Reveal className="rounded-lg border border-[#dbe6f5] bg-[#f8fafc] p-5" threshold={0.2}>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#3b82f6]">Live Transfer</p>
              <video
                src="/node-demo-video.mov"
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                disablePictureInPicture
                controls={false}
                tabIndex={-1}
                className="mt-4 aspect-video w-full rounded-md border border-[#dbe6f5] bg-[#eef2f9] object-cover"
              />
              <p className="mt-3 font-mono text-xs leading-5 text-[#64748b]">
                The full feature tree, carried into a different CAD tool — not flattened into dead geometry.
              </p>
            </Reveal>
          </div>

          <Reveal className="flex justify-center pt-4" threshold={0.6}>
            <StampWord size="md">F**K CAD ONBOARDING</StampWord>
          </Reveal>
        </div>
      </section>

      {/* ── Closing statement: own your workflow ── */}
      <section className="relative flex min-h-[70vh] w-full flex-col items-center justify-center gap-4 overflow-hidden px-6 py-20 text-center sm:min-h-[80vh] sm:py-24">
        <div className="bg-drift pointer-events-none absolute left-1/2 top-1/2 h-[320px] w-[320px] rounded-full bg-blue-400/10 blur-3xl sm:h-[560px] sm:w-[560px]" />
        <div className="bg-drift-alt pointer-events-none absolute left-1/2 top-1/2 h-[260px] w-[260px] rounded-full bg-violet-400/10 blur-3xl sm:h-[420px] sm:w-[420px]" />

        <Reveal className="relative z-10">
          <p className="rounded-full border border-[#dbe6f5] bg-[#eef2f9] px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-[#3b82f6] sm:text-sm">
            Work in ANY CAD system, unbounded
          </p>
        </Reveal>

        <Reveal className="delay-100 relative z-10">
          <h2 className="text-[clamp(3.25rem,15vw,6rem)] font-black uppercase leading-[1.05] tracking-tight text-[#0f172a]">
            Own your
            <br />
            workflow.
          </h2>
        </Reveal>

        <Reveal animation="animate-fade-in" className="delay-400 relative z-10">
          <p className="mt-4 font-mono text-[11px] text-[#94a3b8]">*Limited to BRep CAD.</p>
        </Reveal>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-[#dbe6f5] bg-[#f8fafc] px-6 py-16 sm:py-24">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#3b82f6]">Releasing Soon</p>
          <h2 className="text-[clamp(2rem,9vw,2.5rem)] font-black leading-tight text-[#0f172a] sm:text-4xl lg:text-5xl">
            Ready to own your workflow?
          </h2>
          <p className="max-w-xl text-sm leading-6 text-[#475569] sm:text-base">
            Join the waitlist and be first in line when Parametra releases.
          </p>
          <button
            type="button"
            onClick={() => setSignupModalOpen(true)}
            className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-md bg-[#3b82f6] px-8 font-mono text-xs uppercase tracking-widest text-white transition hover:bg-[#2563eb]"
          >
            Join the Waitlist
          </button>
        </div>
      </section>

      <Footer currentPage="pitch" onJoinWaitlist={() => setSignupModalOpen(true)} />
      <SignupModal isOpen={signupModalOpen} onClose={() => setSignupModalOpen(false)} />
    </div>
  );
}
