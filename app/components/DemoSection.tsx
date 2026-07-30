"use client";

import { useEffect, useRef, useState } from "react";
import { lockScroll, unlockScroll } from "../../lib/scrollLock";
import DeviceShell, { type DeviceKind } from "./DeviceShell";
import {
  DOCKED_FRAME,
  DOCK_ANCHOR_ID,
  DOCK_MARKER_TOP_SVH,
  RUNWAY_SVH,
  flightAt,
  progressFor,
  transformFor,
  type FlightFrame,
} from "../../lib/deviceFlight";

// ── Types ─────────────────────────────────────────────────────────────────────

export type AppView = "home" | "pulling" | "graph" | "history";

export interface AppStep {
  delay: number;
  view?: AppView;
  pullStatus?: string;
  header?: "capture";
  badges?: boolean;
  docs?: number;
  studios?: number;
  chips?: number;
  nodes?: number;
  done?: boolean;
}

export interface HistoryEvent {
  t: number;
  level: "info" | "ok" | "warn";
  text: string;
  time: string;
}

export type NodeKind = "folder" | "document" | "partstudio" | "tab" | "workflow";

export interface GraphNode {
  id: string;
  label: string;
  kind: NodeKind;
  x: number;
  y: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  accent?: boolean;
}

// ── Data ──────────────────────────────────────────────────────────────────────
//
// The live demo plays ONE scripted run mirroring the real Parametra desktop
// app: Pull from Onshape → Home dashboard populates → Intent graph builds.
// Everything on screen is driven by these exported constants — covered by the
// invariant tests in __tests__/components/DemoSection.data.test.ts, so run
// `npm test` after editing any of them.

export const DOCUMENTS: { id: string; name: string; fetches: string; time: string }[] = [
  { id: "tbs",    name: "TBS Lucid Pro Stack - F4 FC + 60A 3-6S AM32 4-in-1 ESC", fetches: "1 fetch", time: "13:28" },
  { id: "ms",     name: "MasterSketch",                                            fetches: "1 fetch", time: "13:28" },
  { id: "hqprop", name: "HQProp Durable T5×3 Toothpick Propeller",                 fetches: "1 fetch", time: "13:28" },
  { id: "hglrc",  name: "HGLRC SPECTER 2004 1800KV brushless motor",               fetches: "1 fetch", time: "13:28" },
];

export const PART_STUDIOS: { id: string; name: string; meta: string; status: "partial" | "success" }[] = [
  { id: "gorilla", name: "Gorilla mounting pattern with standoff", meta: "3 features · 934 warn", status: "partial" },
  { id: "ps1",     name: "Part Studio 1",                          meta: "0 features",            status: "success" },
];

export const SESSION_CHIPS: string[] = [
  "HGLRC SPECTER 2004 1800KV brushless motor",
  "HQProp Durable T5×3 Toothpick Propeller",
  "MasterSketch · MasterSketch",
  "TBS Lucid Pro Stack - F4 FC + 60A AM32",
];

// Intent-graph nodes, ordered hub-first so the scripted bloom reveals the
// structure before its leaves. Positions live in a 1000×560 viewBox.
export const GRAPH_NODES: GraphNode[] = [
  { id: "wf",    label: "Example Workflow",               kind: "workflow",   x: 500, y: 330 },
  { id: "tbs",   label: "TBS Lucid Pro Stack - F4 FC…",   kind: "workflow",   x: 455, y: 155 },
  { id: "hglrc", label: "HGLRC SPECTER 2004 1800KV b…",   kind: "folder",     x: 615, y: 415 },
  { id: "hqp-f", label: "HQProp T5x3",                    kind: "folder",     x: 255, y: 175 },
  { id: "ms-d",  label: "MasterSketch",                   kind: "document",   x: 365, y: 400 },
  { id: "hqp-d", label: "HQProp Durable T5x3 Toothpi…",   kind: "document",   x: 330, y: 235 },
  { id: "gor2",  label: "Gorilla mounting pattern wi…",   kind: "document",   x: 680, y: 190 },
  { id: "ms-p",  label: "MasterSketch",                   kind: "partstudio", x: 275, y: 355 },
  { id: "ps1b",  label: "Part Studio 1",                  kind: "partstudio", x: 640, y: 490 },
  { id: "pcb1",  label: "PCB Studio",                     kind: "tab",        x: 560, y: 100 },
  { id: "ps1a",  label: "Part Studio 1",                  kind: "tab",        x: 420, y: 105 },
  { id: "rnd",   label: "3D rendering.png",               kind: "tab",        x: 665, y: 120 },
  { id: "gor1",  label: "Gorilla mounting pattern wi…",   kind: "tab",        x: 510, y: 75  },
  { id: "gor3",  label: "Gorilla mounting pattern wi…",   kind: "tab",        x: 415, y: 218 },
  { id: "ecad",  label: "EX ECAD Files",                  kind: "tab",        x: 448, y: 190 },
  { id: "prop",  label: "Propeller Dimensions",           kind: "tab",        x: 478, y: 228 },
  { id: "asm1",  label: "Assembly 1",                     kind: "tab",        x: 350, y: 300 },
  { id: "bom1",  label: "BOM : Assembly 1",               kind: "tab",        x: 655, y: 305 },
  { id: "spec",  label: "Spec Sheet",                     kind: "tab",        x: 505, y: 362 },
  { id: "eff",   label: "Efficacy Table",                 kind: "tab",        x: 705, y: 352 },
  { id: "mot",   label: "Motor Dimensions",               kind: "tab",        x: 695, y: 442 },
  { id: "fvs",   label: "FrameVarsStudio",                kind: "tab",        x: 300, y: 448 },
  { id: "asm2",  label: "Assembly 1",                     kind: "tab",        x: 520, y: 452 },
  { id: "bom2",  label: "BOM : Assembly 1",               kind: "tab",        x: 430, y: 482 },
  { id: "pcb2",  label: "PCB Studio",                     kind: "tab",        x: 500, y: 498 },
  { id: "pack",  label: "Packing List",                   kind: "tab",        x: 568, y: 502 },
  { id: "draw",  label: "Drawings",                       kind: "tab",        x: 602, y: 520 },
];

export const GRAPH_EDGES: GraphEdge[] = [
  { from: "wf",    to: "tbs" },
  { from: "wf",    to: "hglrc" },
  { from: "wf",    to: "ms-d" },
  { from: "wf",    to: "asm1" },
  { from: "wf",    to: "spec" },
  { from: "wf",    to: "bom1" },
  { from: "wf",    to: "gor3" },
  { from: "tbs",   to: "pcb1" },
  { from: "tbs",   to: "ps1a" },
  { from: "tbs",   to: "gor1" },
  { from: "tbs",   to: "rnd" },
  { from: "tbs",   to: "gor2" },
  { from: "tbs",   to: "ecad" },
  { from: "tbs",   to: "prop" },
  { from: "tbs",   to: "hqp-d" },
  { from: "hqp-f", to: "hqp-d" },
  { from: "hqp-d", to: "gor3" },
  { from: "ms-d",  to: "ms-p" },
  { from: "ms-p",  to: "fvs", accent: true },
  { from: "hglrc", to: "eff" },
  { from: "hglrc", to: "mot", accent: true },
  { from: "hglrc", to: "asm2" },
  { from: "hglrc", to: "bom2" },
  { from: "hglrc", to: "pcb2" },
  { from: "hglrc", to: "pack" },
  { from: "hglrc", to: "ps1b" },
  { from: "hglrc", to: "draw" },
  { from: "gor2",  to: "rnd" },
];

// Session events streamed into the History tab while the run plays — the
// timestamps are relative to startDemo, like a log timeline.
export const HISTORY_EVENTS: HistoryEvent[] = [
  { t: 300,  level: "info", text: "Pull from Onshape started",                          time: "13:28" },
  { t: 900,  level: "info", text: "Opening 5 Part Studios…",                            time: "13:28" },
  { t: 2700, level: "ok",   text: "Fetched TBS Lucid Pro Stack - F4 FC + AM32 ESC",     time: "13:28" },
  { t: 3100, level: "ok",   text: "Fetched MasterSketch",                               time: "13:28" },
  { t: 3500, level: "ok",   text: "Fetched HQProp Durable T5×3 Toothpick Propeller",    time: "13:28" },
  { t: 3900, level: "ok",   text: "Fetched HGLRC SPECTER 2004 1800KV brushless motor",  time: "13:28" },
  { t: 4600, level: "info", text: "Capture opened · Part Studio 1",                     time: "13:28" },
  { t: 5100, level: "warn", text: "Rebuild finished partial — 2 warnings raised",       time: "13:28" },
  { t: 6300, level: "info", text: "Intent graph build started",                         time: "13:28" },
  { t: 8900, level: "ok",   text: "Intent graph ready · 27 nodes · 28 edges",           time: "13:28" },
];

export const APP_SCRIPT: AppStep[] = [
  { delay: 300,  view: "pulling", pullStatus: "Contacting Onshape…" },
  { delay: 900,  pullStatus: "Opening 5 Part Studios…" },
  { delay: 1900, pullStatus: "Reading feature trees…" },
  { delay: 2600, view: "home", header: "capture", docs: 1 },
  { delay: 3000, docs: 2 },
  { delay: 3400, docs: 3 },
  { delay: 3800, docs: 4 },
  { delay: 4300, studios: 1 },
  { delay: 4800, studios: 2, badges: true },
  { delay: 5800, view: "graph" },
  { delay: 6000, chips: 1 },
  { delay: 6200, chips: 2 },
  { delay: 6400, chips: 3 },
  { delay: 6600, chips: 4 },
  { delay: 6900, nodes: 3 },
  { delay: 7300, nodes: 8 },
  { delay: 7700, nodes: 14 },
  { delay: 8100, nodes: 20 },
  { delay: 8500, nodes: 27 },
  { delay: 9300, done: true },
];

// ── Shared palette (self-contained dark theme, like a product screenshot) ────

const NODE_STYLE: Record<NodeKind, { color: string; r: number }> = {
  workflow:   { color: "#f59e0b", r: 11 },
  folder:     { color: "#3b82f6", r: 8 },
  document:   { color: "#8b5cf6", r: 7 },
  partstudio: { color: "#c084fc", r: 6 },
  tab:        { color: "#94a9c9", r: 5 },
};

const LEGEND: { label: string; color: string }[] = [
  { label: "folder",      color: "#3b82f6" },
  { label: "document",    color: "#8b5cf6" },
  { label: "part studio", color: "#c084fc" },
  { label: "other tab",   color: "#94a9c9" },
];

const INTEROP_ITEMS = [
  "Intent graph",
  "Timeline",
  "Sketches",
  "Parameters",
  "Readiness",
  "Risks",
  "Dependencies",
  "Raw JSON",
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function DemoSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);
  const lockedRef  = useRef(false);

  // Always start empty (SSR-safe) — fast-forward to complete state in useEffect
  // if the demo already played this session.
  const [started, setStarted] = useState(false);
  const [view, setView]             = useState<AppView>("home");
  const [headerCapture, setHeaderCapture] = useState(false);
  const [badges, setBadges]         = useState(false);
  const [pullStatus, setPullStatus] = useState("Contacting Onshape…");
  const [docCount, setDocCount]     = useState(0);
  const [studioCount, setStudioCount] = useState(0);
  const [chipCount, setChipCount]   = useState(0);
  const [nodeCount, setNodeCount]   = useState(0);
  const [historyShown, setHistoryShown] = useState<HistoryEvent[]>([]);
  const [done, setDone]             = useState(false);
  const [signedIn, setSignedIn]     = useState(false);
  const [shelfOpen, setShelfOpen]   = useState(false);
  const [showMobileHint, setShowMobileHint] = useState(false);

  const historyRef    = useRef<HTMLDivElement>(null);
  const historyNavRef = useRef<HTMLButtonElement>(null);
  const graphNavRef   = useRef<HTMLButtonElement>(null);
  const loginRef      = useRef<HTMLButtonElement>(null);
  const cursorRunning = useRef(false);

  // ── Device flight ──────────────────────────────────────────────────────────
  // The window rides a 3D arc into the section: in from the back-left as a
  // MacBook/phone, then docked for the rest of the runway.
  const flyRef  = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  // Which shell flies in. Laptop is the SSR default; the shell is invisible at
  // rest (--chrome: 0), so correcting it on mount can't flash.
  const [device, setDevice] = useState<DeviceKind>("laptop");

  // Cursor animation state (desktop-only hint)
  const [cursor, setCursor] = useState({ x: 0, y: 0, visible: false, tooltip: "", clicking: false });

  const applyStep = (s: AppStep) => {
    if (s.view) setView(s.view);
    if (s.pullStatus) setPullStatus(s.pullStatus);
    if (s.header === "capture") setHeaderCapture(true);
    if (s.badges) setBadges(true);
    if (s.docs !== undefined) setDocCount(s.docs);
    if (s.studios !== undefined) setStudioCount(s.studios);
    if (s.chips !== undefined) setChipCount(s.chips);
    if (s.nodes !== undefined) setNodeCount(s.nodes);
    if (s.done) setDone(true);
  };

  // On mount: if the demo already played this session, fast-forward the run to
  // its complete state immediately. sessionStorage is unreadable during SSR, so
  // this must stay a post-mount state write.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (sessionStorage.getItem("demoAnimPlayed") !== "true") return;
    startedRef.current = true;
    setStarted(true);
    APP_SCRIPT.forEach(applyStep);
    setHistoryShown(HISTORY_EVENTS);
    setView("graph");
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Pick the shell that matches the form factor being shown.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setDevice(mq.matches ? "phone" : "laptop");
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Drive the flight from scroll position. This writes straight to the DOM
  // rather than through state: it runs on every frame of a scroll, and the demo
  // subtree is far too heavy to re-render at that rate. One element, one write.
  useEffect(() => {
    const fly = flyRef.current;
    const section = sectionRef.current;
    if (!fly || !section) return;

    const apply = (f: FlightFrame) => {
      fly.style.transform = transformFor(f);
      fly.style.opacity = String(f.opacity);
      fly.style.setProperty("--chrome", f.chrome.toFixed(3));
      // Only clickable once it has settled — no catching the Start button
      // while it's still rotated and sliding past.
      fly.style.pointerEvents = f.docked ? "" : "none";
    };

    // Respect reduced motion by skipping the flight entirely: the window simply
    // sits docked for the whole runway.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      apply(DOCKED_FRAME);
      return;
    }

    let frame = 0;
    const update = () => {
      apply(flightAt(progressFor(section.getBoundingClientRect(), window.innerHeight)));
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Keep the History feed pinned to the newest event.
  useEffect(() => {
    const el = historyRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [historyShown, view]);

  // The demo is gated behind an explicit start button — it never auto-plays on
  // scroll. Clicking snaps the section into view, locks scroll, and runs the
  // pull → home → intent-graph script; scroll unlocks when the run completes.
  const startDemo = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    setStarted(true);

    // Snap instantly to the dock marker — "auto" would defer to the global
    // `scroll-behavior: smooth` CSS rule, and locking scroll right after would
    // freeze body overflow mid-animation, stranding the page wherever the
    // smooth scroll had reached. Aiming at the marker rather than the section's
    // top also guarantees we land in the docked band, not mid-flight.
    (dockRef.current ?? sectionRef.current)?.scrollIntoView({ behavior: "instant", block: "start" });

    lockScroll();
    lockedRef.current = true;

    const lastDelay = Math.max(
      ...APP_SCRIPT.map(s => s.delay),
      ...HISTORY_EVENTS.map(e => e.t),
    );

    APP_SCRIPT.forEach(step => {
      setTimeout(() => applyStep(step), step.delay);
    });

    HISTORY_EVENTS.forEach(event => {
      setTimeout(() => {
        setHistoryShown(prev => [...prev, event]);
      }, event.t);
    });

    setTimeout(() => {
      // On desktop, the fake-cursor hint tour is about to run over this same
      // locked viewport — keep the lock held through it (it unlocks itself
      // when the tour finishes below) instead of releasing it here, or the
      // page could be scrolled away mid-tour while the cursor still points
      // at now-stale element positions.
      const willShowCursorHint =
        typeof window !== "undefined" &&
        window.innerWidth >= 640 &&
        sessionStorage.getItem("cursorHintPlayed") !== "true";

      if (!willShowCursorHint && lockedRef.current) {
        unlockScroll();
        lockedRef.current = false;
      }
      sessionStorage.setItem("demoAnimPlayed", "true");
    }, lastDelay + 200);
  };

  // Never leave the page locked if the section unmounts mid-run.
  useEffect(() => {
    return () => {
      if (lockedRef.current) { unlockScroll(); lockedRef.current = false; }
    };
  }, []);

  // Cursor hint animation — desktop only, runs once on first demo completion.
  // It shows off the app's chrome the run itself didn't visit: the History tab
  // and the account/login chip at the bottom of the sidebar.
  useEffect(() => {
    if (!done) return;
    // Phones have no cursor hint at all (the sidebar lives behind the
    // hamburger shelf there) — point at the hamburger once instead.
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      if (sessionStorage.getItem("mobileHamburgerHintPlayed") !== "true") {
        sessionStorage.setItem("mobileHamburgerHintPlayed", "true");
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot hint gated on sessionStorage, unreadable before mount
        setShowMobileHint(true);
        const t = setTimeout(() => setShowMobileHint(false), 6000);
        return () => clearTimeout(t);
      }
      return;
    }
    if (cursorRunning.current) return;
    // Only show cursor hint on the very first playthrough
    if (sessionStorage.getItem("cursorHintPlayed") === "true") return;

    const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

    // A single click phase: move to an element, show tooltip, click, run the action, dwell.
    const clickPhase = async (
      el: HTMLElement | null,
      tooltip: string,
      action: () => void,
      opts: { firstMove?: boolean; dwellAfter?: number } = {},
    ) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      setCursor(c => ({
        ...c,
        tooltip: "",
        x: r.left - 80,
        y: r.top + r.height / 2 + 20,
        visible: true,
        clicking: false,
      }));
      await sleep(opts.firstMove ? 300 : 400);
      setCursor(c => ({ ...c, x: r.left + r.width / 2, y: r.top + r.height / 2, tooltip }));
      await sleep(900);
      setCursor(c => ({ ...c, clicking: true }));
      await sleep(160);
      setCursor(c => ({ ...c, clicking: false }));
      action();
      await sleep(opts.dwellAfter ?? 2000);
    };

    // Like clickPhase, but only points + shows the tooltip — never clicks.
    const hoverPhase = async (
      el: HTMLElement | null,
      tooltip: string,
      opts: { dwellAfter?: number } = {},
    ) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      setCursor(c => ({ ...c, tooltip: "" }));
      await sleep(150);
      setCursor(c => ({ ...c, x: r.left + r.width / 2, y: r.top + r.height / 2, visible: true, tooltip }));
      await sleep(opts.dwellAfter ?? 2400);
    };

    const run = async () => {
      cursorRunning.current = true;
      await sleep(2000);

      // Phase A — the History tab: the session's event feed.
      await clickPhase(
        historyNavRef.current,
        "every fetch, capture, and warning",
        () => setView("history"),
        { firstMove: true, dwellAfter: 2600 },
      );

      // Phase B — the account chip: point only, signing in stays a real click.
      await hoverPhase(loginRef.current, "sign in to sync your captures", { dwellAfter: 2200 });

      // Phase C — back to the intent graph to end where the run ended.
      await clickPhase(
        graphNavRef.current,
        "back to the intent graph",
        () => setView("graph"),
        { dwellAfter: 1400 },
      );

      setCursor(c => ({ ...c, visible: false, tooltip: "" }));
      sessionStorage.setItem("cursorHintPlayed", "true");

      // Only unlock now that the tour is done — the finishing timeout in
      // startDemo deliberately left this locked so the tour's target
      // elements couldn't scroll out from under the fake cursor.
      if (lockedRef.current) {
        unlockScroll();
        lockedRef.current = false;
      }
    };

    run();
   
  }, [done]);

  // Sidebar navigation is inert while the scripted run drives the view.
  const navigate = (v: AppView) => {
    if (!done) return;
    setView(v);
    setShelfOpen(false);
  };

  const sidebarProps = {
    view,
    done,
    signedIn,
    historyCount: historyShown.length,
    onNavigate: navigate,
    onToggleSignIn: () => setSignedIn(s => !s),
  };

  return (
    <section
      id="live-demo"
      ref={sectionRef}
      className="relative bg-[#f8fafc] border-t border-[#dbe6f5]"
      style={{ height: `${RUNWAY_SVH}svh` }}
    >
      {/* Scroll target for startDemo and for anything linking to the demo.
          Parking this at the top of the viewport lands the runway inside the
          docked band, so you always arrive at the window fully flown in and
          interactive rather than stranded mid-flight. */}
      <div
        id={DOCK_ANCHOR_ID}
        ref={dockRef}
        aria-hidden
        className="pointer-events-none absolute left-0 h-px w-px"
        style={{ top: `${DOCK_MARKER_TOP_SVH}svh` }}
      />

      {/* The runway scrolls; this stage stays put and the device flies across it */}
      <div className="sticky top-0" style={{ height: "100svh" }}>
        {/* ── Solid-bg stage — gives the flight its vanishing point ── */}
        <div
          className="flex h-full w-full items-center justify-center overflow-hidden p-3 sm:p-6 lg:p-10"
          style={{ perspective: "1600px" }}
        >
          {/* Flying wrapper — the one node the scroll handler writes to. The
              device shell reads --chrome off it; the window rides along. */}
          <div
            ref={flyRef}
            className="relative flex h-full w-full max-w-[1400px] flex-col"
            style={{ willChange: "transform, opacity" }}
          >
            <DeviceShell kind={device} />

            <div className="relative z-10 flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[#23262e] bg-[#0b0d11] shadow-2xl">
              {/* Start gate — the demo never auto-plays; the user launches it */}
              {!started && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-[#0b0d11]/85 backdrop-blur-[3px] px-4">
                  <button
                    onClick={startDemo}
                    className="flex items-center gap-3 rounded-lg border border-[#3b82f6] bg-[#11151d] px-6 py-3.5 text-sm font-medium text-[#60a5fa] transition-colors hover:bg-[#3b82f6] hover:text-white"
                    style={{ boxShadow: "0 0 24px rgba(59,130,246,0.2)" }}
                  >
                    <span className="text-[10px]">▶</span>
                    Start mock application
                  </button>
                  <p className="text-xs text-[#64748b] text-center">
                    Guided run — scrolling locks until it finishes
                  </p>
                </div>
              )}

              {/* Title bar */}
              <div className="flex items-center gap-4 px-4 py-2.5 border-b border-[#1c2027] bg-[#0e1014] flex-shrink-0">
                {/* Phone only: hamburger + inline hint — fixed row height so the
                    hint appearing/disappearing never nudges the title bar */}
                <div className="flex sm:hidden h-5 min-w-0 flex-1 items-center gap-2.5 overflow-hidden">
                  <button
                    className="flex flex-shrink-0 items-center gap-1.5"
                    onClick={() => { setShelfOpen(true); setShowMobileHint(false); }}
                    aria-label="Open navigation"
                  >
                    <span className="flex flex-col gap-1">
                      <span className={`block h-0.5 w-5 transition-colors ${showMobileHint ? "bg-[#3b82f6]" : "bg-[#8a94a6]"}`} />
                      <span className={`block h-0.5 w-5 transition-colors ${showMobileHint ? "bg-[#3b82f6]" : "bg-[#8a94a6]"}`} />
                      <span className={`block h-0.5 w-4 transition-colors ${showMobileHint ? "bg-[#3b82f6]" : "bg-[#8a94a6]"}`} />
                    </span>
                  </button>
                  {showMobileHint ? (
                    <button
                      onClick={() => { setShelfOpen(true); setShowMobileHint(false); }}
                      className="flex min-w-0 flex-1 items-center gap-1.5 animate-fade-in"
                    >
                      <span className="flex-shrink-0 text-[#3b82f6] leading-none animate-pulse">←</span>
                      <span className="min-w-0 flex-1 truncate text-[11px] leading-none text-[#3b82f6]">
                        Tap here to explore the app
                      </span>
                    </button>
                  ) : (
                    <span className="text-xs font-medium text-[#8a94a6]">Parametra</span>
                  )}
                </div>
                {/* Tablet and up: traffic lights + centred window title */}
                <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
                  <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                  <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
                  <div className="h-3 w-3 rounded-full bg-[#28c840]" />
                </div>
                <span className="hidden sm:block absolute left-1/2 -translate-x-1/2 text-xs font-semibold text-[#8a94a6]">
                  Parametra
                </span>
              </div>

              {/* App header */}
              <div className="flex items-center gap-3 border-b border-[#1c2027] bg-[#0b0d11] px-4 py-3 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.svg"
                  alt=""
                  className="h-6 w-6 flex-shrink-0"
                  style={{ filter: "brightness(0) invert(1)" }}
                />
                {headerCapture ? (
                  <div className="flex min-w-0 items-baseline gap-2">
                    <span className="truncate text-sm font-bold text-[#f1f5f9]">Part Studio 1</span>
                    <span className="hidden xs:block text-xs text-[#64748b] flex-shrink-0">Part Studio</span>
                  </div>
                ) : (
                  <span className="text-sm font-bold text-[#f1f5f9]">No capture open</span>
                )}

                <div className="ml-auto flex items-center gap-2 flex-shrink-0">
                  {badges && (
                    <>
                      <span className="rounded-full bg-[#26221a] px-3 py-1 text-[11px] font-medium text-[#fbbf24] animate-fade-in">
                        partial
                      </span>
                      <span className="hidden sm:block rounded-full bg-[#26221a] px-3 py-1 text-[11px] font-medium text-[#fbbf24] animate-fade-in">
                        2 warnings
                      </span>
                    </>
                  )}
                  <span className="hidden md:block rounded-full bg-[#22262e] px-4 py-1.5 text-xs font-medium text-[#e2e8f0]">
                    Pull from Onshape…
                  </span>
                  <span className="hidden lg:block rounded-full bg-[#22262e] px-4 py-1.5 text-xs font-medium text-[#e2e8f0]">
                    Settings…
                  </span>
                </div>
              </div>

              {/* App body */}
              <div className="flex flex-1 min-h-0">
                {/* ── Left sidebar (tablet and up) ── */}
                <aside className="hidden sm:flex w-48 lg:w-52 flex-shrink-0 flex-col border-r border-[#1c2027] bg-[#0b0d11]">
                  <Sidebar
                    {...sidebarProps}
                    historyNavRef={historyNavRef}
                    graphNavRef={graphNavRef}
                    loginRef={loginRef}
                  />
                </aside>

                {/* ── Main content ── */}
                <main className="flex-1 min-w-0 overflow-y-auto bg-[#0b0d11] px-3 py-3 sm:px-5 sm:py-4">
                  {view === "pulling" && <PullingView status={pullStatus} />}
                  {view === "home" && <HomeView docCount={docCount} studioCount={studioCount} />}
                  {view === "graph" && <GraphView chipCount={chipCount} nodeCount={nodeCount} />}
                  {view === "history" && <HistoryView events={historyShown} scrollRef={historyRef} />}
                </main>
              </div>

              {/* Status bar */}
              <div className="flex items-center gap-2 border-t border-[#1c2027] bg-[#0e1014] px-4 py-2 flex-shrink-0">
                <span
                  className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                    done ? "bg-[#22c55e]" : started ? "bg-[#f59e0b] animate-pulse" : "bg-[#3f4854]"
                  }`}
                />
                <span className="text-[11px] text-[#64748b] truncate">
                  {!started
                    ? "Awaiting connection…"
                    : !done
                      ? "Pulling from Onshape…"
                      : "Demo complete — scroll or swipe to return to the site"}
                </span>
              </div>

              {/* ── Mobile slide-in shelf ── */}
              <div
                className={`absolute inset-0 z-40 bg-black/50 transition-opacity duration-300 sm:hidden ${
                  shelfOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                }`}
                onClick={() => setShelfOpen(false)}
              />
              <div
                className={`absolute top-0 left-0 z-50 h-full w-64 flex flex-col bg-[#0e1014] border-r border-[#1c2027] transition-transform duration-300 ease-out sm:hidden ${
                  shelfOpen ? "translate-x-0" : "-translate-x-full"
                }`}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#1c2027]">
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo.svg" alt="" className="h-4 w-4" style={{ filter: "brightness(0) invert(1)" }} />
                    <span className="font-mono text-xs text-[#e2e8f0] tracking-[0.1em]">Parametra</span>
                  </div>
                  <button
                    onClick={() => setShelfOpen(false)}
                    className="font-mono text-lg text-[#8a94a6] hover:text-[#e2e8f0] leading-none"
                    aria-label="Close navigation"
                  >
                    ×
                  </button>
                </div>
                <Sidebar {...sidebarProps} />
              </div>
            </div>{/* window */}
          </div>{/* flying wrapper */}
        </div>{/* stage */}
      </div>{/* sticky */}

      {/* ── Fake cursor hint (tablet and up) ──
          Deliberately outside the stage: `perspective` and `transform` both
          make an ancestor the containing block for `position: fixed`, which
          would pin this to the flying window instead of the viewport. */}
      <div className="hidden sm:block pointer-events-none">
        <div
          className="fixed z-[999]"
          style={{
            left: cursor.x,
            top: cursor.y,
            opacity: cursor.visible ? 1 : 0,
            transition: "left 0.7s ease-out, top 0.7s ease-out, opacity 0.3s ease",
          }}
        >
          <svg
            width="20" height="20" viewBox="0 0 20 20" fill="none"
            className={`transition-transform duration-100 ${cursor.clicking ? "scale-75" : "scale-100"}`}
            style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.5))" }}
          >
            <path d="M4 2L4 15L7.5 11.5L10 17L12 16L9.5 10.5L14 10.5L4 2Z" fill="#f1f5f9" stroke="#0b0d11" strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
          {cursor.tooltip && (
            <div
              className="absolute left-5 top-0 whitespace-nowrap rounded-md border border-[#3b82f6] bg-[#11151d] px-2.5 py-1.5 text-[11px] font-medium text-[#60a5fa]"
              style={{ boxShadow: "0 0 16px rgba(59,130,246,0.25)" }}
            >
              {cursor.tooltip}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({
  view,
  done,
  signedIn,
  historyCount,
  onNavigate,
  onToggleSignIn,
  historyNavRef,
  graphNavRef,
  loginRef,
}: {
  view: AppView;
  done: boolean;
  signedIn: boolean;
  historyCount: number;
  onNavigate: (v: AppView) => void;
  onToggleSignIn: () => void;
  historyNavRef?: React.Ref<HTMLButtonElement>;
  graphNavRef?: React.Ref<HTMLButtonElement>;
  loginRef?: React.Ref<HTMLButtonElement>;
}) {
  const itemClass = (active: boolean) =>
    `flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[13px] transition-colors ${
      active
        ? "bg-[#1b2331] text-[#f1f5f9] font-medium"
        : "text-[#94a3b8] hover:bg-[#14171d] hover:text-[#cbd5e1]"
    } ${done ? "cursor-pointer" : "cursor-default"}`;

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <nav className="flex-1 min-h-0 overflow-y-auto px-2 pt-3 space-y-px">
        <button className={itemClass(view === "home" || view === "pulling")} onClick={() => onNavigate("home")}>
          Home
        </button>
        <button
          ref={historyNavRef}
          className={itemClass(view === "history")}
          onClick={() => onNavigate("history")}
        >
          History
          {historyCount > 0 && (
            <span className="rounded-full bg-[#22262e] px-1.5 py-0.5 font-mono text-[9px] text-[#94a3b8]">
              {historyCount}
            </span>
          )}
        </button>

        <div className="flex items-center justify-between px-3 pt-4 pb-1">
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#4b5563]">
            Inter-op
          </span>
          <span className="text-[9px] text-[#4b5563]">⌄</span>
        </div>
        {INTEROP_ITEMS.map(item =>
          item === "Intent graph" ? (
            <button
              key={item}
              ref={graphNavRef}
              className={itemClass(view === "graph")}
              onClick={() => onNavigate("graph")}
            >
              {item}
            </button>
          ) : (
            <div key={item} className="rounded-lg px-3 py-2 text-[13px] text-[#94a3b8] select-none">
              {item}
            </div>
          ),
        )}
      </nav>

      {/* Account / login — pinned to the bottom-left of the app */}
      <div className="border-t border-[#1c2027] p-3">
        <button
          ref={loginRef}
          data-app-login
          onClick={onToggleSignIn}
          className="flex w-full items-center gap-2.5 rounded-lg border border-[#232830] bg-[#14171d] px-3 py-2.5 text-left transition-colors hover:bg-[#1a1e25]"
        >
          <span
            className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
              signedIn ? "bg-[#2563eb] text-white" : "bg-[#22262e] text-[#94a3b8]"
            }`}
          >
            {signedIn ? "S" : "?"}
          </span>
          <span className="min-w-0">
            {signedIn ? (
              <>
                <span className="block truncate text-xs font-medium text-[#f1f5f9]">Sandeep S.</span>
                <span className="flex items-center gap-1 text-[10px] text-[#22c55e]">
                  <span className="h-1 w-1 rounded-full bg-[#22c55e]" />
                  Onshape connected
                </span>
              </>
            ) : (
              <>
                <span className="block text-xs font-medium text-[#e2e8f0]">Guest</span>
                <span className="text-[10px] text-[#60a5fa]">Sign in →</span>
              </>
            )}
          </span>
        </button>
      </div>
    </div>
  );
}

// ── Views ─────────────────────────────────────────────────────────────────────

function PullingView({ status }: { status: string }) {
  return (
    <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-6 rounded-2xl border border-[#1c2027] bg-[#0d1015] px-6 py-10 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.svg"
        alt=""
        className="h-14 w-14 sm:h-20 sm:w-20"
        style={{ filter: "brightness(0) invert(1) drop-shadow(0 0 24px rgba(59,130,246,0.5))" }}
      />
      {/* Stylised branch lines, like a subway map of parallel fetches */}
      <svg viewBox="0 0 520 130" className="w-full max-w-[400px]" aria-hidden>
        <path d="M8 18 H200 C230 18 230 62 260 62 H300 C330 62 330 18 360 18 H512" stroke="#f59e0b" strokeWidth="3" fill="none" />
        <path d="M40 40 H480" stroke="#2dd4bf" strokeWidth="3" fill="none" />
        <path d="M8 62 H512" stroke="#3b82f6" strokeWidth="3" fill="none" />
        <path d="M100 84 H460" stroke="#a78bfa" strokeWidth="3" fill="none" />
        <path d="M8 112 H80 C110 112 110 84 140 84" stroke="#f472b6" strokeWidth="3" fill="none" />
        {([
          [8, 18, "#f59e0b"], [360, 18, "#f59e0b"],
          [150, 40, "#2dd4bf"], [480, 40, "#2dd4bf"],
          [95, 62, "#3b82f6"], [300, 62, "#3b82f6"], [500, 62, "#3b82f6"],
          [250, 84, "#a78bfa"], [430, 84, "#a78bfa"],
          [40, 112, "#f472b6"],
        ] as [number, number, string][]).map(([cx, cy, c], i) => (
          <circle key={i} cx={cx} cy={cy} r="5" fill="#0d1015" stroke={c} strokeWidth="2.5" />
        ))}
      </svg>
      <div className="space-y-2">
        <p className="text-xl font-bold text-[#f1f5f9] sm:text-2xl">Pulling from Onshape</p>
        <p className="font-mono text-xs text-[#64748b] sm:text-sm">{status}</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, dot, amber }: { label: string; value: string; dot?: string; amber?: boolean }) {
  return (
    <div className="rounded-xl border border-[#1c2027] bg-[#12151b] px-4 py-3.5">
      <p className="flex items-center gap-1.5 text-[11px] text-[#94a3b8]">
        {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: dot }} />}
        {label}
      </p>
      <p className={`mt-0.5 text-2xl font-bold ${amber ? "text-[#fbbf24]" : "text-[#f1f5f9]"}`}>{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: "partial" | "success" }) {
  return status === "partial" ? (
    <span className="rounded-full bg-[#26221a] px-2.5 py-0.5 text-[10px] font-medium text-[#fbbf24]">partial</span>
  ) : (
    <span className="rounded-full bg-[#14231a] px-2.5 py-0.5 text-[10px] font-medium text-[#4ade80]">success</span>
  );
}

// Deterministic fetch-activity heatmap — one bright cell (today's pull) and a
// few dim ones. No randomness: this subtree server-renders.
const HEATMAP_LIT: Record<number, string> = {
  [23 * 7 + 3]: "#3b82f6",
  [20 * 7 + 1]: "#1e3a5f",
  [16 * 7 + 4]: "#16283f",
  [9 * 7 + 2]:  "#16283f",
};

function FetchHeatmap() {
  return (
    <div className="rounded-2xl border border-[#1c2027] bg-[#12151b] p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-[#f1f5f9]">Fetch activity</p>
          <p className="text-[11px] text-[#64748b]">Last 26 weeks · shaded relative to the busiest day</p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-[#64748b]">
          Less
          {["#1a1e25", "#1e3a5f", "#2563eb", "#3b82f6"].map(c => (
            <span key={c} className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: c }} />
          ))}
          More
        </div>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto">
        <div className="flex flex-col justify-between py-px text-[9px] leading-none text-[#4b5563]">
          <span>Mon</span>
          <span>Wed</span>
          <span>Fri</span>
          <span className="opacity-0">·</span>
        </div>
        <div className="grid grid-flow-col grid-rows-7 gap-[3px]">
          {Array.from({ length: 26 * 7 }, (_, i) => (
            <span
              key={i}
              className="h-2.5 w-2.5 rounded-[3px]"
              style={{ backgroundColor: HEATMAP_LIT[i] ?? "#1a1e25" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function HomeView({ docCount, studioCount }: { docCount: number; studioCount: number }) {
  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Hero banner */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#1d2635] bg-gradient-to-r from-[#101d36] via-[#0e1524] to-[#0d1117] p-5 sm:flex-row sm:items-center sm:p-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.svg"
          alt=""
          className="h-12 w-12 flex-shrink-0 sm:h-14 sm:w-14"
          style={{ filter: "brightness(0) invert(1)" }}
        />
        <div className="min-w-0">
          <p className="text-2xl font-black text-[#f1f5f9] sm:text-3xl">Parametra</p>
          <p className="text-xs text-[#94a3b8] sm:text-sm">Design-intent capture for parametric CAD.</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:ml-auto sm:flex-shrink-0">
          <span className="rounded-full bg-[#2563eb] px-4 py-1.5 text-xs font-medium text-white">
            Pull from Onshape…
          </span>
          <span className="rounded-full bg-[#22262e] px-4 py-1.5 text-xs font-medium text-[#e2e8f0]">
            Open capture…
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <StatCard label="documents"    value={String(docCount)} dot="#3b82f6" />
        <StatCard label="fetches today" value={String(docCount)} dot="#22c55e" />
        <StatCard label="total fetches" value={String(docCount)} dot="#a78bfa" />
        <StatCard label="systems"      value={docCount > 0 ? "1" : "0"} dot="#f59e0b" />
      </div>

      {/* Documents + capture details */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#1c2027] bg-[#12151b] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#4b5563]">Documents</p>
          <div className="mt-2 space-y-1.5">
            {docCount === 0 && (
              <p className="py-6 text-center text-xs text-[#4b5563]">No documents fetched yet</p>
            )}
            {DOCUMENTS.slice(0, docCount).map((doc, i) => (
              <div
                key={doc.id}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 animate-fade-in ${
                  i === 0 ? "bg-[#182335] border border-[#2c405f]" : "border border-transparent"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-[#f1f5f9]">{doc.name}</p>
                  <p className="text-[10px] text-[#64748b]">Onshape</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-[10px] text-[#94a3b8]">{doc.fetches}</p>
                  <p className="text-[10px] text-[#64748b]">{doc.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#1c2027] bg-[#12151b] p-4">
          {docCount === 0 ? (
            <p className="py-6 text-center text-xs text-[#4b5563]">Select a document to see its capture</p>
          ) : (
            <div className="animate-fade-in">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="min-w-0 flex-1 truncate text-sm font-bold text-[#f1f5f9]">
                  {DOCUMENTS[0].name}
                </p>
                <div className="flex flex-shrink-0 gap-2">
                  <span className="rounded-full bg-[#22262e] px-3 py-1 text-[10px] font-medium text-[#e2e8f0]">Repull</span>
                  <span className="rounded-full bg-[#22262e] px-3 py-1 text-[10px] font-medium text-[#e2e8f0]">Open latest capture</span>
                </div>
              </div>
              <p className="mt-1 text-[11px] text-[#64748b]">branches: main · Onshape</p>

              <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#4b5563]">Part Studios</p>
              <div className="mt-1.5 space-y-1 border-b border-[#1c2027] pb-3">
                {studioCount === 0 && (
                  <p className="py-2 text-[11px] text-[#4b5563]">Reading Part Studios…</p>
                )}
                {PART_STUDIOS.slice(0, studioCount).map(ps => (
                  <div key={ps.id} className="flex items-center gap-2 py-1 animate-fade-in">
                    <p className="min-w-0 flex-1 truncate text-xs text-[#e2e8f0]">{ps.name}</p>
                    <span className="flex-shrink-0 text-[10px] text-[#64748b]">{ps.meta}</span>
                    <StatusPill status={ps.status} />
                  </div>
                ))}
              </div>

              <div className="mt-3 flex gap-3">
                <svg viewBox="0 0 24 48" className="h-12 w-6 flex-shrink-0" aria-hidden>
                  <path d="M18 6 C18 20 6 22 6 40" stroke="#2dd4bf" strokeWidth="2" fill="none" />
                  <circle cx="18" cy="6" r="3.5" fill="#0d1015" stroke="#2dd4bf" strokeWidth="2" />
                  <circle cx="6" cy="40" r="3.5" fill="#0d1015" stroke="#2dd4bf" strokeWidth="2" />
                </svg>
                <div className="min-w-0 flex-1 space-y-2.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-xs font-medium text-[#f1f5f9]">2 Part Studios</p>
                    <p className="flex-shrink-0 text-[10px] text-[#64748b]">Onshape · 13:28</p>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-xs font-medium text-[#f1f5f9]">Session opened</p>
                    <p className="flex-shrink-0 text-[10px] text-[#64748b]">main · 13:28</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <FetchHeatmap />
    </div>
  );
}

function GraphView({ chipCount, nodeCount }: { chipCount: number; nodeCount: number }) {
  const shownIndex = new Map(GRAPH_NODES.map((n, i) => [n.id, i]));

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <StatCard label="features"  value="1" />
        <StatCard label="sketches"  value="1" />
        <StatCard label="variables" value="6" />
        <StatCard label="rebuild"   value="partial" amber />
      </div>

      {/* Workflow panel */}
      <div className="rounded-2xl border border-[#1c2027] bg-[#12151b] p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="text-base font-bold text-[#f1f5f9] sm:text-lg">Example Workflow</p>
          <span className="rounded-full bg-[#22262e] px-3 py-1 text-[11px] font-medium text-[#e2e8f0]">Open capture</span>
          <span className="rounded-full bg-[#22262e] px-3 py-1 text-[11px] font-medium text-[#e2e8f0]">Grab all</span>
          <div className="hidden items-center gap-2 md:flex">
            <span className="text-[11px] text-[#94a3b8]">confidence</span>
            <span className="relative block h-1 w-32 rounded-full bg-[#3b82f6]">
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-[#3b82f6]" />
            </span>
            <span className="text-[11px] text-[#e2e8f0]">1.00</span>
          </div>
          <p className="ml-auto text-right text-[11px] text-[#94a3b8]">
            {DOCUMENTS.length} documents · 2 references{"  "}
            <span className="text-[#e2e8f0]">
              {GRAPH_NODES.length} nodes · {GRAPH_EDGES.length} edges
            </span>
          </p>
        </div>

        {/* Session chips */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto border-b border-[#1c2027] pb-3">
          <span className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#4b5563]">
            Read this session
          </span>
          {SESSION_CHIPS.slice(0, chipCount).map(chip => (
            <span
              key={chip}
              className="max-w-[200px] flex-shrink-0 truncate rounded-lg border border-[#2c3340] bg-[#171a20] px-3 py-1.5 text-[11px] text-[#cbd5e1] animate-fade-in"
            >
              {chip}
            </span>
          ))}
        </div>

        {/* Graph canvas */}
        <div className="relative mt-3">
          <svg viewBox="0 0 1000 560" className="w-full" aria-label="Intent graph">
            {GRAPH_EDGES.map(edge => {
              const a = GRAPH_NODES[shownIndex.get(edge.from)!];
              const b = GRAPH_NODES[shownIndex.get(edge.to)!];
              const visible =
                (shownIndex.get(edge.from) ?? 99) < nodeCount &&
                (shownIndex.get(edge.to) ?? 99) < nodeCount;
              return (
                <line
                  key={`${edge.from}-${edge.to}`}
                  x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke={edge.accent ? "#a78bfa" : "#343b46"}
                  strokeWidth={edge.accent ? 2 : 1.2}
                  strokeDasharray={edge.accent ? undefined : "2 6"}
                  style={{ opacity: visible ? (edge.accent ? 0.9 : 1) : 0, transition: "opacity 500ms ease" }}
                />
              );
            })}
            {GRAPH_NODES.map((node, i) => {
              const s = NODE_STYLE[node.kind];
              return (
                <g key={node.id} style={{ opacity: i < nodeCount ? 1 : 0, transition: "opacity 500ms ease" }}>
                  <circle cx={node.x} cy={node.y} r={s.r} fill={s.color} />
                  <text
                    x={node.x}
                    y={node.y + s.r + 16}
                    textAnchor="middle"
                    fill="#9ca3af"
                    fontSize="13"
                    fontFamily="var(--font-lato), sans-serif"
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Help card */}
          <div className="absolute right-0 top-2 hidden w-60 rounded-xl border border-[#232830] bg-[#171b22]/95 p-4 text-xs leading-5 text-[#94a3b8] lg:block">
            Double-click a folder to open it, a document to read every Part Studio in it,
            or one Part Studio to read just that. Lines between documents are dependencies
            a capture found.
          </div>
        </div>

        {/* Legend */}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          {LEGEND.map(l => (
            <span key={l.label} className="flex items-center gap-1.5 text-[11px] text-[#94a3b8]">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} />
              {l.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function HistoryView({
  events,
  scrollRef,
}: {
  events: HistoryEvent[];
  scrollRef: React.Ref<HTMLDivElement>;
}) {
  return (
    <div className="flex h-full min-h-[320px] flex-col rounded-2xl border border-[#1c2027] bg-[#12151b] p-4 sm:p-5">
      <p className="text-sm font-bold text-[#f1f5f9]">History</p>
      <p className="text-[11px] text-[#64748b]">Session events · this capture</p>
      <div ref={scrollRef} className="mt-3 flex-1 space-y-1 overflow-y-auto">
        {events.length === 0 && (
          <p className="py-6 text-center text-xs text-[#4b5563]">No events yet — pull from Onshape to begin</p>
        )}
        {events.map((e, i) => (
          <div key={i} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 animate-fade-in">
            <span
              className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
              style={{
                backgroundColor:
                  e.level === "ok" ? "#22c55e" : e.level === "warn" ? "#fbbf24" : "#64748b",
              }}
            />
            <p className="min-w-0 flex-1 truncate text-xs text-[#cbd5e1]">{e.text}</p>
            <span className="flex-shrink-0 font-mono text-[10px] text-[#4b5563]">{e.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
