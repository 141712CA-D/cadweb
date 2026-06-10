"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const prompt =
  "make me a base plate with 6 through holes and 4 m6 holes for mounting. The whole base plate should be 15x35cm";

const typingPrompts = [
  { text: prompt, holdMs: 5000 },
  { text: "design an L-bracket with two M4 bolt holes, 2mm wall thickness, 40mm legs", holdMs: 2200 },
  { text: "create a cylindrical enclosure 60mm diameter, 80mm tall with a snap-fit lid", holdMs: 2200 },
  { text: "build a spur gear — 24 teeth, module 1.5, 8mm bore, 5mm face width", holdMs: 2200 },
];

const stages = [
  {
    eyebrow: "Terminal 01",
    title: "Prompt intake",
    status: "reading design intent",
    summary: "The prompt becomes a structured design brief: size, hole counts, mounting intent, and assumptions.",
    accent: "bg-amber-300",
    border: "border-amber-200/45",
    text: "text-amber-200",
    lines: [
      `$ parametra generate "${prompt}"`,
      "[intent] base plate detected",
      "[dimensions] overall envelope: 150mm x 350mm",
      "[features] 6 through holes + 4 M6 mounting holes",
      "[assumption] rectangular plate, centered hole pattern",
    ],
  },
  {
    eyebrow: "Terminal 02",
    title: "Sketch solver",
    status: "placing sketch geometry",
    summary: "A constrained 350mm by 150mm sketch is created before any solid features are generated.",
    accent: "bg-sky-300",
    border: "border-sky-200/45",
    text: "text-sky-200",
    lines: [
      "[sketch] create rectangle: 350mm x 150mm",
      "[reference] add horizontal and vertical centerlines",
      "[holes] distribute 6 through holes across plate body",
      "[mounting] place 4 M6 holes near the corners",
      "[solver] horizontal, vertical, symmetric, equal",
      "[solver] degrees of freedom: 0",
    ],
  },
  {
    eyebrow: "Terminal 03",
    title: "Feature build",
    status: "writing feature timeline",
    summary: "The sketch turns into editable Onshape operations: extrude, cut, clearance holes, and edge cleanup.",
    accent: "bg-emerald-300",
    border: "border-emerald-200/45",
    text: "text-emerald-200",
    lines: [
      "[feature] extrude base plate profile: 8mm",
      "[cut] through holes: through all",
      "[cut] M6 mounting holes: 6.0mm clearance",
      "[edge] apply 0.5mm chamfer to top perimeter",
      "[validate] feature tree has no failed operations",
    ],
  },
  {
    eyebrow: "Terminal 04",
    title: "Ready in Onshape",
    status: "sync complete",
    summary: "The final feature tree is editable, inspectable, and ready for another prompt-driven iteration.",
    accent: "bg-violet-300",
    border: "border-violet-200/45",
    text: "text-violet-200",
    lines: [
      "[api] commit feature list to Onshape part studio",
      "[sync] sketch, extrude, cuts, chamfer created",
      "[review] editable feature tree preserved",
      "[result] base plate ready for dimension edits",
      "[done] generated model linked to prompt history",
    ],
  },
];

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
    summary: "Design where the job demands. Parametra removes the barrier between your intent and the CAD software that needs it.",
  },
];

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}


function TerminalCardInner({ stage }: { stage: (typeof stages)[0] }) {
  return (
    <>
      <div className="flex min-h-10 items-center justify-between gap-4 border-b border-white/8 px-4 py-2">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 flex-shrink-0 rounded-full bg-red-400/70" />
          <span className="h-2 w-2 flex-shrink-0 rounded-full bg-amber-300/70" />
          <span className="h-2 w-2 flex-shrink-0 rounded-full bg-emerald-300/70" />
        </div>
        <p className="truncate font-mono text-[10px] text-white/34">{stage.status}</p>
      </div>
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/32">{stage.eyebrow}</p>
            <h3 className="mt-1 text-xl font-black text-white">{stage.title}</h3>
          </div>
          <span className={`mt-0.5 h-2.5 w-2.5 flex-shrink-0 rounded-full ${stage.accent} shadow-[0_0_16px_rgba(255,255,255,0.22)]`} />
        </div>
        <div className="space-y-1.5 font-mono text-[11px] leading-[1.65]">
          {stage.lines.map((line, i) => (
            <p
              key={line}
              className={
                i === 0
                  ? "text-white/76"
                  : line.startsWith("[done]") || line.startsWith("[result]")
                    ? "text-emerald-200/85"
                    : "text-white/45"
              }
            >
              {line}
            </p>
          ))}
        </div>
      </div>
    </>
  );
}

/* Mobile: one terminal visible at a time, fades in/out */
function TerminalSwap({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="relative min-h-[340px]">
      {stages.map((stage, index) => {
        const active = index === activeIndex;
        return (
          <article
            key={stage.eyebrow}
            className={`absolute inset-0 rounded-lg border bg-[#090d10] shadow-2xl transition-all duration-700 ${
              active
                ? "translate-y-0 scale-100 border-white/18 opacity-100"
                : index < activeIndex
                  ? "-translate-y-6 scale-[0.98] border-white/8 opacity-0"
                  : "translate-y-6 scale-[0.98] border-white/8 opacity-0"
            }`}
            aria-hidden={!active}
          >
            <TerminalCardInner stage={stage} />
          </article>
        );
      })}
    </div>
  );
}

/* Desktop: terminals accumulate — 0 through activeIndex all visible in a 2×2 grid */
function TerminalAccumulator({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {stages.map((stage, index) => {
        const visible = index <= activeIndex;
        return (
          <article
            key={stage.eyebrow}
            className={`rounded-lg border bg-[#090d10] shadow-2xl transition-all duration-700 ${
              visible
                ? "translate-y-0 scale-100 border-white/18 opacity-100"
                : "translate-y-8 scale-[0.97] border-white/8 opacity-0 pointer-events-none"
            }`}
            aria-hidden={!visible}
          >
            <TerminalCardInner stage={stage} />
          </article>
        );
      })}
    </div>
  );
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
        <div className="h-5 w-px bg-white/12" />
      </div>
      <div className="relative ml-5 border-l border-white/10 pl-4 space-y-2">
        {leaves.map(({ tag, text }, i) => (
          <div
            key={tag}
            className={`relative transition-all duration-500 ${show ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"}`}
            style={{ transitionDelay: `${i * 55}ms` }}
          >
            <div className="absolute -left-4 top-1/2 w-3 h-px bg-white/10" />
            <div className="rounded border border-white/8 bg-[#0a0e12] px-3 py-1.5 font-mono text-[11px]">
              <span className={tagColor}>{tag}</span>
              <span className="ml-1.5 text-white/40">{text}</span>
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
        <div className="w-72 rounded-lg border border-sky-500/35 bg-[#090d10] p-4 shadow-xl">
          <div className="mb-2.5 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.8)]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">Source · Onshape</span>
          </div>
          <div className="space-y-1">
            <p className="font-mono text-[11px] text-white/50">[feature] base plate extruded: 8mm</p>
            <p className="font-mono text-[11px] text-white/50">[cut] 6 through holes + 4 M6 mounts</p>
            <p className={`font-mono text-[11px] transition-all duration-500 ${activeIndex >= 5 ? "text-emerald-300/85" : "text-white/50"}`}>
              [done] parametric tree committed
            </p>
          </div>
        </div>
      </div>

      {/* Trunk + crossbar to platform branches */}
      <div className={`transition-opacity duration-700 ${activeIndex >= 1 ? "opacity-100" : "opacity-0"}`}>
        <div className="flex justify-center"><div className="h-6 w-px bg-white/15" /></div>
        <div className="relative mx-[25%] h-px bg-white/15">
          <div className="absolute -left-px top-0 h-6 w-px bg-white/15" />
          <div className="absolute -right-px top-0 h-6 w-px bg-white/15" />
        </div>
        <div className="h-6" />
      </div>

      {/* Platform branch cards */}
      <div className="grid grid-cols-2 gap-5">
        {/* Fusion 360 branch */}
        <div className={`transition-all duration-700 ${activeIndex >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
          <div className="rounded-lg border border-blue-500/30 bg-[#090d10] p-4 shadow-xl">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.7)]" />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/30">Fusion 360</span>
            </div>
            <p className="mt-2 font-mono text-[11px] text-white/40">[translate] model persisted</p>
          </div>
          <LeafList
            show={activeIndex >= 3}
            tagColor="text-blue-300/75"
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
          <div className="rounded-lg border border-violet-500/30 bg-[#090d10] p-4 shadow-xl">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.7)]" />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/30">SolidWorks</span>
            </div>
            <p className="mt-2 font-mono text-[11px] text-white/40">[translate] model persisted</p>
          </div>
          <LeafList
            show={activeIndex >= 4}
            tagColor="text-violet-300/75"
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

export default function Hero() {
  const demoRef = useRef<HTMLDivElement>(null);
  const treeRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [platformIndex, setPlatformIndex] = useState(0);
  const activeStage = stages[activeIndex];
  const activePlatformStage = platformStages[platformIndex];
  const [demoView, setDemoView] = useState<"raw" | "demo">("raw");
  const [showNudge, setShowNudge] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowNudge(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 60) setShowNudge(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setDemoView((v) => (v === "raw" ? "demo" : "raw"));
    }, 3200);
    return () => clearInterval(id);
  }, []);

  const [typedText, setTypedText] = useState("");
  const [typingPhase, setTypingPhase] = useState<"typing" | "holding" | "erasing">("typing");
  const [promptIdx, setPromptIdx] = useState(0);
  const [charPos, setCharPos] = useState(0);

  useEffect(() => {
    const current = typingPrompts[promptIdx];
    let id: ReturnType<typeof setTimeout>;

    if (typingPhase === "typing") {
      if (charPos < current.text.length) {
        id = setTimeout(() => {
          setTypedText(current.text.slice(0, charPos + 1));
          setCharPos((c) => c + 1);
        }, 36);
      } else {
        id = setTimeout(() => setTypingPhase("holding"), 80);
      }
    } else if (typingPhase === "holding") {
      id = setTimeout(() => setTypingPhase("erasing"), current.holdMs);
    } else {
      if (charPos > 0) {
        id = setTimeout(() => {
          setCharPos((c) => c - 1);
          setTypedText(current.text.slice(0, charPos - 1));
        }, 14);
      } else {
        id = setTimeout(() => {
          setPromptIdx((i) => (i + 1) % typingPrompts.length);
          setTypingPhase("typing");
        }, 180);
      }
    }

    return () => clearTimeout(id);
  }, [typingPhase, charPos, promptIdx]);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      if (!demoRef.current) return;
      const rect = demoRef.current.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      const raw = travel > 0 ? -rect.top / travel : 0;
      setActiveIndex(Math.min(stages.length - 1, Math.floor(clamp(raw) * stages.length)));
    };
    const onScroll = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
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
    <section className="relative bg-[#050505] text-white">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 grid-bg opacity-70" />
        <div className="absolute inset-x-0 top-0 h-[760px] bg-[radial-gradient(ellipse_at_50%_0%,rgba(37,99,235,0.16),rgba(5,5,5,0)_62%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[620px] bg-[radial-gradient(ellipse_at_50%_100%,rgba(37,99,235,0.10),rgba(5,5,5,0)_62%)]" />
      </div>

      {/* ── Initial hero ── */}
      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-7xl items-center gap-12 px-5 pb-20 pt-36 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <h1 className="max-w-4xl text-balance text-5xl font-black leading-[0.96] tracking-normal text-white sm:text-7xl lg:text-8xl">
            You think it, parametra makes it
          </h1>

          <p className="mt-7 max-w-2xl text-lg font-light leading-8 text-white/58 sm:text-xl">
            Built by Engineers · For Everyone · Releasing Soon
          </p>

          <div className="mt-8 rounded-lg border border-white/10 bg-black/55 p-4">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-white/30">Test Prompt</p>
            <p className="relative mt-3 text-base font-bold leading-7 text-white/80">
              {/* invisible spacer — holds height of the longest prompt so the box never reflows */}
              <span className="invisible select-none" aria-hidden="true">{typingPrompts[0].text}</span>
              <span className="absolute inset-0">
                {typedText}<span className="cursor-blink ml-px text-white/60">|</span>
              </span>
            </p>
          </div>

          <div className="mt-9">
            <Link
              href="/signup"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-7 text-sm font-bold text-black transition hover:bg-white/85"
            >
              Join the waitlist
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <p className="text-base leading-7 text-white/55 sm:text-lg sm:leading-8">
            Parametra is the most advanced design engine to bring your ideas to life. Built with Onshape in mind, Parametra allows you to not only build models, but persist designs across CAD software — making your toolset limitless.
          </p>
        <div className="rounded-lg border border-white/10 bg-[#090d10] p-5 shadow-2xl shadow-sky-950/20">
          <div className="relative overflow-hidden rounded-lg">
            {/* Raw image defines container height */}
            <img
              src="/OnshapeRaw.png"
              alt="Onshape sketch"
              className={`block w-full transition-opacity duration-[900ms] ease-in-out ${demoView === "raw" ? "opacity-100" : "opacity-0"}`}
            />
            {/* Demo overlays absolutely */}
            <img
              src="/OnshapeDemo.png"
              alt="Onshape model"
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[900ms] ease-in-out ${demoView === "demo" ? "opacity-100" : "opacity-0"}`}
            />
            {/* Status bar */}
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between border-t border-white/10 bg-black/60 px-3 py-2 backdrop-blur-md">
              <span className={`font-mono text-[11px] transition-all duration-700 ${demoView === "raw" ? "text-sky-300" : "text-emerald-300"}`}>
                {demoView === "raw" ? "sketch · degrees of freedom: 0" : "features built · ready in Onshape"}
              </span>
              <span className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full transition-all duration-700 ${demoView === "raw" ? "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.9)]" : "bg-white/15"}`} />
                <span className={`h-1.5 w-1.5 rounded-full transition-all duration-700 ${demoView === "demo" ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" : "bg-white/15"}`} />
              </span>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* ── Pinned scroll demo ── */}
      <div id="generation-demo" ref={demoRef} className="relative z-10 min-h-[500vh] scroll-mt-28 border-t border-white/8">
        <div className="sticky top-20 flex min-h-[calc(100vh-5rem)] flex-col justify-start px-5 pt-8 pb-10 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">

            {/* Section header */}
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-white/35">Generation in progress</p>
                <h2 className="mt-2 text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">
                  {activeStage.title}
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-white/50 sm:text-base">
                  {activeStage.summary}
                </p>
              </div>

              {/* Stage progress dots */}
              <div className="flex items-center gap-2.5">
                {stages.map((stage, index) => (
                  <span
                    key={stage.eyebrow}
                    className={`h-2 w-2 rounded-full transition-all duration-500 ${
                      index <= activeIndex ? stage.accent : "bg-white/15"
                    }`}
                  />
                ))}
                <span className="ml-1 font-mono text-[11px] text-white/28">
                  {activeIndex + 1}/{stages.length}
                </span>
              </div>
            </div>

            {/* Mobile: single-terminal swap */}
            <div className="sm:hidden">
              <TerminalSwap activeIndex={activeIndex} />
            </div>

            {/* Desktop: accumulating 2×2 grid */}
            <div className="hidden sm:block">
              <TerminalAccumulator activeIndex={activeIndex} />
            </div>

          </div>
        </div>
      </div>

      {/* ── Scroll nudge ── */}
      <div
        className={`fixed bottom-8 left-1/2 z-30 -translate-x-1/2 flex flex-col items-center gap-1.5 transition-all duration-700 ${
          showNudge ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
        }`}
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/35">scroll</span>
        <svg className="h-4 w-4 animate-bounce text-white/30" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* ── Platform tree section ── */}
      <div ref={treeRef} className="relative z-10 min-h-[600vh] border-t border-white/8">
        <div className="sticky top-20 flex min-h-[calc(100vh-5rem)] flex-col justify-start px-5 pt-8 pb-10 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            {/* Section header */}
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-white/35">Cross-platform persistence</p>
                <h2 className="relative mt-2 text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">
                  <span className="invisible select-none" aria-hidden="true">{platformStages[1].title}</span>
                  <span className="absolute inset-0">{activePlatformStage.title}</span>
                </h2>
                <p className="relative mt-2 max-w-xl text-sm leading-6 text-white/50 sm:text-base">
                  <span className="invisible select-none" aria-hidden="true">{platformStages[1].summary}</span>
                  <span className="absolute inset-0">{activePlatformStage.summary}</span>
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                {platformStages.map((_, index) => (
                  <span
                    key={index}
                    className={`h-2 w-2 rounded-full transition-all duration-500 ${index <= platformIndex ? "bg-blue-400" : "bg-white/15"}`}
                  />
                ))}
                <span className="ml-1 font-mono text-[11px] text-white/28">{platformIndex + 1}/{platformStages.length}</span>
              </div>
            </div>
            {/* Invisible fully-expanded tree locks the height so no reflow on mobile */}
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
