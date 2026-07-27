"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { lockScroll, unlockScroll } from "@/lib/scrollLock";
import { useTypewriter, type TypewriterPrompt } from "@/lib/useTypewriter";

const NodeGraph3D = dynamic(() => import("./NodeGraph3D"), { ssr: false });

const SESSION_KEY = "nodeIntroPlayed";

type Stage =
  | "checking"
  | "skipped"
  | "fly-in"
  | "drag-hint"
  | "snap-back"
  | "click-hint"
  | "graph"
  | "carousel"
  | "exiting";

const introTypingPrompts: TypewriterPrompt[] = [
  { text: "map my drivetrain assembly — every feature, constraint, and dependency", holdMs: 2400 },
  { text: "gather the design intent behind the gearbox housing's feature tree", holdMs: 2400 },
  { text: "explain how the motor mount is constrained across the whole model", holdMs: 2400 },
];

function clampOffset(x: number, y: number) {
  const margin = 56;
  const maxX = window.innerWidth / 2 - margin;
  const maxY = window.innerHeight / 2 - margin;
  return {
    x: Math.max(-maxX, Math.min(maxX, x)),
    y: Math.max(-maxY, Math.min(maxY, y)),
  };
}

// Solid flat node fill for the 2D root sphere — no gradient/glossy
// treatment, just a clean solid blue circle with a subtle lift shadow. The
// feature graph itself is rendered in NodeGraph3D once the root recenters.
function nodeStyle(accent = false): React.CSSProperties {
  return {
    background: accent ? "#1d4ed8" : "#3b82f6",
    boxShadow: "0 6px 14px -4px rgba(15,23,42,0.4)",
    border: "1px solid rgba(15,23,42,0.15)",
  };
}

function FlowSteps() {
  const steps = ["scanned model", "software-neutral json", "transferred feature-rich design"];
  return (
    <div className="mt-4 flex flex-col items-start gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center gap-2">
          <span className="rounded-md border border-[#dbe6f5] bg-[#f8fafc] px-2.5 py-1 font-mono text-[10px] text-[#64748b]">
            {step}
          </span>
          {i < steps.length - 1 && <span className="font-mono text-[10px] text-[#94a3b8]">→</span>}
        </div>
      ))}
    </div>
  );
}

const GRAND_DELAYS = ["delay-100", "delay-600", "delay-1000"];

function BigTextSlide({
  show,
  lines,
  showLogo,
  subLine,
  glow = "blue",
}: {
  show: boolean;
  lines: { text: string; italic?: boolean }[];
  showLogo?: boolean;
  subLine?: string;
  glow?: "blue" | "violet";
}) {
  const glowA = glow === "violet" ? "bg-violet-400/15" : "bg-blue-400/10";
  const glowB = glow === "violet" ? "bg-blue-400/10" : "bg-violet-400/10";

  return (
    <div className="relative flex h-screen w-full flex-shrink-0 flex-col items-center justify-center gap-3 overflow-hidden px-6 text-center">
      <div className={`bg-drift pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] rounded-full ${glowA} blur-3xl`} />
      <div className={`bg-drift-alt pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] rounded-full ${glowB} blur-3xl`} />
      {show && showLogo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/logo.svg"
          alt="Parametra"
          className="animate-grand-reveal-logo delay-100 relative z-10 mb-1 h-14 w-14 sm:h-20 sm:w-20"
        />
      )}
      {show &&
        lines.map((line, i) => (
          <h2
            key={line.text}
            className={`animate-grand-reveal ${GRAND_DELAYS[i] ?? "delay-100"} relative z-10 text-5xl font-black leading-[1.05] tracking-tight text-[#0f172a] sm:text-7xl lg:text-8xl ${
              line.italic ? "italic" : ""
            }`}
          >
            {line.text}
          </h2>
        ))}
      {show && subLine && (
        <p className="animate-pop-from-bottom delay-1000 relative z-10 mt-3 rounded-full border border-[#dbe6f5] bg-[#eef2f9] px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-[#3b82f6] sm:text-sm">
          {subLine}
        </p>
      )}
    </div>
  );
}

function FinalSlide({ show }: { show: boolean }) {
  const { text: typedText } = useTypewriter(introTypingPrompts);

  return (
    <div className="relative flex h-screen w-full flex-shrink-0 flex-col items-center justify-center gap-6 overflow-hidden px-6">
      <div className="bg-drift pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] rounded-full bg-blue-400/10 blur-3xl" />
      <div className="bg-drift-alt pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] rounded-full bg-violet-400/10 blur-3xl" />
      <div className="relative z-10 mx-auto grid w-full max-w-4xl gap-5 sm:grid-cols-2">
        <div
          className={`rounded-lg border border-[#dbe6f5] bg-[#eef2f9] p-5 transition-all duration-700 ${
            show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#3b82f6]">01 · Reasoning Agent</p>
          <p className="mt-2 text-sm leading-6 text-[#475569]">Our strongest reasoning CAD agent.</p>
          <video
            src="/demoVideo.mp4"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            controls={false}
            tabIndex={-1}
            className="mt-4 hidden aspect-video w-full rounded-md border border-[#dbe6f5] bg-[#f8fafc] object-cover sm:block"
          />
          <div className="mt-4 rounded-md border border-[#dbe6f5] bg-[#f8fafc] p-3">
            <p className="relative min-h-12 font-mono text-xs leading-6 text-[#0f172a]">
              <span className="invisible select-none" aria-hidden="true">{introTypingPrompts[0].text}</span>
              <span className="absolute inset-0">
                {typedText}
                <span className="cursor-blink ml-px text-[#3b82f6]">|</span>
              </span>
            </p>
          </div>
        </div>

        <div
          className={`rounded-lg border border-[#dbe6f5] bg-[#eef2f9] p-5 transition-all duration-700 ${
            show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ transitionDelay: show ? "150ms" : "0ms" }}
        >
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#3b82f6]">02 · Inter-CAD Transfer</p>
          <p className="mt-2 text-sm leading-6 text-[#475569]">
            Our inter-software CAD tool, persisting fully feature- and parameter-hydrated designs in any CAD tool.
          </p>
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
            className="mt-4 hidden aspect-video w-full rounded-md border border-[#dbe6f5] bg-[#f8fafc] object-cover sm:block"
          />
          <FlowSteps />
        </div>
      </div>
    </div>
  );
}

export default function NodeIntro() {
  const [stage, setStage] = useState<Stage>("checking");
  const [arrived, setArrived] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [show3D, setShow3D] = useState(false);
  // Flips once the 3D scene has painted its first frame — the 2D node fades
  // only then, so its size-matched 3D twin is already visible underneath.
  const [graphReady, setGraphReady] = useState(false);
  const [zoom3D, setZoom3D] = useState(false);
  const [showRipple, setShowRipple] = useState(false);
  const [slideIndex, setSlideIndex] = useState<0 | 1 | 2 | 3>(0);
  const [showSkip, setShowSkip] = useState(false);
  const [exitFast, setExitFast] = useState(false);

  const initRef = useRef(false);
  const lockedRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const pointerIdRef = useRef<number | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);

  const schedule = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  };

  const clearAllTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const finish = () => {
    sessionStorage.setItem(SESSION_KEY, "true");
    if (lockedRef.current) {
      unlockScroll();
      lockedRef.current = false;
    }
    setStage("skipped");
  };

  // Initial session check — mount once, never flash for returning visitors.
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    if (sessionStorage.getItem(SESSION_KEY) === "true") {
      setStage("skipped");
      return;
    }

    lockScroll();
    lockedRef.current = true;
    setStage("fly-in");
    schedule(() => setShowSkip(true), 1500);

    return () => {
      clearAllTimers();
      if (lockedRef.current) {
        unlockScroll();
        lockedRef.current = false;
      }
    };
  }, []);

  // Per-stage choreography.
  useEffect(() => {
    if (stage === "fly-in") {
      // Double rAF ensures the initial (off-screen) transform commits to the
      // DOM before flipping to the rest position, so the transition fires.
      let raf1 = 0;
      let raf2 = 0;
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setArrived(true));
      });
      // rAF never fires in a hidden tab (background-tab load) — without this
      // timer fallback the node would stay stranded 90vh below forever.
      schedule(() => setArrived(true), 600);
      schedule(() => setStage("drag-hint"), 1300);
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    }

    if (stage === "snap-back") {
      schedule(() => setStage("click-hint"), 700);
    }

    if (stage === "graph") {
      setShowRipple(true);
      schedule(() => setShowRipple(false), 1200);
      // Let the recenter transition (top 24% → 50%) finish, then mount the
      // 3D scene; it reveals itself and starts spinning, then after a beat
      // we ask it to zoom in — the scene calls onZoomDone once that
      // completes, which is what actually advances to "carousel".
      schedule(() => setShow3D(true), 950);
      schedule(() => setZoom3D(true), 950 + 4300);
    }

    if (stage === "carousel") {
      schedule(() => setSlideIndex(1), 300);
      schedule(() => setSlideIndex(2), 300 + 3600);
      schedule(() => setSlideIndex(3), 300 + 3600 + 3600);
      schedule(() => setStage("exiting"), 300 + 3600 + 3600 + 3400);
    }

    if (stage === "exiting") {
      schedule(finish, exitFast ? 200 : 400);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  // Keep the dragged node on-screen if the viewport resizes mid-drag.
  useEffect(() => {
    if (!isDragging) return;
    const onResize = () => setDragOffset((prev) => clampOffset(prev.x, prev.y));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isDragging]);

  if (stage === "checking" || stage === "skipped") return null;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (stage !== "drag-hint" || pointerIdRef.current !== null) return;
    pointerIdRef.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStartRef.current = { x: e.clientX, y: e.clientY, offsetX: dragOffset.x, offsetY: dragOffset.y };
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setDragOffset(clampOffset(dragStartRef.current.offsetX + dx, dragStartRef.current.offsetY + dy));
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId) return;
    pointerIdRef.current = null;
    dragStartRef.current = null;
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
    setStage("snap-back");
  };

  const handleNodeClick = () => {
    if (stage !== "click-hint") return;
    setStage("graph");
  };

  const handleNodeKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (stage !== "click-hint") return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setStage("graph");
    }
  };

  const handleSkip = () => {
    if (stage === "exiting") return;
    clearAllTimers();
    setExitFast(true);
    setStage("exiting");
  };

  const isFarFromCenter = Math.hypot(dragOffset.x, dragOffset.y) > 40;
  const caption =
    stage === "drag-hint" ? (isDragging && isFarFromCenter ? "let go" : "drag me around") : stage === "click-hint" ? "click me" : "";

  const showGraph = stage === "graph" || stage === "carousel";
  const nodeLabel = showGraph ? "Sketch" : "●";

  // Weight cues: a slight pendulum tilt while dragging, a size lift when
  // picked up, and a "landing" overshoot (fly-in and snap-back both ease
  // through a back-bezier so the node briefly overshoots past its rest
  // scale/position, like something with real mass settling into place).
  const rotationDeg = Math.max(-14, Math.min(14, dragOffset.x * 0.05));
  const nodeScale = !arrived ? 0.85 : isDragging ? 1.12 : 1;
  const nodeShadow = isDragging
    ? "0 28px 54px -12px rgba(59,130,246,0.45)"
    : "0 10px 26px -8px rgba(15,23,42,0.18)";

  let nodeTransition = "transform 1300ms cubic-bezier(0.22,1.6,0.36,1), box-shadow 300ms ease";
  if (isDragging) nodeTransition = "box-shadow 300ms ease";
  else if (stage === "snap-back") nodeTransition = "transform 700ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 300ms ease";

  return (
    <div
      className="fixed inset-0 z-[100] overflow-hidden bg-[#f8fafc]"
      style={{ transition: `opacity ${exitFast ? 200 : 400}ms ease`, opacity: stage === "exiting" ? 0 : 1 }}
    >
      {showSkip && stage !== "exiting" && (
        <button
          type="button"
          onClick={handleSkip}
          className="absolute right-5 top-5 z-10 cursor-pointer font-mono text-[11px] uppercase tracking-[0.25em] text-[#64748b] transition-colors hover:text-[#3b82f6]"
        >
          Skip →
        </button>
      )}

      <div
        className="flex h-[400vh] w-full flex-col"
        style={{
          transform: `translateY(-${slideIndex * 100}vh)`,
          transition: "transform 900ms cubic-bezier(0.65,0,0.35,1)",
        }}
      >
        {/* ── Slide 0: node interaction + feature graph ── */}
        <div className="relative h-screen w-full flex-shrink-0">
          <div className="bg-drift pointer-events-none absolute left-1/2 top-1/2 h-[320px] w-[320px] rounded-full bg-blue-400/10 blur-3xl sm:h-[560px] sm:w-[560px]" />
          <div className="bg-drift-alt pointer-events-none absolute left-1/2 top-1/2 h-[260px] w-[260px] rounded-full bg-violet-400/10 blur-3xl sm:h-[420px] sm:w-[420px]" />
          <div
            className={`pointer-events-none absolute left-1/2 top-[14%] -translate-x-1/2 text-center transition-opacity duration-500 ${
              caption ? "opacity-100" : "opacity-0"
            }`}
          >
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#3b82f6]">{caption || " "}</p>
          </div>

          {/* Draggable sphere cluster — recenters from 24% to 50% the moment
              it's clicked, then fades out once the 3D scene takes over at
              that same center point. */}
          <div
            className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center"
            style={{
              top: showGraph ? "50%" : "24%",
              // Quick handoff fade: the 3D root underneath is size- and
              // position-matched to this node, so a short fade reads as the
              // same object rather than a swap.
              transition: "top 900ms cubic-bezier(0.65,0,0.35,1), opacity 180ms ease",
              opacity: graphReady ? 0 : 1,
              pointerEvents: show3D ? "none" : undefined,
            }}
          >
            <div
              className="relative flex items-center justify-center"
              style={{
                transform: `translateY(-50%) translateY(${arrived ? 0 : 90}vh) translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotationDeg}deg) scale(${nodeScale})`,
                transition: nodeTransition,
                touchAction: "none",
              }}
            >
              <div className="cad-pulse absolute h-20 w-20 rounded-full bg-blue-400/25 blur-xl sm:h-24 sm:w-24" />

              {showRipple &&
                [0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="node-ripple pointer-events-none absolute h-14 w-14 rounded-full border-2 border-[#3b82f6]/60 sm:h-16 sm:w-16"
                    style={{ animationDelay: `${i * 160}ms` }}
                  />
                ))}

              <div
                role="button"
                tabIndex={0}
                aria-label="Parametra node"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onClick={handleNodeClick}
                onKeyDown={handleNodeKeyDown}
                style={{ ...nodeStyle(true), boxShadow: `${nodeStyle(true).boxShadow}, ${nodeShadow}`, transition: "box-shadow 300ms ease" }}
                className={`relative flex h-14 w-14 items-center justify-center rounded-full cursor-grab select-none active:cursor-grabbing sm:h-16 sm:w-16 ${
                  stage === "click-hint" ? "breathe-blue" : ""
                }`}
              >
                <span className="font-mono text-xs uppercase tracking-widest text-[#1d4ed8]">{nodeLabel}</span>
              </div>
            </div>
          </div>

          {/* 3D feature-dependency graph — full-bleed so it genuinely fills
              the screen (both at rest and while zooming in), not just a
              small centered box. */}
          {show3D && (
            <div className="absolute inset-0">
              <NodeGraph3D
                zoom={zoom3D}
                onZoomDone={() => setStage("carousel")}
                onReady={() => setGraphReady(true)}
              />
            </div>
          )}
        </div>

        {/* ── Slide 1 ── */}
        <BigTextSlide
          show={slideIndex >= 1}
          showLogo
          lines={[{ text: "We" }, { text: "Are" }, { text: "Parametra" }]}
        />

        {/* ── Slide 2 ── */}
        <BigTextSlide
          show={slideIndex >= 2}
          glow="violet"
          lines={[{ text: "The next" }, { text: "Inter-Software Git for CAD", italic: true }]}
          subLine="and also the best reasoning AI CAD engine"
        />

        {/* ── Slide 3 ── */}
        <FinalSlide show={slideIndex >= 3} />
      </div>
    </div>
  );
}
