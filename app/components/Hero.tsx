"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import DemoShowcase from "./DemoShowcase";
import GitTree from "./GitTree";
import { isPageTransitioning } from "@/lib/pageTransitionState";

const platformStages = [
  {
    title: "Generated in Onshape",
    summary: "Every prompt produces a fully parametric Onshape part studio — sketches, constraints, and features, all editable.",
  },
  {
    title: "Persisted in Fusion 360",
    summary: "The same model opens in Fusion 360, ready for CAM work, generative design, and simulation — none of which Onshape supports.",
  },
  {
    title: "Persisted in SolidWorks",
    summary: "Or open it in SolidWorks for configurations, PDM, and a full simulation suite that goes beyond what Onshape offers.",
  },
  {
    title: "Fusion 360 · Simulation",
    summary: "Static stress, thermal analysis, and event simulation run directly on the generated geometry — no re-modeling required.",
  },
  {
    title: "SolidWorks · Simulation",
    summary: "Fatigue analysis, CFD flow simulation, drop test, and motion study run natively on the same exported model.",
  },
  {
    title: "One prompt. Every tool.",
    summary: "One prompt. Every tool. No rebuilding, no re-modeling, no starting over.",
  },
];

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function LeafList({
  show,
  leaves,
  tagColor,
}: {
  show: boolean;
  leaves: { tag: string; text: string }[];
  tagColor: string;
}) {
  return (
    <div className={`transition-all duration-700 ${show ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
      <div className="flex justify-center">
        <div className="h-5 w-px bg-[#dbe6f5]" />
      </div>
      <div className="relative ml-5 border-l border-[#dbe6f5] pl-4 space-y-2">
        {leaves.map(({ tag, text }, i) => (
          <div
            key={tag}
            className={`relative transition-all duration-500 ${show ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"}`}
            style={{ transitionDelay: `${i * 55}ms` }}
          >
            <div className="absolute -left-4 top-1/2 w-3 h-px bg-[#dbe6f5]" />
            <div className="rounded-md border border-[#dbe6f5] bg-[#eef2f9] px-3 py-1.5 font-mono text-[11px]">
              <span className={tagColor}>{tag}</span>
              <span className="ml-1.5 text-[#64748b]">{text}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlatformTree({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="mx-auto max-w-2xl">
      {/* Root: Onshape */}
      <div className="flex justify-center">
        <div className="w-72 rounded-lg border border-[#3b82f6]/40 bg-[#eef2f9] p-4">
          <div className="mb-2.5 flex items-center gap-2">
            <span className="h-2 w-2 bg-[#3b82f6]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#64748b]">Source · Onshape</span>
          </div>
          <div className="space-y-1">
            <p className="font-mono text-[11px] text-[#64748b]">[feature] base plate extruded: 8mm</p>
            <p className="font-mono text-[11px] text-[#64748b]">[cut] 6 through holes + 4 M6 mounts</p>
            <p className={`font-mono text-[11px] transition-all duration-500 ${activeIndex >= 5 ? "text-[#3b82f6]" : "text-[#64748b]"}`}>
              [done] parametric tree committed
            </p>
          </div>
        </div>
      </div>

      {/* Trunk + crossbar */}
      <div className={`transition-opacity duration-700 ${activeIndex >= 1 ? "opacity-100" : "opacity-0"}`}>
        <div className="flex justify-center"><div className="h-6 w-px bg-[#dbe6f5]" /></div>
        <div className="relative mx-[25%] h-px bg-[#dbe6f5]">
          <div className="absolute -left-px top-0 h-6 w-px bg-[#dbe6f5]" />
          <div className="absolute -right-px top-0 h-6 w-px bg-[#dbe6f5]" />
        </div>
        <div className="h-6" />
      </div>

      {/* Platform branch cards */}
      <div className="grid grid-cols-2 gap-5">
        {/* Fusion 360 branch */}
        <div className={`transition-all duration-700 ${activeIndex >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
          <div className="rounded-lg border border-cyan-300 bg-[#eef2f9] p-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 bg-cyan-500" />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#64748b]">Fusion 360</span>
            </div>
            <p className="mt-2 font-mono text-[11px] text-[#64748b]">[translate] model persisted</p>
          </div>
          <LeafList
            show={activeIndex >= 3}
            tagColor="text-cyan-600"
            leaves={[
              { tag: "[cam]",        text: "CAM toolpath generation"    },
              { tag: "[gen-design]", text: "Generative topology design"  },
              { tag: "[static-fea]", text: "Static stress / FEA"        },
              { tag: "[thermal]",    text: "Thermal simulation"         },
              { tag: "[event-sim]",  text: "Event simulation (dynamic)" },
            ]}
          />
        </div>

        {/* SolidWorks branch */}
        <div className={`transition-all duration-700 ${activeIndex >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
          <div className="rounded-lg border border-violet-300 bg-[#eef2f9] p-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 bg-violet-500" />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#64748b]">SolidWorks</span>
            </div>
            <p className="mt-2 font-mono text-[11px] text-[#64748b]">[translate] model persisted</p>
          </div>
          <LeafList
            show={activeIndex >= 4}
            tagColor="text-violet-500"
            leaves={[
              { tag: "[config]",     text: "Part configurations & variants" },
              { tag: "[static-sim]", text: "Static & fatigue simulation"    },
              { tag: "[flow-sim]",   text: "CFD flow simulation"            },
              { tag: "[drop-test]",  text: "Drop test simulation"           },
              { tag: "[motion]",     text: "Motion study & kinematics"      },
            ]}
          />
        </div>
      </div>
    </div>
  );
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
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, []);

  return (
    <section className="relative bg-[#f8fafc] text-[#0f172a]">
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
          <p className="text-center text-2xl font-black tracking-tight text-[#0f172a] sm:text-3xl">
            Own. Your. <span className="text-[#3b82f6]">Workflow.</span>
          </p>
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
      <div ref={treeRef} className="relative z-10 min-h-[300vh] border-t border-[#dbe6f5]">
        <div className="sticky top-20 flex min-h-[calc(100vh-5rem)] flex-col justify-start px-5 pt-8 pb-10 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#3b82f6]">Works where the job demands</p>
                <h2 className="relative mt-2 text-3xl font-black leading-tight text-[#0f172a] sm:text-4xl lg:text-5xl">
                  <span className="invisible select-none" aria-hidden="true">{platformStages[1].title}</span>
                  <span className="absolute inset-0">{activePlatformStage.title}</span>
                </h2>
                <p className="relative mt-2 max-w-xl text-sm leading-6 text-[#475569] sm:text-base">
                  <span className="invisible select-none" aria-hidden="true">{platformStages[1].summary}</span>
                  <span className="absolute inset-0">{activePlatformStage.summary}</span>
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                {platformStages.map((_, index) => (
                  <span
                    key={index}
                    className={`h-2 w-2 transition-all duration-500 ${index <= platformIndex ? "bg-[#3b82f6]" : "bg-[#dbe6f5]"}`}
                  />
                ))}
                <span className="ml-1 font-mono text-[11px] text-[#64748b]">{platformIndex + 1}/{platformStages.length}</span>
              </div>
            </div>
            <div className="relative">
              <div className="invisible select-none" aria-hidden="true">
                <PlatformTree activeIndex={platformStages.length - 1} />
              </div>
              <div className="absolute inset-0">
                <PlatformTree activeIndex={platformIndex} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
