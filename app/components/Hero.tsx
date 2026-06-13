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
    accent: "bg-amber-400",
    border: "border-amber-300",
    text: "text-amber-700",
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
    accent: "bg-sky-400",
    border: "border-sky-300",
    text: "text-sky-700",
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
    accent: "bg-emerald-400",
    border: "border-emerald-300",
    text: "text-emerald-700",
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
    accent: "bg-violet-400",
    border: "border-violet-300",
    text: "text-violet-700",
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
      <div className="flex min-h-10 items-center justify-between gap-4 border-b border-slate-100 px-4 py-2">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 flex-shrink-0 rounded-full bg-red-400" />
          <span className="h-2 w-2 flex-shrink-0 rounded-full bg-amber-400" />
          <span className="h-2 w-2 flex-shrink-0 rounded-full bg-emerald-400" />
        </div>
        <p className="truncate font-mono text-[10px] text-slate-500">{stage.status}</p>
      </div>
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">{stage.eyebrow}</p>
            <h3 className="mt-1 text-xl font-black text-slate-900">{stage.title}</h3>
          </div>
          <span className={`mt-0.5 h-2.5 w-2.5 flex-shrink-0 rounded-full ${stage.accent}`} />
        </div>
        <div className="space-y-1.5 font-mono text-[11px] leading-[1.65]">
          {stage.lines.map((line, i) => (
            <p
              key={line}
              className={
                i === 0
                  ? "text-slate-700"
                  : line.startsWith("[done]") || line.startsWith("[result]")
                    ? "text-emerald-600"
                    : "text-slate-500"
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

function TerminalSwap({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="relative min-h-[340px]">
      {stages.map((stage, index) => {
        const active = index === activeIndex;
        return (
          <article
            key={stage.eyebrow}
            className={`absolute inset-0 rounded-lg border bg-white shadow-md transition-all duration-700 ${
              active
                ? `translate-y-0 scale-100 ${stage.border} opacity-100`
                : index < activeIndex
                  ? `-translate-y-6 scale-[0.98] border-slate-100 opacity-0`
                  : `translate-y-6 scale-[0.98] border-slate-100 opacity-0`
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

function TerminalAccumulator({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {stages.map((stage, index) => {
        const visible = index <= activeIndex;
        return (
          <article
            key={stage.eyebrow}
            className={`rounded-lg border bg-white shadow-md transition-all duration-700 ${
              visible
                ? `translate-y-0 scale-100 ${stage.border} opacity-100`
                : `translate-y-8 scale-[0.97] border-slate-100 opacity-0 pointer-events-none`
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
        <div className="h-5 w-px bg-slate-200" />
      </div>
      <div className="relative ml-5 border-l border-slate-200 pl-4 space-y-2">
        {leaves.map(({ tag, text }, i) => (
          <div
            key={tag}
            className={`relative transition-all duration-500 ${show ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"}`}
            style={{ transitionDelay: `${i * 55}ms` }}
          >
            <div className="absolute -left-4 top-1/2 w-3 h-px bg-slate-200" />
            <div className="rounded border border-slate-200 bg-white px-3 py-1.5 font-mono text-[11px] shadow-sm">
              <span className={tagColor}>{tag}</span>
              <span className="ml-1.5 text-slate-500">{text}</span>
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
        <div className="w-72 rounded-lg border border-sky-400 bg-white p-4 shadow-md">
          <div className="mb-2.5 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-sky-400" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Source · Onshape</span>
          </div>
          <div className="space-y-1">
            <p className="font-mono text-[11px] text-slate-500">[feature] base plate extruded: 8mm</p>
            <p className="font-mono text-[11px] text-slate-500">[cut] 6 through holes + 4 M6 mounts</p>
            <p className={`font-mono text-[11px] transition-all duration-500 ${activeIndex >= 5 ? "text-emerald-600" : "text-slate-500"}`}>
              [done] parametric tree committed
            </p>
          </div>
        </div>
      </div>

      {/* Trunk + crossbar */}
      <div className={`transition-opacity duration-700 ${activeIndex >= 1 ? "opacity-100" : "opacity-0"}`}>
        <div className="flex justify-center"><div className="h-6 w-px bg-slate-200" /></div>
        <div className="relative mx-[25%] h-px bg-slate-200">
          <div className="absolute -left-px top-0 h-6 w-px bg-slate-200" />
          <div className="absolute -right-px top-0 h-6 w-px bg-slate-200" />
        </div>
        <div className="h-6" />
      </div>

      {/* Platform branch cards */}
      <div className="grid grid-cols-2 gap-5">
        {/* Fusion 360 branch */}
        <div className={`transition-all duration-700 ${activeIndex >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
          <div className="rounded-lg border border-blue-300 bg-white p-4 shadow-md">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Fusion 360</span>
            </div>
            <p className="mt-2 font-mono text-[11px] text-slate-500">[translate] model persisted</p>
          </div>
          <LeafList
            show={activeIndex >= 3}
            tagColor="text-blue-500"
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
          <div className="rounded-lg border border-violet-300 bg-white p-4 shadow-md">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-violet-400" />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">SolidWorks</span>
            </div>
            <p className="mt-2 font-mono text-[11px] text-slate-500">[translate] model persisted</p>
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
    <section className="relative bg-[#F5F0E8] text-slate-900">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 grid-bg opacity-70" />
        <div className="absolute inset-x-0 top-0 h-[760px] bg-[radial-gradient(ellipse_at_50%_0%,rgba(199,226,255,0.5),rgba(245,240,232,0)_62%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[620px] bg-[radial-gradient(ellipse_at_50%_100%,rgba(199,226,255,0.35),rgba(245,240,232,0)_62%)]" />
      </div>

      {/* ── Initial hero ── */}
      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-7xl items-center gap-12 px-5 pb-20 pt-36 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <h1 className="max-w-4xl text-balance text-5xl font-black leading-[0.96] tracking-normal text-slate-900 sm:text-7xl lg:text-8xl">
            You think it, parametra makes it
          </h1>

          <p className="mt-7 max-w-2xl text-lg font-light leading-8 text-slate-500 sm:text-xl">
            Built by Engineers · For Everyone · Releasing Soon
          </p>

          <div className="mt-8 rounded-lg border border-slate-200 bg-white p-4">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-slate-500">Test Prompt</p>
            <p className="relative mt-3 text-base font-bold leading-7 text-slate-700">
              <span className="invisible select-none" aria-hidden="true">{typingPrompts[0].text}</span>
              <span className="absolute inset-0">
                {typedText}<span className="cursor-blink ml-px text-slate-400">|</span>
              </span>
            </p>
          </div>

          <div className="mt-9">
            <Link
              href="/signup"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-slate-900 px-7 text-sm font-bold text-[#F5F0E8] transition hover:bg-slate-700"
            >
              Join the waitlist
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <p className="text-base leading-7 text-slate-500 sm:text-lg sm:leading-8">
            Parametra is the most advanced design engine to bring your ideas to life. Built with Onshape in mind, Parametra allows you to not only build models, but persist designs across CAD software — making your toolset limitless.
          </p>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="relative overflow-hidden rounded-lg">
              <img
                src="/OnshapeRaw.png"
                alt="Onshape sketch"
                className={`block w-full transition-opacity duration-[900ms] ease-in-out ${demoView === "raw" ? "opacity-100" : "opacity-0"}`}
              />
              <img
                src="/OnshapeDemo.png"
                alt="Onshape model"
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[900ms] ease-in-out ${demoView === "demo" ? "opacity-100" : "opacity-0"}`}
              />
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between border-t border-slate-200 bg-white px-3 py-2 backdrop-blur-md">
                <span className={`font-mono text-[11px] transition-all duration-700 ${demoView === "raw" ? "text-sky-600" : "text-emerald-600"}`}>
                  {demoView === "raw" ? "sketch · degrees of freedom: 0" : "features built · ready in Onshape"}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full transition-all duration-700 ${demoView === "raw" ? "bg-sky-400" : "bg-slate-200"}`} />
                  <span className={`h-1.5 w-1.5 rounded-full transition-all duration-700 ${demoView === "demo" ? "bg-emerald-400" : "bg-slate-200"}`} />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Pinned scroll demo ── */}
      <div id="generation-demo" ref={demoRef} className="relative z-10 min-h-[500vh] scroll-mt-28 border-t border-slate-100">
        <div className="sticky top-20 flex min-h-[calc(100vh-5rem)] flex-col justify-start px-5 pt-8 pb-10 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">

            <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Generation in progress</p>
                <h2 className="mt-2 text-3xl font-black leading-tight text-slate-900 sm:text-4xl lg:text-5xl">
                  {activeStage.title}
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
                  {activeStage.summary}
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                {stages.map((stage, index) => (
                  <span
                    key={stage.eyebrow}
                    className={`h-2 w-2 rounded-full transition-all duration-500 ${
                      index <= activeIndex ? stage.accent : "bg-slate-200"
                    }`}
                  />
                ))}
                <span className="ml-1 font-mono text-[11px] text-slate-400">
                  {activeIndex + 1}/{stages.length}
                </span>
              </div>
            </div>

            <div className="sm:hidden">
              <TerminalSwap activeIndex={activeIndex} />
            </div>

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
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-400">scroll</span>
        <svg className="h-4 w-4 animate-bounce text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* ── Platform tree section ── */}
      <div ref={treeRef} className="relative z-10 min-h-[600vh] border-t border-slate-100">
        <div className="sticky top-20 flex min-h-[calc(100vh-5rem)] flex-col justify-start px-5 pt-8 pb-10 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Cross-platform persistence</p>
                <h2 className="relative mt-2 text-3xl font-black leading-tight text-slate-900 sm:text-4xl lg:text-5xl">
                  <span className="invisible select-none" aria-hidden="true">{platformStages[1].title}</span>
                  <span className="absolute inset-0">{activePlatformStage.title}</span>
                </h2>
                <p className="relative mt-2 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
                  <span className="invisible select-none" aria-hidden="true">{platformStages[1].summary}</span>
                  <span className="absolute inset-0">{activePlatformStage.summary}</span>
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                {platformStages.map((_, index) => (
                  <span
                    key={index}
                    className={`h-2 w-2 rounded-full transition-all duration-500 ${index <= platformIndex ? "bg-blue-500" : "bg-slate-200"}`}
                  />
                ))}
                <span className="ml-1 font-mono text-[11px] text-slate-400">{platformIndex + 1}/{platformStages.length}</span>
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
