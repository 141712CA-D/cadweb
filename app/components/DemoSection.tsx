"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
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

const InterCadPanel = dynamic(() => import("./InterCadPanel"), { ssr: false });

// ── Types ─────────────────────────────────────────────────────────────────────

type MsgType = "user" | "thinking" | "assistant" | "result" | "status";
interface Msg {
  id: string;
  type: MsgType;
  text?: string;
  lines?: string[];
}

interface Step {
  delay: number;
  show?: string[];
  features?: string[];
  typing?: boolean;
}

// ── Data ──────────────────────────────────────────────────────────────────────
//
// The live demo plays ONE scripted run: the Inter-CAD transfer
// (TRANSFER_MESSAGES / TRANSFER_SCRIPT / TRANSFER_LOG_LINES). The middle
// panel's Inter-CAD breakdown builds progressively in step with it via the
// `stage` prop on InterCadPanel.
//
// The text-to-CAD generation data below (MESSAGES / SCRIPT / FEATURES /
// VAR_GROUPS / LOG_LINES) is intentionally NOT wired into the live demo
// anymore — it's kept exported for the data-invariant tests and for reuse
// if the generation demo returns elsewhere.

// ── Text-to-CAD generation data (not surfaced in the live demo) ──────────────

export const MESSAGES: Msg[] = [
  {
    id: "u1",
    type: "user",
    text: "make in a new part studio a mug for my daily coffee",
  },
  {
    id: "think1",
    type: "thinking",
    lines: [
      'intent → new_part_studio: true, object: "mug"',
      "geometry class → revolve_with_handle",
      "missing params: height, base_dia, wall_thickness, handle",
    ],
  },
  {
    id: "a1",
    type: "assistant",
    text: "I'll set up a new Part Studio for your mug. A few quick questions:\n\n1. How tall? (typical: 85–105 mm)\n2. Base diameter? (typical: 65–80 mm)\n3. Wall thickness? I'll default to 4 mm if you're unsure.",
  },
  {
    id: "u2",
    type: "user",
    text: "about 95mm tall, 70mm base, default wall is fine",
  },
  {
    id: "think2",
    type: "thinking",
    lines: [
      "height=95.0 mm ✓",
      "base_dia=70.0 mm ✓",
      "wall=4.0 mm (default) ✓",
      "taper → mid_dia=82.0, top_dia=76.0",
    ],
  },
  {
    id: "a2",
    type: "assistant",
    text: "Got it — height, base, and wall locked in.\n\nLast thing: handle size? Standard grip is 12 mm wide × 55 mm tall.",
  },
  { id: "u3", type: "user", text: "standard handle works" },
  {
    id: "think3",
    type: "thinking",
    lines: [
      "handle_width=12.0 ✓  handle_height=55.0 ✓",
      "building feature tree…",
      "  Sketch_Base → Revolve1 → Shell1",
      "  Sketch_Handle → Extrude_Handle → Fillet1",
      "Onshape API → document created ✓",
    ],
  },
  { id: "result", type: "result" },
];

// icon: "sketch" | "plane" | "solid"
export const FEATURES: { id: string; name: string; icon: "sketch" | "plane" | "solid" }[] = [
  { id: "f1",  name: "BaseProfile",  icon: "sketch" },
  { id: "f2",  name: "MidPlane",     icon: "plane"  },
  { id: "f3",  name: "MidProfile",   icon: "sketch" },
  { id: "f4",  name: "TopPlane",     icon: "plane"  },
  { id: "f5",  name: "TopProfile",   icon: "sketch" },
  { id: "f6",  name: "MugBody",      icon: "solid"  },
  { id: "f7",  name: "MugHollow",    icon: "solid"  },
  { id: "f8",  name: "BaseRim",      icon: "solid"  },
  { id: "f9",  name: "TopRim",       icon: "solid"  },
  { id: "f10", name: "HandlePlane",  icon: "plane"  },
  { id: "f11", name: "HandleOuter",  icon: "sketch" },
  { id: "f12", name: "Handle",       icon: "solid"  },
];

export const VAR_GROUPS: { label: string; vars: [string, string, string][] }[] = [
  {
    label: "Body",
    vars: [
      ["base_dia",  "70.0", "mm"],
      ["mid_dia",   "82.0", "mm"],
      ["top_dia",   "76.0", "mm"],
      ["height",    "95.0", "mm"],
      ["wall",      "4.0",  "mm"],
    ],
  },
  {
    label: "Handle",
    vars: [
      ["handle_width",  "12.0", "mm"],
      ["handle_height", "55.0", "mm"],
      ["handle_offset", "20.0", "mm"],
      ["handle_depth",  "10.0",  "mm"],
    ],
  },
];

// Recent documents. "Daily Mug" is the transferred document — it's the active
// one because the transfer is the primary demo.
const HISTORY = [
  { id: "transfer", label: "Daily Mug",          sub: "Fusion 360 → Onshape" },
  { id: "bracket",  label: "M6_bracket_v2",      sub: "Part Studio"          },
  { id: "gear",     label: "spur_gear_set",      sub: "Assembly"             },
  { id: "clamp",    label: "shaft_clamp_30mm",   sub: "Part Studio"          },
];

export const SCRIPT: Step[] = [
  { delay: 700,   show: ["u1"] },
  { delay: 1500,  typing: true },
  { delay: 3200,  show: ["think1", "a1"], typing: false },
  { delay: 4600,  show: ["u2"] },
  { delay: 5400,  typing: true },
  { delay: 7200,  show: ["think2", "a2"], typing: false },
  { delay: 8600,  show: ["u3"] },
  { delay: 9400,  typing: true },
  { delay: 11000, show: ["think3"], features: ["f1","f2","f3","f4"], typing: false },
  { delay: 11800, features: ["f5","f6","f7","f8"] },
  { delay: 12600, features: ["f9","f10","f11","f12"] },
  { delay: 13600, show: ["result"] },
];

// ── Log lines (timed to match the script) ────────────────────────────────────
interface LogLine { t: number; level: "info" | "api" | "ok" | "warn"; text: string }
export const LOG_LINES: LogLine[] = [
  { t: 700,   level: "info", text: '[NLM]  parsing → intent=new_part_studio, object="mug"' },
  { t: 900,   level: "info", text: "[NLM]  geometry class → revolve_with_handle" },
  { t: 1100,  level: "info", text: "[NLM]  missing params: height, base_dia, wall, handle" },
  { t: 3200,  level: "info", text: "[INTERP] emitting clarification request (3 params)" },
  { t: 4600,  level: "info", text: "[NLM]  user reply → height=95mm, base_dia=70mm, wall=default" },
  { t: 4800,  level: "info", text: "[INTERP] resolved: height=95.0 base_dia=70.0 wall=4.0" },
  { t: 5000,  level: "info", text: "[INTERP] computing taper: mid_dia=82.0 top_dia=76.0" },
  { t: 7200,  level: "info", text: "[INTERP] emitting clarification request (1 param)" },
  { t: 8600,  level: "info", text: "[NLM]  user reply → handle=standard" },
  { t: 8800,  level: "info", text: "[INTERP] resolved: handle_width=12.0 handle_height=55.0" },
  { t: 9000,  level: "info", text: "[REASON] building feature tree…" },
  { t: 9200,  level: "info", text: "[EXEC]  POST /api/documents  → 200 OK  (doc_id: d3361738f)" },
  { t: 9400,  level: "api",  text: "[EXEC]  POST /api/partstudios/d3361738f/features  (BaseProfile)" },
  { t: 9600,  level: "ok",   text: "        ↳ 200  feature_id=fid_001  t=143ms" },
  { t: 9800,  level: "api",  text: "[EXEC]  POST /api/partstudios/d3361738f/features  (MidPlane)" },
  { t: 9950,  level: "ok",   text: "        ↳ 200  feature_id=fid_002  t=98ms" },
  { t: 10100, level: "api",  text: "[EXEC]  POST /api/partstudios/d3361738f/features  (MidProfile)" },
  { t: 10250, level: "ok",   text: "        ↳ 200  feature_id=fid_003  t=112ms" },
  { t: 10400, level: "api",  text: "[EXEC]  POST /api/partstudios/d3361738f/features  (TopPlane)" },
  { t: 10530, level: "ok",   text: "        ↳ 200  feature_id=fid_004  t=91ms" },
  { t: 10650, level: "api",  text: "[EXEC]  POST /api/partstudios/d3361738f/features  (TopProfile)" },
  { t: 10780, level: "ok",   text: "        ↳ 200  feature_id=fid_005  t=105ms" },
  { t: 10900, level: "api",  text: "[EXEC]  POST /api/partstudios/d3361738f/features  (MugBody)" },
  { t: 11050, level: "ok",   text: "        ↳ 200  feature_id=fid_006  t=187ms" },
  { t: 11200, level: "api",  text: "[EXEC]  POST /api/partstudios/d3361738f/features  (MugHollow)" },
  { t: 11360, level: "ok",   text: "        ↳ 200  feature_id=fid_007  t=203ms" },
  { t: 11500, level: "api",  text: "[EXEC]  POST /api/partstudios/d3361738f/features  (BaseRim)" },
  { t: 11640, level: "ok",   text: "        ↳ 200  feature_id=fid_008  t=134ms" },
  { t: 11800, level: "api",  text: "[EXEC]  POST /api/partstudios/d3361738f/features  (TopRim)" },
  { t: 11940, level: "ok",   text: "        ↳ 200  feature_id=fid_009  t=129ms" },
  { t: 12100, level: "api",  text: "[EXEC]  POST /api/partstudios/d3361738f/features  (HandlePlane)" },
  { t: 12230, level: "ok",   text: "        ↳ 200  feature_id=fid_010  t=88ms" },
  { t: 12380, level: "api",  text: "[EXEC]  POST /api/partstudios/d3361738f/features  (HandleOuter)" },
  { t: 12510, level: "ok",   text: "        ↳ 200  feature_id=fid_011  t=118ms" },
  { t: 12660, level: "api",  text: "[EXEC]  POST /api/partstudios/d3361738f/features  (Handle)" },
  { t: 12800, level: "ok",   text: "        ↳ 200  feature_id=fid_012  t=211ms" },
  { t: 13000, level: "api",  text: "[EXEC]  POST /api/variables/d3361738f  (9 vars)" },
  { t: 13150, level: "ok",   text: "        ↳ 200  variables bound  t=74ms" },
  { t: 13400, level: "ok",   text: "[DONE]  12 features · 9 variables · total=4.2s" },
];

// ── Primary run: Inter-CAD transfer conversation ─────────────────────────────

export const TRANSFER_MESSAGES: Msg[] = [
  {
    id: "tu1",
    type: "user",
    text: "transfer my Daily Mug model from Fusion360 to Onshape",
  },
  {
    id: "tstatus",
    type: "status",
    lines: [
      "finding project",
      "gathering intent web",
      'mapping direct feature conversions into new onshape document called "Daily Mug"',
      "replicating non-direct features",
      "processed model",
    ],
  },
  {
    id: "ta1",
    type: "assistant",
    text: "Daily Mug is now live in Onshape — 7 features carried over directly, 6 replicated to match Onshape's feature set.\n\nOpen the breakdown on the left to see exactly how each Fusion feature translated, and drag through the intent web to explore the mapping.",
  },
  { id: "tresult", type: "result" },
];

interface TransferStep { delay: number; show?: string[]; statusLines?: number; typing?: boolean }

export const TRANSFER_SCRIPT: TransferStep[] = [
  { delay: 400,  show: ["tu1"] },
  { delay: 1200, typing: true },
  { delay: 2400, show: ["tstatus"], typing: false },
  { delay: 2500, statusLines: 1 },
  { delay: 3600, statusLines: 2 },
  { delay: 5000, statusLines: 3 },
  { delay: 6300, statusLines: 4 },
  { delay: 7500, statusLines: 5 },
  { delay: 8300, show: ["ta1"] },
  { delay: 9200, show: ["tresult"] },
];

// Log lines for the transfer run — timed against TRANSFER_SCRIPT so the Logs
// tab stays in step with the conversation.
export const TRANSFER_LOG_LINES: LogLine[] = [
  { t: 400,  level: "info", text: '[NLM]  parsing → intent=inter_cad_transfer, object="Daily Mug"' },
  { t: 600,  level: "info", text: "[NLM]  source=fusion360  target=onshape" },
  { t: 900,  level: "info", text: '[SCAN] locating project "Daily Mug" in Fusion 360 hub' },
  { t: 2500, level: "api",  text: "[SCAN] GET /f360/projects/daily-mug/timeline" },
  { t: 2700, level: "ok",   text: "        ↳ 200  13 timeline nodes  t=214ms" },
  { t: 3600, level: "info", text: "[INTENT] lifting timeline → software-neutral intent web" },
  { t: 3800, level: "info", text: "[INTENT] resolved 13 nodes · 21 dependency edges" },
  { t: 4100, level: "warn", text: "[INTENT] 3 inline sketch planes have no Onshape equivalent" },
  { t: 4300, level: "warn", text: "[INTENT] 2 implicit fillet edge loops need re-derivation" },
  { t: 5000, level: "info", text: "[MAP]  direct conversions → 7 features" },
  { t: 5100, level: "api",  text: "[EXEC] POST /api/documents  (Daily Mug)" },
  { t: 5200, level: "ok",   text: "        ↳ 200  doc_id=a91c4b7e2  t=168ms" },
  { t: 5300, level: "api",  text: "[EXEC] Sketch1 → BaseProfile" },
  { t: 5380, level: "ok",   text: "        ↳ 200  feature_id=fid_001  t=141ms" },
  { t: 5460, level: "api",  text: "[EXEC] Sketch2 → MidProfile" },
  { t: 5540, level: "ok",   text: "        ↳ 200  feature_id=fid_002  t=118ms" },
  { t: 5620, level: "api",  text: "[EXEC] Sketch3 → TopProfile" },
  { t: 5700, level: "ok",   text: "        ↳ 200  feature_id=fid_003  t=124ms" },
  { t: 5780, level: "api",  text: "[EXEC] Sketch4 → HandleOuter" },
  { t: 5860, level: "ok",   text: "        ↳ 200  feature_id=fid_004  t=109ms" },
  { t: 5940, level: "api",  text: "[EXEC] Revolve1 → MugBody" },
  { t: 6020, level: "ok",   text: "        ↳ 200  feature_id=fid_005  t=203ms" },
  { t: 6100, level: "api",  text: "[EXEC] Shell1 → MugHollow" },
  { t: 6180, level: "ok",   text: "        ↳ 200  feature_id=fid_006  t=176ms" },
  { t: 6260, level: "api",  text: "[EXEC] Extrude1 → Handle" },
  { t: 6340, level: "ok",   text: "        ↳ 200  feature_id=fid_007  t=152ms" },
  { t: 6440, level: "info", text: "[REPL] 6 features have no direct equivalent — replicating" },
  { t: 6560, level: "api",  text: "[REPL] inline sketch plane (Mid) ⇢ MidPlane" },
  { t: 6660, level: "ok",   text: "        ↳ 200  feature_id=fid_008  t=96ms" },
  { t: 6780, level: "api",  text: "[REPL] inline sketch plane (Top) ⇢ TopPlane" },
  { t: 6880, level: "ok",   text: "        ↳ 200  feature_id=fid_009  t=91ms" },
  { t: 7000, level: "api",  text: "[REPL] inline sketch plane (Handle) ⇢ HandlePlane" },
  { t: 7100, level: "ok",   text: "        ↳ 200  feature_id=fid_010  t=88ms" },
  { t: 7220, level: "api",  text: "[REPL] implicit fillet loop (Base) ⇢ BaseRim" },
  { t: 7340, level: "ok",   text: "        ↳ 200  feature_id=fid_011  t=187ms" },
  { t: 7460, level: "api",  text: "[REPL] implicit fillet loop (Top) ⇢ TopRim" },
  { t: 7580, level: "ok",   text: "        ↳ 200  feature_id=fid_012  t=174ms" },
  { t: 7700, level: "api",  text: "[REPL] appearance · Ceramic Gloss ⇢ part property" },
  { t: 7820, level: "ok",   text: "        ↳ 200  applied  t=64ms" },
  { t: 7960, level: "info", text: "[VERIFY] rebuild regenerated clean — 0 errors, 0 warnings" },
  { t: 8100, level: "ok",   text: "[DONE]  13 features mapped · 7 direct · 6 replicated · total=8.1s" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function DemoSection() {
  const sectionRef  = useRef<HTMLDivElement>(null);
  const chatRef     = useRef<HTMLDivElement>(null);
  const startedRef  = useRef(false);
  const lockedRef   = useRef(false);

  // Always start empty (SSR-safe) — fast-forward to complete state in useEffect if already played
  const [started,      setStarted]      = useState(false);
  const [expandedSet,  setExpandedSet]  = useState<Set<string>>(new Set());
  const [activeTab,    setActiveTab]    = useState<"conversation" | "logs">("conversation");
  const [visibleLogs,  setVisibleLogs]  = useState<LogLine[]>([]);
  const [shelfOpen,    setShelfOpen]    = useState(false);

  // Primary run — Inter-CAD transfer (played by the start gate)
  const [visibleTransferMsgs, setVisibleTransferMsgs] = useState<Set<string>>(new Set());
  const [transferTyping,     setTransferTyping]     = useState(false);
  const [statusLineCount,    setStatusLineCount]    = useState(0);
  const [transferDone,       setTransferDone]       = useState(false);

  // Phone-only equivalent of the desktop cursor hint — the breakdown panel
  // lives behind the hamburger shelf on mobile, so instead of a click-through
  // sequence we just point at the hamburger once.
  const [showMobileHint,     setShowMobileHint]     = useState(false);

  const logsRef       = useRef<HTMLDivElement>(null);
  const logsTabRef    = useRef<HTMLButtonElement>(null);
  const convTabRef    = useRef<HTMLButtonElement>(null);
  const cursorRunning = useRef(false);

  // ── Device flight ──────────────────────────────────────────────────────────
  // The window rides a 3D arc through the section: in from the back-left as a
  // MacBook/phone, docked while it's readable, then outward past the camera.
  const flyRef  = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  // Which shell flies in. Laptop is the SSR default; the shell is invisible at
  // rest (--chrome: 0), so correcting it on mount can't flash.
  const [device, setDevice] = useState<DeviceKind>("laptop");

  // Ref mirrors state so the async cursor animation reads fresh values
  // even if the user interacts between transferDone and the animation starting.
  const activeTabRef = useRef(activeTab);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

  // Cursor animation state (desktop-only hint)
  const [cursor, setCursor] = useState({ x: 0, y: 0, visible: false, tooltip: "", clicking: false });

  // On mount: if the demo already played this session, fast-forward the
  // transfer run to its complete state immediately.
  useEffect(() => {
    if (sessionStorage.getItem("demoAnimPlayed") !== "true") return;
    startedRef.current = true;
    setStarted(true);
    setVisibleTransferMsgs(new Set(TRANSFER_MESSAGES.map(m => m.id)));
    setStatusLineCount(
      TRANSFER_MESSAGES.find(m => m.type === "status")?.lines?.length ?? 0,
    );
    setVisibleLogs(TRANSFER_LOG_LINES);
    setTransferDone(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Scroll chat pane to bottom on new content
  useEffect(() => {
    const el = chatRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [visibleTransferMsgs, transferTyping, statusLineCount]);

  // Scroll logs pane to bottom
  useEffect(() => {
    const el = logsRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [visibleLogs]);

  // The demo is gated behind an explicit start button — it never auto-plays on
  // scroll. Clicking snaps the section into view, locks scroll, and runs the
  // Inter-CAD transfer conversation; scroll unlocks when the run completes.
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
      ...TRANSFER_SCRIPT.map(s => s.delay),
      ...TRANSFER_LOG_LINES.map(l => l.t),
    );

    TRANSFER_SCRIPT.forEach((step, i) => {
      setTimeout(() => {
        if (step.typing !== undefined) setTransferTyping(step.typing);
        if (step.show?.length) {
          setVisibleTransferMsgs(prev => {
            const n = new Set(prev);
            step.show!.forEach(id => n.add(id));
            return n;
          });
        }
        if (step.statusLines !== undefined) setStatusLineCount(step.statusLines);
        if (i === TRANSFER_SCRIPT.length - 1) setTransferDone(true);
      }, step.delay);
    });

    TRANSFER_LOG_LINES.forEach(line => {
      setTimeout(() => {
        setVisibleLogs(prev => [...prev, line]);
      }, line.t);
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
  // Every phase is about the Inter-CAD transfer that just played: the derived
  // feature breakdown, the transfer log, and the intent web.
  useEffect(() => {
    if (!transferDone) return;
    // Phones have no cursor hint at all (sidebar/panel targets live behind the
    // hamburger shelf there) — point at the hamburger once instead of running
    // the desktop click-through sequence.
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      if (sessionStorage.getItem("mobileHamburgerHintPlayed") !== "true") {
        sessionStorage.setItem("mobileHamburgerHintPlayed", "true");
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

    // Inter-CAD targets live in a scrollable panel, so a target can sit below
    // the fold. Bring it into view (the body itself is locked, so only the
    // panel scrolls) and let the scroll settle before measuring its rect.
    const ensureVisible = async (el: HTMLElement | null) => {
      if (!el) return;
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
      await sleep(450);
    };

    // A single click phase: move to an element, show tooltip, click, run the action, dwell.
    const clickPhase = async (
      el: HTMLElement | null,
      tooltip: string,
      action: () => void,
      opts: { firstMove?: boolean; dwellAfter?: number } = {},
    ) => {
      if (!el) return;
      await ensureVisible(el);
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

    // Like clickPhase, but only points + shows the tooltip — never clicks and
    // never runs an action. Starting the second demo must be a genuine user click.
    const hoverPhase = async (
      el: HTMLElement | null,
      tooltip: string,
      opts: { firstMove?: boolean; dwellAfter?: number } = {},
    ) => {
      if (!el) return;
      await ensureVisible(el);
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
      await sleep(opts.dwellAfter ?? 2400);
    };

    const run = async () => {
      cursorRunning.current = true;
      await sleep(2000);

      // Read fresh state at animation start
      const startedOnLogs = activeTabRef.current === "logs";

      // The breakdown accordions live inside InterCadPanel and own their state,
      // so the tour dispatches a real DOM click rather than setting state here.
      const derivedBtn = document.querySelector<HTMLElement>('[data-intercad-btn="derived"]');
      const derivedAlreadyOpen = derivedBtn?.getAttribute("aria-expanded") === "true";

      let first = true;
      const step = async (
        ref: HTMLElement | null,
        tooltip: string,
        action: () => void,
        dwellAfter?: number,
      ) => {
        await clickPhase(ref, tooltip, action, { firstMove: first, dwellAfter });
        first = false;
      };

      // Phase A — if the user wandered onto the Logs tab mid-run, bring them
      // back to the conversation first (and skip the "show logs" phase later).
      if (startedOnLogs) {
        await step(
          convTabRef.current,
          "back to the transfer",
          () => setActiveTab("conversation"),
          1400,
        );
      }

      // Phase B — open the derived/non-direct breakdown: the part of the
      // transfer that isn't a 1:1 feature swap, and the reason this is hard.
      if (!derivedAlreadyOpen) {
        await step(
          derivedBtn,
          "features with no direct equivalent",
          () => derivedBtn?.click(),
          2400,
        );
      }

      // Phase C — the transfer log, feature by feature.
      if (!startedOnLogs) {
        await step(
          logsTabRef.current,
          "view the transfer log",
          () => setActiveTab("logs"),
          2400,
        );
      }

      // Phase D — the intent web: the software-neutral graph the transfer
      // was rebuilt from. Hover only; it's a 3D canvas the user should drive.
      await hoverPhase(
        document.querySelector<HTMLElement>("[data-intercad-web]"),
        "drag the intent web to explore",
        { firstMove: first, dwellAfter: 2600 },
      );
      first = false;

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transferDone]);

  const toggleThink = (id: string) =>
    setExpandedSet(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const visibleTransferItems = TRANSFER_MESSAGES.filter(m => visibleTransferMsgs.has(m.id));

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

            <div className="relative z-10 flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[#dbe6f5] bg-[#ffffff] shadow-2xl">
          {/* Start gate — the demo never auto-plays; the user launches it */}
          {!started && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-slate-100/85 backdrop-blur-[3px] px-4">
              <button
                onClick={startDemo}
                className="flex items-center gap-3 rounded-lg border border-[#3b82f6] bg-[#ffffff] px-6 py-3.5 text-sm font-medium text-[#3b82f6] transition-colors hover:bg-[#3b82f6] hover:text-white shadow-sm"
                style={{ boxShadow: "0 0 24px rgba(59,130,246,0.15)" }}
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
          <div className="flex items-center gap-4 px-4 py-2.5 border-b border-[#dbe6f5] bg-[#f8fafc] flex-shrink-0">
            {/* Phone only: hamburger + inline hint — fixed row height so the
                hint appearing/disappearing never nudges the title bar's height */}
            <div className="flex sm:hidden h-5 min-w-0 flex-1 items-center gap-2.5 overflow-hidden">
              <button
                className="flex flex-shrink-0 items-center gap-1.5"
                onClick={() => { setShelfOpen(true); setShowMobileHint(false); }}
                aria-label="Open file panel"
              >
                <span className="flex flex-col gap-1">
                  <span className={`block h-0.5 w-5 transition-colors ${showMobileHint ? "bg-[#3b82f6]" : "bg-[#64748b]"}`} />
                  <span className={`block h-0.5 w-5 transition-colors ${showMobileHint ? "bg-[#3b82f6]" : "bg-[#64748b]"}`} />
                  <span className={`block h-0.5 w-4 transition-colors ${showMobileHint ? "bg-[#3b82f6]" : "bg-[#64748b]"}`} />
                </span>
              </button>
              {showMobileHint && (
                <button
                  onClick={() => { setShelfOpen(true); setShowMobileHint(false); }}
                  className="flex min-w-0 flex-1 items-center gap-1.5 animate-fade-in"
                >
                  <span className="flex-shrink-0 text-[#3b82f6] leading-none animate-pulse">←</span>
                  <span className="min-w-0 flex-1 truncate text-[11px] leading-none text-[#3b82f6]">
                    Tap here to view the transfer breakdown
                  </span>
                </button>
              )}
            </div>
            {/* Tablet and up: traffic lights */}
            <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
              <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <div className="h-3 w-3 rounded-full bg-[#28c840]" />
            </div>
          </div>

          {/* App body — fills remaining window height; scrolls horizontally if the
              sidebar + middle panel + chat can't all fit (e.g. iPad widths) */}
          <div className="flex flex-1 min-h-0 overflow-x-auto">

            {/* ── Left sidebar ── */}
            <aside className="hidden sm:flex w-52 flex-shrink-0 flex-col border-r border-[#dbe6f5] bg-[#ffffff]">
            {/* Brand */}
            <div className="px-4 py-3 border-b border-[#dbe6f5] flex items-center gap-2">
              <span className="font-mono text-sm sm:text-xs text-[#3b82f6] tracking-[0.1em]">Parametra</span>
              <span className="font-mono text-[10px] sm:text-[8px] text-[#94a3b8]">v1.0</span>
            </div>

            {/* Nav */}
            <nav className="px-2 pt-3 space-y-px">
              {[
                { label: "Inter-CAD Transfer", active: true,  accent: "#06b6d4" },
                { label: "Documents",          active: false, accent: "#3b82f6" },
                { label: "Assemblies",         active: false, accent: "#3b82f6" },
                { label: "Variables",          active: false, accent: "#3b82f6" },
                { label: "Part Studios",       active: false, accent: "#3b82f6" },
              ].map(item => (
                <div
                  key={item.label}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm sm:text-xs select-none ${
                    item.active ? "bg-[#eef2f9] text-[#334155]" : "text-[#64748b]"
                  }`}
                >
                  <span
                    className="h-1 w-1 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.active ? item.accent : "#dbe6f5" }}
                  />
                  {item.label}
                </div>
              ))}
            </nav>

            {/* Design history */}
            <div className="px-2 pt-4">
              <p className="px-3 pb-2 text-[11px] sm:text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wide">
                Recent
              </p>
              {HISTORY.map(h => {
                const active = h.id === "transfer";
                return (
                  <div
                    key={h.id}
                    className={`rounded-md px-3 py-2.5 ${
                      active ? "bg-[#eef2f9] border-l-2 border-[#3b82f6]" : ""
                    }`}
                  >
                    <p
                      className={`text-sm sm:text-xs truncate ${
                        active ? "text-[#334155]" : "text-[#64748b]"
                      }`}
                    >
                      {h.label}
                    </p>
                    <p
                      className={`text-[11px] sm:text-[10px] ${
                        active ? "text-[#64748b]" : "text-[#94a3b8]"
                      }`}
                    >
                      {h.sub}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-auto p-4 border-t border-[#dbe6f5]">
              <p className="text-[11px] sm:text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wide">Settings</p>
            </div>
          </aside>

          {/* ── Middle: Inter-CAD breakdown / Part Studio panel ── */}
          <div
            className="hidden sm:flex flex-col border-r border-[#dbe6f5] bg-[#f8fafc]"
            style={{ width: "clamp(200px, 32%, 320px)", flexShrink: 0 }}
          >
            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-[#dbe6f5] px-3 py-2 flex-shrink-0">
              <span className="rounded-md px-3 py-1.5 text-xs sm:text-[11px] font-medium bg-[#eef2f9] text-[#0f172a]">
                Inter-CAD
              </span>
            </div>

            {/* Breakdown builds in step with the transfer conversation */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              <InterCadPanel stage={statusLineCount} />
            </div>

            {/* Status bar */}
            <div className="flex items-center gap-2 px-4 py-2 border-t border-[#dbe6f5]">
              <span
                className={`h-1.5 w-1.5 flex-shrink-0 ${
                  transferDone ? "bg-[#3b82f6]" : "bg-[#cbd5e1] animate-pulse"
                }`}
              />
              <span className="text-[11px] sm:text-[10px] text-[#94a3b8]">
                {transferDone ? "Transferred · 13 features mapped" : "Transferring…"}
              </span>
            </div>
          </div>

          {/* ── Right: Chat panel ── */}
          <div className="flex flex-col flex-1 min-w-[300px] bg-[#ffffff]">
            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-[#dbe6f5] px-4 py-2 flex-shrink-0">
              <button
                ref={convTabRef}
                onClick={() => setActiveTab("conversation")}
                className={`rounded-md px-3 py-1.5 text-xs sm:text-[11px] font-medium transition-colors ${
                  activeTab === "conversation"
                    ? "bg-[#eef2f9] text-[#0f172a]"
                    : "text-[#94a3b8] hover:text-[#475569] hover:bg-[#f1f5f9]"
                }`}
              >
                Conversation
              </button>
              <button
                ref={logsTabRef}
                onClick={() => setActiveTab("logs")}
                className={`rounded-md px-3 py-1.5 text-xs sm:text-[11px] font-medium transition-colors ${
                  activeTab === "logs"
                    ? "bg-[#eef2f9] text-[#0f172a]"
                    : "text-[#94a3b8] hover:text-[#475569] hover:bg-[#f1f5f9]"
                }`}
              >
                Logs
                {visibleLogs.length > 0 && (
                  <span className="ml-1.5 font-mono text-[10px] sm:text-[8px] text-[#64748b]">
                    {visibleLogs.length}
                  </span>
                )}
              </button>
            </div>

            {/* Conversation tab */}
            {activeTab === "conversation" && (
              <div ref={chatRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {visibleTransferItems.map(item => (
                  <ChatMessage
                    key={item.id}
                    item={item}
                    expanded={expandedSet.has(item.id)}
                    onToggle={() => toggleThink(item.id)}
                    statusLineCount={statusLineCount}
                  />
                ))}
                {transferTyping && (
                  <div className="flex items-center gap-2.5">
                    <PAvatar />
                    <div className="flex gap-1 pt-0.5">
                      {[0, 120, 240].map(d => (
                        <span
                          key={d}
                          className="h-1.5 w-1.5 rounded-full bg-[#3b82f6] animate-bounce"
                          style={{ animationDelay: `${d}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Logs tab */}
            {activeTab === "logs" && (
              <div ref={logsRef} className="flex-1 overflow-y-auto px-4 py-3 font-mono text-[11px] sm:text-[9px] leading-[1.8] space-y-0">
                {visibleLogs.map((line, i) => (
                  <p key={i} className={
                    line.level === "ok"   ? "text-[#3b82f6]" :
                    line.level === "api"  ? "text-[#06b6d4]" :
                    line.level === "warn" ? "text-[#d97706]" :
                                           "text-[#64748b]"
                  }>
                    {line.text}
                  </p>
                ))}
                {!transferDone && visibleLogs.length > 0 && (
                  <span className="text-[#3b82f6] animate-pulse">▌</span>
                )}
              </div>
            )}

            {/* Decorative input */}
            <div className="px-5 py-3 border-t border-[#dbe6f5] flex-shrink-0">
              <div className="flex items-center gap-2 rounded-lg border border-[#dbe6f5] bg-[#ffffff] px-3 py-2.5">
                <span className="flex-1 text-sm sm:text-xs text-[#94a3b8] select-none">
                  {!started
                    ? "Awaiting input…"
                    : !transferDone
                      ? "Demo in progress…"
                      : "Demo complete — scroll or swipe to return to the site"}
                </span>
                <span className="rounded-md text-[11px] sm:text-[10px] text-[#94a3b8] border border-[#dbe6f5] px-2 py-0.5">
                  ↑
                </span>
              </div>
            </div>
          </div>
        </div>

          {/* ── Mobile slide-in shelf ── */}
          {/* Backdrop */}
          <div
            className={`absolute inset-0 z-40 bg-slate-900/40 transition-opacity duration-300 sm:hidden ${
              shelfOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
            onClick={() => setShelfOpen(false)}
          />
          {/* Shelf panel */}
          <div
            className={`absolute top-0 left-0 z-50 h-full w-72 flex flex-col bg-[#ffffff] border-r border-[#dbe6f5] transition-transform duration-300 ease-out sm:hidden ${
              shelfOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#dbe6f5]">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm sm:text-xs text-[#3b82f6] tracking-[0.1em]">Parametra</span>
                <span className="font-mono text-[10px] sm:text-[8px] text-[#94a3b8]">v1.0</span>
              </div>
              <button onClick={() => setShelfOpen(false)} className="font-mono text-lg text-[#64748b] hover:text-[#334155] leading-none">×</button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto">
              {/* Nav */}
              <nav className="px-2 pt-3 space-y-px border-b border-[#dbe6f5] pb-3">
                {[
                  { label: "Inter-CAD Transfer", active: true,  accent: "#06b6d4" },
                  { label: "Documents",          active: false, accent: "#3b82f6" },
                  { label: "Assemblies",         active: false, accent: "#3b82f6" },
                  { label: "Variables",          active: false, accent: "#3b82f6" },
                  { label: "Part Studios",       active: false, accent: "#3b82f6" },
                ].map(item => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm sm:text-xs select-none ${
                      item.active ? "bg-[#eef2f9] text-[#334155]" : "text-[#64748b]"
                    }`}
                  >
                    <span className="h-1 w-1 rounded-full flex-shrink-0" style={{ backgroundColor: item.active ? item.accent : "#dbe6f5" }} />
                    {item.label}
                  </div>
                ))}
              </nav>

              {/* History */}
              <div className="px-2 pt-4 border-b border-[#dbe6f5] pb-4">
                <p className="px-3 pb-2 text-[11px] sm:text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wide">Recent</p>
                {HISTORY.map(h => {
                  const active = h.id === "transfer";
                  return (
                    <div
                      key={h.id}
                      className={`rounded-md px-3 py-2.5 ${active ? "bg-[#eef2f9] border-l-2 border-[#3b82f6]" : ""}`}
                    >
                      <p className={`text-sm sm:text-xs truncate ${active ? "text-[#334155]" : "text-[#64748b]"}`}>{h.label}</p>
                      <p className={`text-[11px] sm:text-[10px] ${active ? "text-[#64748b]" : "text-[#94a3b8]"}`}>{h.sub}</p>
                    </div>
                  );
                })}
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 border-b border-[#dbe6f5] px-3 py-2">
                <span className="rounded-md px-3 py-1.5 text-xs sm:text-[11px] font-medium bg-[#eef2f9] text-[#0f172a]">
                  Inter-CAD
                </span>
              </div>

              {/* Breakdown builds in step with the transfer conversation */}
              <div className="px-4 pt-4 pb-6">
                <InterCadPanel stage={statusLineCount} />
              </div>
            </div>
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
          className="fixed z-[999] transition-[left,top] duration-700 ease-out"
          style={{
            left: cursor.x,
            top: cursor.y,
            opacity: cursor.visible ? 1 : 0,
            transition: "left 0.7s ease-out, top 0.7s ease-out, opacity 0.3s ease",
          }}
        >
          {/* Cursor SVG */}
          <svg
            width="20" height="20" viewBox="0 0 20 20" fill="none"
            className={`transition-transform duration-100 ${cursor.clicking ? "scale-75" : "scale-100"}`}
            style={{ filter: "drop-shadow(0 1px 3px rgba(15,23,42,0.35))" }}
          >
            <path d="M4 2L4 15L7.5 11.5L10 17L12 16L9.5 10.5L14 10.5L4 2Z" fill="#0f172a" stroke="white" strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
          {/* Tooltip */}
          {cursor.tooltip && (
            <div
              className="absolute left-5 top-0 whitespace-nowrap rounded-md border border-[#3b82f6] bg-[#ffffff] px-2.5 py-1.5 text-[11px] sm:text-[10px] font-medium text-[#3b82f6] shadow-sm"
              style={{ boxShadow: "0 0 16px rgba(59,130,246,0.15)" }}
            >
              {cursor.tooltip}
            </div>
          )}
        </div>
      </div>

    </section>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PAvatar() {
  return (
    <div className="h-5 w-5 flex-shrink-0 rounded-full flex items-center justify-center bg-black overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.svg" alt="Parametra" className="h-3 w-3 object-contain" style={{ filter: "brightness(0) invert(1)" }} />
    </div>
  );
}

function ChatMessage({
  item,
  expanded,
  onToggle,
  statusLineCount = 0,
}: {
  item: Msg;
  expanded: boolean;
  onToggle: () => void;
  statusLineCount?: number;
}) {
  if (item.type === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[78%] rounded-lg border border-[#dbe6f5] bg-[#eef2f9] px-3 py-2">
          <p className="text-sm sm:text-xs text-[#1e293b] leading-relaxed">{item.text}</p>
        </div>
      </div>
    );
  }

  if (item.type === "thinking") {
    return (
      <button
        onClick={onToggle}
        data-thinking-btn={item.id}
        className="flex items-start gap-2 text-left w-full group"
      >
        <span
          className="text-[11px] text-[#64748b] group-hover:text-[#475569] transition-colors mt-px flex-shrink-0"
          style={{ display: "inline-block", transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          ▶
        </span>
        <div>
          <span className="text-xs sm:text-[11px] font-medium text-[#64748b] group-hover:text-[#475569] transition-colors">
            Thinking ({item.lines?.length} steps)
          </span>
          {expanded && (
            <div className="mt-1.5 border-l-2 border-[#dbe6f5] pl-2.5 space-y-0.5">
              {item.lines?.map((line, i) => (
                <p key={i} className="font-mono text-[11px] sm:text-[9px] text-[#64748b] leading-5">
                  {line}
                </p>
              ))}
            </div>
          )}
        </div>
      </button>
    );
  }

  if (item.type === "status") {
    return (
      <div className="flex items-start gap-2.5">
        <PAvatar />
        <div className="flex-1 space-y-0.5 pt-0.5">
          {item.lines?.slice(0, statusLineCount).map((line, i) => (
            <p key={i} className="font-mono text-xs sm:text-[10px] text-[#64748b] leading-5">
              <span className="text-[#3b82f6]">✓</span> {line}
            </p>
          ))}
          {statusLineCount < (item.lines?.length ?? 0) && (
            <p className="font-mono text-xs sm:text-[10px] text-[#64748b] leading-5">
              <span className="text-[#3b82f6] animate-pulse">▌</span>
            </p>
          )}
        </div>
      </div>
    );
  }

  if (item.type === "assistant") {
    return (
      <div className="flex items-start gap-2.5">
        <PAvatar />
        <div className="flex-1 max-w-[85%] space-y-2">
          {item.text?.split("\n\n").map((para, i) => (
            <p key={i} className="text-sm sm:text-xs text-[#334155] leading-relaxed">
              {para}
            </p>
          ))}
        </div>
      </div>
    );
  }

  if (item.type === "result") {
    const isTransfer = item.id === "tresult";
    return (
      <div className="flex items-start gap-2.5">
        <PAvatar />
        <div className="flex-1">
          <div className="rounded-lg border border-[#dbe6f5] bg-[#ffffff] p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs sm:text-[10px] text-[#3b82f6]">
                {isTransfer ? "✓ transferred" : "✓ built"}
              </span>
              <span className="text-[11px] sm:text-[10px] text-[#64748b]">
                {isTransfer ? "Daily Mug · Part Studio" : "mug_v1 · Part Studio"}
              </span>
            </div>
            <p className="text-xs sm:text-[11px] text-[#64748b] leading-5">
              {isTransfer ? (
                <>
                  7 direct · 6 replicated features
                  <br />
                  ↳ breakdown and intent web are in the panel to the left.
                </>
              ) : (
                <>
                  12 features · 9 live variables
                  <br />
                  ↳ edit any variable in Onshape and the part rebuilds.
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

