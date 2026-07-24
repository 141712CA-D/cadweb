"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import DemoSection from "./DemoSection";
import { isPageTransitioning } from "@/lib/pageTransitionState";
import { useTypewriter } from "@/lib/useTypewriter";

const prompt =
  "make me a base plate with 6 through holes and 4 m6 holes for mounting. The whole base plate should be 15x35cm";

const typingPrompts = [
  { text: prompt, holdMs: 5000 },
  { text: "design an L-bracket with two M4 bolt holes, 2mm wall thickness, 40mm legs", holdMs: 2200 },
  { text: "create a cylindrical enclosure 60mm diameter, 80mm tall with a snap-fit lid", holdMs: 2200 },
  { text: "build a spur gear — 24 teeth, module 1.5, 8mm bore, 5mm face width", holdMs: 2200 },
];

const INTER_CAD_STEPS = ["scanned model", "software-neutral json", "transferred feature-rich design"];

// Slide-fade transition classes shared by every crossfading hero element —
// active sits at rest, inactive drifts slightly right and fades out, so
// every switch reads as a consistent rightward slide+fade rather than a hard cut.
function slideFadeClass(active: boolean) {
  return `absolute inset-0 transition-all duration-700 ease-out ${
    active ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-6 opacity-0"
  }`;
}

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
  const demoVideoRef = useRef<HTMLVideoElement>(null);
  const nodeVideoRef = useRef<HTMLVideoElement>(null);
  const [platformIndex, setPlatformIndex] = useState(0);
  const activePlatformStage = platformStages[platformIndex];
  const [showNudge, setShowNudge] = useState(false);
  const [demoInView, setDemoInView] = useState(false);

  // Cycles which "pitch" is showing — the reasoning-agent prompt box + gears
  // video, or the inter-CAD transfer flow + node-graph video — on a timer.
  const [heroState, setHeroState] = useState<0 | 1>(0);

  useEffect(() => {
    const id = setInterval(() => setHeroState((s) => (s === 0 ? 1 : 0)), 6500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Nothing to scroll to (e.g. a very tall viewport where the whole
      // page already fits) — don't hint at scrolling that goes nowhere.
      const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1;
      if (!atBottom) setShowNudge(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  // Force the hero videos to behave like GIFs: always playing, even when the
  // tab is backgrounded or the browser tries to pause them. Muted + playsInline
  // keeps autoplay policy happy; we re-issue play() on any pause/visibility change.
  // Both videos stay mounted and playing at all times (only opacity toggles
  // between them) so switching states is an instant crossfade, never a restart.
  useEffect(() => {
    const videos = [demoVideoRef.current, nodeVideoRef.current].filter((v): v is HTMLVideoElement => v !== null);
    if (!videos.length) return;

    const forcePlay = () => {
      videos.forEach((video) => {
        const p = video.play();
        if (p) p.catch(() => {});
      });
    };

    forcePlay();
    videos.forEach((video) => {
      video.addEventListener("pause", forcePlay);
      video.addEventListener("loadeddata", forcePlay);
    });
    document.addEventListener("visibilitychange", forcePlay);

    return () => {
      videos.forEach((video) => {
        video.removeEventListener("pause", forcePlay);
        video.removeEventListener("loadeddata", forcePlay);
      });
      document.removeEventListener("visibilitychange", forcePlay);
    };
  }, []);


  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 0) setShowNudge(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Track whether the live-demo section is on screen. Uses IntersectionObserver
  // (not scroll events) so it still fires while DemoSection has the body scroll
  // locked — otherwise the nudge could get stranded on top of the locked demo.
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

  const { text: typedText } = useTypewriter(typingPrompts);

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

      {/* ── Initial hero ── */}
      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-7xl items-center gap-12 px-5 pb-20 pt-36 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#3b82f6] mb-6">Parametra · v1.0 · Releasing Soon</p>

          <div className="relative min-h-[76px] max-w-2xl sm:min-h-[101px] lg:min-h-[126px]">
            <h1 className={`${slideFadeClass(heroState === 0)} text-balance text-4xl font-black leading-[1.05] tracking-tight text-[#0f172a] sm:text-5xl lg:text-6xl`}>
              One prompt.<br />Real CAD.
            </h1>
            <h1 className={`${slideFadeClass(heroState === 1)} text-balance text-4xl font-black leading-[1.05] tracking-tight text-[#0f172a] sm:text-5xl lg:text-6xl`}>
              Intra-Software Git<br />for CAD
            </h1>
          </div>

          <p className="mt-6 max-w-md text-sm leading-6 text-[#475569] sm:text-base sm:leading-7">
            Software shouldn&apos;t make engineers wait. Describe the part in plain English — Parametra hands back a model you can actually edit, not a rendering.
          </p>

          <div className="relative mt-8 min-h-[152px] sm:min-h-[158px]">
            <div className={`${slideFadeClass(heroState === 0)} rounded-lg border border-[#dbe6f5] bg-[#eef2f9] p-4`}>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#64748b]">Try a prompt</p>
              <p className="relative mt-3 font-mono text-sm leading-7 text-[#0f172a]">
                <span className="invisible select-none" aria-hidden="true">{typingPrompts[0].text}</span>
                <span className="absolute inset-0">
                  {typedText}<span className="cursor-blink ml-px text-[#3b82f6]">|</span>
                </span>
              </p>
            </div>

            <div className={`${slideFadeClass(heroState === 1)} rounded-lg border border-[#dbe6f5] bg-[#eef2f9] p-4`}>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#64748b]">Inter-CAD transfer</p>
              <div className="mt-3 flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                {INTER_CAD_STEPS.map((step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    <span className="rounded-md border border-[#dbe6f5] bg-[#f8fafc] px-2.5 py-1.5 font-mono text-xs text-[#0f172a]">
                      {step}
                    </span>
                    {i < INTER_CAD_STEPS.length - 1 && <span className="font-mono text-xs text-[#94a3b8]">→</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

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
            <Link
              href="/how-it-works"
              className="font-mono text-xs uppercase tracking-widest text-[#64748b] hover:text-[#3b82f6] transition-colors"
            >
              How it works →
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <p className="text-sm leading-6 text-[#475569]">
            Every model comes back as a native Onshape part studio — sketches, features, and dimensions fully intact. Export to Fusion 360 or SolidWorks when the job calls for it.
          </p>
          <div className="rounded-lg border border-[#dbe6f5] bg-[#eef2f9] p-4 overflow-hidden">
            <div className="relative bg-[#f8fafc]">
              <video
                ref={demoVideoRef}
                src="/demoVideo.mp4"
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                disablePictureInPicture
                controls={false}
                tabIndex={-1}
                className={`block h-auto w-full object-contain transition-opacity duration-700 ${heroState === 0 ? "opacity-100" : "opacity-0"}`}
              />
              <video
                ref={nodeVideoRef}
                src="/node-demo-video.mov"
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                disablePictureInPicture
                controls={false}
                tabIndex={-1}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${heroState === 1 ? "opacity-100" : "opacity-0"}`}
              />
              <div className="flex items-center justify-between border-t border-[#dbe6f5] bg-[#eef2f9] px-3 py-2">
              <button
                onClick={() => { setShowNudge(false); document.getElementById("live-demo")?.scrollIntoView({ behavior: "smooth" }); }}
                className="flex items-center gap-2 group"
              >
                <span className="text-left font-mono text-[11px] sm:text-[9px] text-[#3b82f6] group-hover:underline underline-offset-2 sm:whitespace-nowrap">
                  like what you see? scroll down to see Parametra in action
                </span>
                <span className="text-[#3b82f6] animate-bounce inline-block">↓</span>
              </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Live demo video ── */}
      <div className="relative z-10">
        <DemoSection />
      </div>

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
