"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import DemoShowcase from "./DemoShowcase";
import GitTree from "./GitTree";
import PlatformGitTree from "./PlatformGitTree";
import { isPageTransitioning } from "@/lib/pageTransitionState";

const platformStages = [
  {
    title: "You build it in Onshape",
    summary: "Design it in Onshape exactly as you do today — sketches, constraints, and features, fully parametric and all yours.",
  },
  {
    title: "The same model in Fusion 360",
    summary: "Parametra carries it into Fusion 360 with the feature tree intact, ready for CAM work, generative design, and simulation — none of which Onshape supports.",
  },
  {
    title: "The same model in SolidWorks",
    summary: "Or open it in SolidWorks for configurations, PDM, and a full simulation suite that goes beyond what Onshape offers.",
  },
  {
    title: "Fusion 360 · Simulation",
    summary: "Static stress, thermal analysis, and event simulation run directly on your model — no re-modeling required.",
  },
  {
    title: "SolidWorks · Simulation",
    summary: "Fatigue analysis, CFD flow simulation, drop test, and motion study run natively on the same exported model.",
  },
  {
    title: "One model. Every tool.",
    summary: "No rebuilding, no re-modeling, no starting over.",
  },
];

// The caption swaps between stages, so both lines are sized to the longest
// wording rather than to a hand-picked stage — a shorter pick silently clips.
const LONGEST_TITLE = platformStages.reduce((a, b) => (b.title.length > a.title.length ? b : a)).title;
const LONGEST_SUMMARY = platformStages.reduce((a, b) => (b.summary.length > a.summary.length ? b : a)).summary;

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

interface HeroProps {
  onJoinWaitlist?: () => void;
}

export default function Hero({ onJoinWaitlist }: HeroProps) {
  const treeRef = useRef<HTMLDivElement>(null);
  const [platformIndex, setPlatformIndex] = useState(0);
  const activePlatformStage = platformStages[platformIndex];
  const [showNudge, setShowNudge] = useState(false);
  const [demoInView, setDemoInView] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Nothing to scroll to (e.g. a very tall viewport where the whole
      // page already fits) — don't hint at scrolling that goes nowhere.
      const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1;
      if (!atBottom) setShowNudge(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 0) setShowNudge(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToDemo = () => {
    setShowNudge(false);
    document.getElementById("live-demo")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Track whether the showcase section is on screen so the scroll nudge can
  // hide once the reader has reached it.
  useEffect(() => {
    const el = document.getElementById("live-demo");
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (!isPageTransitioning()) setDemoInView(entry.isIntersecting); },
      { threshold: 0.01 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Which stage is showing: scroll position inside the pinned section, at every
  // breakpoint. The graph is a fixed-aspect SVG that scales itself into
  // whatever the stage leaves it, so the phone can pin exactly like the desktop
  // does — the reader builds the graph by scrolling instead of watching it play
  // itself, and no lane can end up below the fold with the section pinned over
  // it. (The previous split — pinned-and-scrolled up top, self-playing on a
  // phone — is what made mobile feel like a different, broken component.)
  useEffect(() => {
    let frame = 0;

    const update = () => {
      if (!treeRef.current) return;
      const rect = treeRef.current.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      const raw = travel > 0 ? -rect.top / travel : 0;
      setPlatformIndex(Math.min(platformStages.length - 1, Math.floor(clamp(raw) * platformStages.length)));
    };
    const onScroll = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section className="relative bg-white text-[#0f172a]">
      <div className="absolute inset-0 pointer-events-none grid-bg" />

      {/* ── Initial hero: statement left, git tree right ── */}
      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-7xl items-center gap-10 px-5 pb-20 pt-36 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14 lg:px-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#3b82f6] mb-6">Parametra · v1.0 · Releasing Soon</p>

          <h1 className="max-w-2xl text-balance text-4xl font-black leading-[1.05] tracking-tight text-[#0f172a] sm:text-5xl lg:text-6xl">
            Inter-Software Git<br />for CAD
          </h1>

          <p className="mt-6 max-w-md text-sm leading-6 text-[#475569] sm:text-base sm:leading-7">
            Your model shouldn&apos;t be trapped in the tool that made it. Parametra moves a design between Fusion 360, SolidWorks, and Onshape with its feature tree intact — not a dead STEP export.
          </p>

          <div className="mt-8 flex items-center gap-4">
            {onJoinWaitlist ? (
              <button
                type="button"
                onClick={onJoinWaitlist}
                className="cursor-pointer rounded-md inline-flex min-h-12 items-center justify-center bg-[#3b82f6] px-7 font-mono text-xs uppercase tracking-widest text-white transition hover:bg-[#2563eb]"
              >
                Join the Waitlist
              </button>
            ) : (
              <Link
                href="/signup"
                className="rounded-md inline-flex min-h-12 items-center justify-center bg-[#3b82f6] px-7 font-mono text-xs uppercase tracking-widest text-white transition hover:bg-[#2563eb]"
              >
                Join the Waitlist
              </Link>
            )}
            <button
              type="button"
              onClick={scrollToDemo}
              className="cursor-pointer font-mono text-xs uppercase tracking-widest text-[#64748b] hover:text-[#3b82f6] transition-colors"
            >
              See the app →
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <GitTree className="w-full" />
          <div className="flex flex-col items-center gap-2.5">
            <p className="text-center text-2xl font-black tracking-tight text-[#0f172a] sm:text-3xl">
              Own your <span className="text-[#3b82f6]">workflow.</span>
            </p>
            {/* Dimension callout under the caption — extension ticks, inward
                arrows, mono label — like a measured dimension on a drawing. */}
            <svg viewBox="0 0 340 22" className="w-72 text-[#94a3b8] sm:w-80" aria-hidden="true">
              <path d="M1 3 V19 M339 3 V19" stroke="currentColor" strokeWidth="1.2" />
              <path d="M1 11 H72 M268 11 H339" stroke="currentColor" strokeWidth="1" />
              <path d="M1 11 l9 -3.6 v7.2 Z M339 11 l-9 -3.6 v7.2 Z" fill="currentColor" />
              <text
                x="170"
                y="14.5"
                textAnchor="middle"
                fill="#64748b"
                fontSize="11"
                letterSpacing="0.2em"
                fontFamily="var(--font-geist-mono), monospace"
              >
                FEATURE TREE INTACT
              </text>
            </svg>
          </div>
        </div>
      </div>

      {/* ── Application showcase (the interactive mock-app demo lives in
          DemoSection.tsx, currently unmounted) ── */}
      <DemoShowcase />

      {/* ── Scroll nudge ── */}
      <div
        className={`fixed bottom-8 left-1/2 z-30 -translate-x-1/2 flex flex-col items-center gap-1.5 transition-all duration-700 ${
          showNudge && !demoInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
        }`}
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#64748b]">scroll</span>
        <svg className="h-4 w-4 animate-bounce text-[#64748b]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* ── Platform tree section ── */}
      {/* The scroll runway. Its height minus one viewport is the distance the six
          stages are spread over, so 700svh gives each switch a full screen
          (100svh) of scroll — it was 33svh at 300svh, which read as a flick
          rather than a step. Keep this in step with platformStages: more stages
          need more runway, or the graph starts skipping steps on a fast scroll. */}
      <div ref={treeRef} className="relative z-10 min-h-[700svh] border-t border-[#dbe6f5]">
        {/* Pinned at every breakpoint. The caption is deliberately compact on a
            phone: what it does not spend, the graph gets, and the graph has to
            fit one viewport whole while the section is pinned over it. */}
        <div className="tree-stage sticky top-20 flex min-h-[calc(100svh-5rem)] flex-col justify-start px-5 pb-8 pt-6 sm:px-6 lg:min-h-[calc(100vh-5rem)] lg:px-8 lg:pb-10 lg:pt-8">
          <div className="mx-auto w-full max-w-7xl">
            <div className="tree-stage-header mb-4 flex flex-wrap items-end justify-between gap-3 sm:mb-6 lg:mb-10 lg:gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#3b82f6] sm:text-xs">Works where the job demands</p>
                {/* The invisible copy reserves the tallest wrap so the graph
                    below never jumps as the caption changes; the visible one is
                    keyed on the stage, which replays its fade on every step. */}
                <h2 className="relative mt-1.5 text-2xl font-black leading-tight text-[#0f172a] sm:mt-2 sm:text-4xl lg:text-5xl">
                  <span className="invisible select-none" aria-hidden="true">{LONGEST_TITLE}</span>
                  <span key={platformIndex} className="stage-swap absolute inset-0">{activePlatformStage.title}</span>
                </h2>
                <p className="relative mt-1.5 max-w-xl text-xs leading-5 text-[#475569] sm:mt-2 sm:text-base sm:leading-6">
                  <span className="invisible select-none" aria-hidden="true">{LONGEST_SUMMARY}</span>
                  <span key={platformIndex} className="stage-swap absolute inset-0" style={{ animationDelay: "60ms" }}>
                    {activePlatformStage.summary}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {platformStages.map((_, index) => (
                  <span
                    key={index}
                    className={`h-2 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      index === platformIndex
                        ? "w-7 bg-[#3b82f6]"
                        : index < platformIndex
                          ? "w-2 bg-[#3b82f6]/45"
                          : "w-2 bg-[#dbe6f5]"
                    }`}
                  />
                ))}
                <span className="ml-1.5 font-mono text-[11px] tabular-nums text-[#64748b]">{platformIndex + 1}/{platformStages.length}</span>
              </div>
            </div>
          </div>

          {/* One graph, two orientations. Both are rendered and swapped by CSS
              rather than by a media-query hook, so the first paint is already
              the right one. The horizontal graph is deliberately wider than the
              7xl text column — fourteen columns of commit messages need the
              room, and every unit of width is a legible unit of type. The
              max-height keeps it inside a short laptop window; an SVG
              letterboxes itself instead of needing the scale-to-fit measuring
              this section used to do. */}
          <PlatformGitTree
            axis="h"
            activeIndex={platformIndex}
            className="mx-auto hidden h-auto w-full max-w-[1850px] lg:block lg:max-h-[calc(100vh-21rem)]"
          />
          <PlatformGitTree
            axis="v"
            activeIndex={platformIndex}
            className="mx-auto block h-auto max-h-[calc(100svh-15rem)] w-full max-w-[30rem] lg:hidden"
          />
        </div>
      </div>
    </section>
  );
}
