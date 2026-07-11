"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import DemoSection from "./DemoSection";

const prompt =
  "make me a base plate with 6 through holes and 4 m6 holes for mounting. The whole base plate should be 15x35cm";

const typingPrompts = [
  { text: prompt, holdMs: 5000 },
  { text: "design an L-bracket with two M4 bolt holes, 2mm wall thickness, 40mm legs", holdMs: 2200 },
  { text: "create a cylindrical enclosure 60mm diameter, 80mm tall with a snap-fit lid", holdMs: 2200 },
  { text: "build a spur gear — 24 teeth, module 1.5, 8mm bore, 5mm face width", holdMs: 2200 },
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
        <div className="h-5 w-px bg-[#262626]" />
      </div>
      <div className="relative ml-5 border-l border-[#262626] pl-4 space-y-2">
        {leaves.map(({ tag, text }, i) => (
          <div
            key={tag}
            className={`relative transition-all duration-500 ${show ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"}`}
            style={{ transitionDelay: `${i * 55}ms` }}
          >
            <div className="absolute -left-4 top-1/2 w-3 h-px bg-[#262626]" />
            <div className="border border-[#262626] bg-[#161616] px-3 py-1.5 font-mono text-[11px]">
              <span className={tagColor}>{tag}</span>
              <span className="ml-1.5 text-[#555]">{text}</span>
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
        <div className="w-72 border border-[#00ff41]/40 bg-[#161616] p-4">
          <div className="mb-2.5 flex items-center gap-2">
            <span className="h-2 w-2 bg-[#00ff41]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#555]">Source · Onshape</span>
          </div>
          <div className="space-y-1">
            <p className="font-mono text-[11px] text-[#555]">[feature] base plate extruded: 8mm</p>
            <p className="font-mono text-[11px] text-[#555]">[cut] 6 through holes + 4 M6 mounts</p>
            <p className={`font-mono text-[11px] transition-all duration-500 ${activeIndex >= 5 ? "text-[#00ff41]" : "text-[#555]"}`}>
              [done] parametric tree committed
            </p>
          </div>
        </div>
      </div>

      {/* Trunk + crossbar */}
      <div className={`transition-opacity duration-700 ${activeIndex >= 1 ? "opacity-100" : "opacity-0"}`}>
        <div className="flex justify-center"><div className="h-6 w-px bg-[#262626]" /></div>
        <div className="relative mx-[25%] h-px bg-[#262626]">
          <div className="absolute -left-px top-0 h-6 w-px bg-[#262626]" />
          <div className="absolute -right-px top-0 h-6 w-px bg-[#262626]" />
        </div>
        <div className="h-6" />
      </div>

      {/* Platform branch cards */}
      <div className="grid grid-cols-2 gap-5">
        {/* Fusion 360 branch */}
        <div className={`transition-all duration-700 ${activeIndex >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
          <div className="border border-blue-900 bg-[#161616] p-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 bg-blue-500" />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#555]">Fusion 360</span>
            </div>
            <p className="mt-2 font-mono text-[11px] text-[#555]">[translate] model persisted</p>
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
          <div className="border border-violet-900 bg-[#161616] p-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 bg-violet-500" />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#555]">SolidWorks</span>
            </div>
            <p className="mt-2 font-mono text-[11px] text-[#555]">[translate] model persisted</p>
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
  const [demoView, setDemoView] = useState<"raw" | "demo">("raw");

  useEffect(() => {
    const timer = setTimeout(() => setShowNudge(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setDemoView((v) => (v === "raw" ? "demo" : "raw"));
    }, 3200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 60) setShowNudge(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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
    <section className="relative bg-[#0f0f0f] text-[#e8e8e8]">
      <div className="absolute inset-0 pointer-events-none grid-bg" />

      {/* ── Initial hero ── */}
      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-7xl items-center gap-12 px-5 pb-20 pt-36 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#00ff41] mb-6">Parametra · v1.0 · Releasing Soon</p>
          <h1 className="max-w-2xl text-balance text-4xl font-black leading-[1.05] tracking-tight text-[#e8e8e8] sm:text-5xl lg:text-6xl">
            One prompt. Real CAD.
          </h1>

          <p className="mt-6 max-w-md text-sm leading-6 text-[#888] sm:text-base sm:leading-7">
            Software shouldn&apos;t make engineers wait. Describe the part in plain English — Parametra hands back a model you can actually edit, not a rendering.
          </p>

          <div className="mt-8 border border-[#262626] bg-[#161616] p-4">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#555]">Try a prompt</p>
            <p className="relative mt-3 font-mono text-sm leading-7 text-[#e8e8e8]">
              <span className="invisible select-none" aria-hidden="true">{typingPrompts[0].text}</span>
              <span className="absolute inset-0">
                {typedText}<span className="cursor-blink ml-px text-[#00ff41]">|</span>
              </span>
            </p>
          </div>

          <div className="mt-8 flex items-center gap-4">
            {onJoinWaitlist ? (
              <button
                type="button"
                onClick={onJoinWaitlist}
                className="cursor-pointer inline-flex min-h-12 items-center justify-center bg-[#00ff41] px-7 font-mono text-xs uppercase tracking-widest text-black transition hover:bg-[#00cc33]"
              >
                Join the Waitlist
              </button>
            ) : (
              <Link
                href="/signup"
                className="inline-flex min-h-12 items-center justify-center bg-[#00ff41] px-7 font-mono text-xs uppercase tracking-widest text-black transition hover:bg-[#00cc33]"
              >
                Join the Waitlist
              </Link>
            )}
            <Link
              href="/how-it-works"
              className="font-mono text-xs uppercase tracking-widest text-[#555] hover:text-[#00ff41] transition-colors"
            >
              How it works →
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <p className="text-sm leading-6 text-[#888]">
            Every model comes back as a native Onshape part studio — sketches, features, and dimensions fully intact. Export to Fusion 360 or SolidWorks when the job calls for it.
          </p>
          <div className="border border-[#262626] bg-[#161616] p-4">
            <div className="relative overflow-hidden bg-[#0f0f0f]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/OnshapeRaw.png"
                alt="Onshape sketch geometry"
                className={`block w-full transition-opacity duration-[900ms] ease-in-out ${demoView === "raw" ? "opacity-100" : "opacity-0"}`}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/OnshapeDemo.png"
                alt="Completed Onshape part studio"
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[900ms] ease-in-out ${demoView === "demo" ? "opacity-100" : "opacity-0"}`}
              />
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between border-t border-[#262626] bg-[#161616] px-3 py-2">
                <span className="font-mono text-[11px] text-[#00ff41]">
                  {demoView === "raw" ? "sketch · degrees of freedom: 0" : "features built · ready in Onshape"}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 transition-all duration-700 ${demoView === "raw" ? "bg-[#00ff41]" : "bg-[#333]"}`} />
                  <span className={`h-1.5 w-1.5 transition-all duration-700 ${demoView === "demo" ? "bg-[#00ff41]" : "bg-[#333]"}`} />
                </span>
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
          showNudge ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
        }`}
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#555]">scroll</span>
        <svg className="h-4 w-4 animate-bounce text-[#555]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* ── Platform tree section ── */}
      <div ref={treeRef} className="relative z-10 min-h-[300vh] border-t border-[#262626]">
        <div className="sticky top-20 flex min-h-[calc(100vh-5rem)] flex-col justify-start px-5 pt-8 pb-10 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#00ff41]">Works where the job demands</p>
                <h2 className="relative mt-2 text-3xl font-black leading-tight text-[#e8e8e8] sm:text-4xl lg:text-5xl">
                  <span className="invisible select-none" aria-hidden="true">{platformStages[1].title}</span>
                  <span className="absolute inset-0">{activePlatformStage.title}</span>
                </h2>
                <p className="relative mt-2 max-w-xl text-sm leading-6 text-[#888] sm:text-base">
                  <span className="invisible select-none" aria-hidden="true">{platformStages[1].summary}</span>
                  <span className="absolute inset-0">{activePlatformStage.summary}</span>
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                {platformStages.map((_, index) => (
                  <span
                    key={index}
                    className={`h-2 w-2 transition-all duration-500 ${index <= platformIndex ? "bg-[#00ff41]" : "bg-[#262626]"}`}
                  />
                ))}
                <span className="ml-1 font-mono text-[11px] text-[#555]">{platformIndex + 1}/{platformStages.length}</span>
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
