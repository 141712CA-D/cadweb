"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { lockScroll, unlockScroll } from "../../lib/scrollLock";

const MugModelViewer = dynamic(() => import("./MugModelViewer"), { ssr: false });
const InterCadPanel  = dynamic(() => import("./InterCadPanel"),  { ssr: false });

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

// Flat list for the mesh panel
const MUG_VARS: [string, string, string][] = VAR_GROUPS.flatMap(g => g.vars);

const HISTORY = [
  { id: "mug",     label: "mug_v1",           sub: "Part Studio", active: true  },
  { id: "bracket", label: "M6_bracket_v2",    sub: "Part Studio", active: false },
  { id: "gear",    label: "spur_gear_set",    sub: "Assembly",    active: false },
  { id: "clamp",   label: "shaft_clamp_30mm", sub: "Part Studio", active: false },
];

const INTER_CAD = { id: "intercad", label: "DailyMug.f3d", sub: "Fusion 360 · Ready to import" };

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

// ── Inter-CAD transfer conversation ──────────────────────────────────────────

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

// ── Component ─────────────────────────────────────────────────────────────────

export default function DemoSection() {
  const sectionRef  = useRef<HTMLDivElement>(null);
  const chatRef     = useRef<HTMLDivElement>(null);
  const startedRef  = useRef(false);
  const lockedRef   = useRef(false);

  // Always start empty (SSR-safe) — fast-forward to complete state in useEffect if already played
  const [started,      setStarted]      = useState(false);
  const [visibleMsgs,  setVisibleMsgs]  = useState<Set<string>>(new Set());
  const [visibleFeat,  setVisibleFeat]  = useState<Set<string>>(new Set());
  const [showTyping,   setShowTyping]   = useState(false);
  const [expandedSet,  setExpandedSet]  = useState<Set<string>>(new Set());
  const [showMesh,     setShowMesh]     = useState(false);
  const [animDone,     setAnimDone]     = useState(false);
  const [activeTab,    setActiveTab]    = useState<"conversation" | "logs">("conversation");
  const [visibleLogs,  setVisibleLogs]  = useState<LogLine[]>([]);
  const [expandedVars, setExpandedVars] = useState<Set<string>>(new Set(["Body"]));
  const [shelfOpen,    setShelfOpen]    = useState(false);

  // Inter-CAD transfer flow
  const [transferState,      setTransferState]      = useState<"idle" | "playing" | "done">("idle");
  const [visibleTransferMsgs, setVisibleTransferMsgs] = useState<Set<string>>(new Set());
  const [transferTyping,     setTransferTyping]     = useState(false);
  const [statusLineCount,    setStatusLineCount]    = useState(0);
  // Which middle-panel view is showing — independent of whether the transfer
  // has ever run, so the user can flip back to mug_v1 and return to the
  // Inter-CAD breakdown without re-playing the transfer conversation.
  const [activePanel,        setActivePanel]        = useState<"partStudio" | "interCad">("partStudio");
  const showInterCad = activePanel === "interCad";
  // Gates the "breathe blue" hint on the Inter-CAD button — on desktop this only
  // flips true once the cursor-hint sequence has finished pointing at it, so the
  // two hints never compete; on mobile (no cursor hint) it flips true immediately.
  const [cursorHintDone,     setCursorHintDone]     = useState(false);
  // Phone-only equivalent of the desktop cursor hint — the mesh view and
  // Inter-CAD nav live behind the hamburger shelf on mobile, so instead of a
  // click-through sequence we just point at the hamburger once.
  const [showMobileHint,     setShowMobileHint]     = useState(false);

  const logsRef       = useRef<HTMLDivElement>(null);
  const logsTabRef    = useRef<HTMLButtonElement>(null);
  const convTabRef    = useRef<HTMLButtonElement>(null);
  const meshBtnRef    = useRef<HTMLButtonElement>(null);
  const interCadRef   = useRef<HTMLButtonElement>(null);
  const cursorRunning = useRef(false);
  const transferLockedRef = useRef(false);

  // Refs mirror state so the async cursor animation reads fresh values
  // even if the user interacts between animDone and the animation starting.
  const activeTabRef   = useRef(activeTab);
  const expandedSetRef = useRef(expandedSet);
  const showMeshRef    = useRef(showMesh);
  const transferStateRef = useRef(transferState);
  useEffect(() => { activeTabRef.current   = activeTab;   }, [activeTab]);
  useEffect(() => { expandedSetRef.current = expandedSet; }, [expandedSet]);
  useEffect(() => { showMeshRef.current    = showMesh;    }, [showMesh]);
  useEffect(() => { transferStateRef.current = transferState; }, [transferState]);

  // Cursor animation state (desktop-only hint)
  const [cursor, setCursor] = useState({ x: 0, y: 0, visible: false, tooltip: "", clicking: false });

  // On mount: if demo already played this session, fast-forward to complete state immediately
  useEffect(() => {
    if (sessionStorage.getItem("demoAnimPlayed") !== "true") return;
    startedRef.current = true;
    setStarted(true);
    setVisibleMsgs(new Set(MESSAGES.map(m => m.id)));
    setVisibleFeat(new Set(FEATURES.map(f => f.id)));
    setVisibleLogs(LOG_LINES);
    setAnimDone(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll chat pane to bottom on new content
  useEffect(() => {
    const el = chatRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [visibleMsgs, showTyping, visibleTransferMsgs, transferTyping, statusLineCount]);

  // Scroll logs pane to bottom
  useEffect(() => {
    const el = logsRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [visibleLogs]);

  // The demo is gated behind an explicit start button — it never auto-plays on
  // scroll. Clicking snaps the section into view, locks scroll, and runs the
  // scripted conversation; scroll unlocks when the run completes.
  const startDemo = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    setStarted(true);

    // Snap instantly — "auto" would defer to the global `scroll-behavior: smooth`
    // CSS rule, and locking scroll right after would freeze body overflow
    // mid-animation, stranding the page wherever the smooth scroll had reached.
    sectionRef.current?.scrollIntoView({ behavior: "instant", block: "start" });

    lockScroll();
    lockedRef.current = true;

    const lastDelay = Math.max(...SCRIPT.map(s => s.delay), ...LOG_LINES.map(l => l.t));

    SCRIPT.forEach((step, i) => {
      setTimeout(() => {
        if (step.typing !== undefined) setShowTyping(step.typing);
        if (step.show?.length) {
          setVisibleMsgs(prev => {
            const n = new Set(prev);
            step.show!.forEach(id => n.add(id));
            return n;
          });
        }
        if (step.features?.length) {
          setVisibleFeat(prev => {
            const n = new Set(prev);
            step.features!.forEach(id => n.add(id));
            return n;
          });
        }
        if (i === SCRIPT.length - 1) setAnimDone(true);
      }, step.delay);
    });

    LOG_LINES.forEach(line => {
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

  // Never leave the page locked if the section unmounts mid-run
  useEffect(() => {
    return () => {
      if (lockedRef.current) { unlockScroll(); lockedRef.current = false; }
    };
  }, []);

  // Cursor hint animation — desktop only, runs once on first demo completion
  useEffect(() => {
    if (!animDone) return;
    // Phones have no cursor hint at all (sidebar/mesh targets live behind the
    // hamburger shelf there) — let the Inter-CAD button start breathing
    // immediately, and point at the hamburger once instead of running the
    // desktop click-through sequence.
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      setCursorHintDone(true);
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
    if (sessionStorage.getItem("cursorHintPlayed") === "true") {
      setCursorHintDone(true);
      return;
    }

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

    // Like clickPhase, but only points + shows the tooltip — never clicks and
    // never runs an action. The real transfer must be a genuine user click.
    const hoverPhase = async (
      el: HTMLElement | null,
      tooltip: string,
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
      await sleep(opts.dwellAfter ?? 2400);
    };

    const run = async () => {
      cursorRunning.current = true;
      await sleep(2000);

      // Read fresh state at animation start
      const startedOnLogs        = activeTabRef.current === "logs";
      const thinkingAlreadyOpen  = expandedSetRef.current.has("think1");
      const meshAlreadyOpen      = showMeshRef.current;

      // Build phase list adaptively.
      // - Started on logs: cursor first returns to Conversation (inverts default),
      //   skip the "switch to logs" phase (they've seen it).
      // - Started on conversation: default flow — expand thinking, then show logs.
      // Skip expand-thinking if it's already expanded; skip mesh if already open.
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

      if (startedOnLogs) {
        // Phase A: back to conversation
        await step(
          convTabRef.current,
          "back to conversation",
          () => setActiveTab("conversation"),
          1400,
        );
        // Phase B: expand thinking (if not already)
        if (!thinkingAlreadyOpen) {
          await step(
            document.querySelector<HTMLElement>('[data-thinking-btn="think1"]'),
            "expand thinking",
            () => setExpandedSet(prev => { const n = new Set(prev); n.add("think1"); return n; }),
          );
        }
        // Phase C: open mesh (if not already)
        if (!meshAlreadyOpen) {
          await step(
            meshBtnRef.current,
            "view the model locally",
            () => setShowMesh(true),
            1500,
          );
        }
        // Phase D: point at Inter-CAD import — hover only, never auto-clicked
        if (transferStateRef.current === "idle") {
          await hoverPhase(interCadRef.current, "View Inter-Cad Project", { firstMove: first });
          first = false;
        }
      } else {
        // Phase A: expand thinking (if not already)
        if (!thinkingAlreadyOpen) {
          await step(
            document.querySelector<HTMLElement>('[data-thinking-btn="think1"]'),
            "expand thinking",
            () => setExpandedSet(prev => { const n = new Set(prev); n.add("think1"); return n; }),
          );
        }
        // Phase B: switch to logs
        await step(
          logsTabRef.current,
          "view the interaction log",
          () => setActiveTab("logs"),
          2200,
        );
        // Phase C: open mesh (if not already)
        if (!meshAlreadyOpen) {
          await step(
            meshBtnRef.current,
            "view the model locally",
            () => setShowMesh(true),
            1500,
          );
        }
        // Phase D: point at Inter-CAD import — hover only, never auto-clicked
        if (transferStateRef.current === "idle") {
          await hoverPhase(interCadRef.current, "View Inter-Cad Project", { firstMove: first });
          first = false;
        }
      }

      setCursor(c => ({ ...c, visible: false, tooltip: "" }));
      sessionStorage.setItem("cursorHintPlayed", "true");
      setCursorHintDone(true);

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
  }, [animDone]);

  const toggleThink = (id: string) =>
    setExpandedSet(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const toggleVarGroup = (label: string) =>
    setExpandedVars(prev => {
      const n = new Set(prev);
      n.has(label) ? n.delete(label) : n.add(label);
      return n;
    });

  // Real user click (never auto-triggered by the cursor hint) — re-snaps the
  // page back onto the live demo, locks scroll, and replays the transfer
  // conversation in the same chat pane before swapping the middle panel.
  // Once the transfer has already run, clicking again just flips the middle
  // panel back to the Inter-CAD breakdown instead of re-playing the chat.
  const startTransfer = () => {
    if (transferState === "playing") return;
    if (transferState === "done") { setActivePanel("interCad"); return; }
    setTransferState("playing");

    // Snap instantly — "auto" would defer to the global `scroll-behavior: smooth`
    // CSS rule, and locking scroll right after would freeze body overflow
    // mid-animation, stranding the page wherever the smooth scroll had reached.
    sectionRef.current?.scrollIntoView({ behavior: "instant", block: "start" });
    setActiveTab("conversation");
    setShelfOpen(false);

    lockScroll();
    transferLockedRef.current = true;

    const lastDelay = Math.max(...TRANSFER_SCRIPT.map(s => s.delay));

    TRANSFER_SCRIPT.forEach(step => {
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
      }, step.delay);
    });

    setTimeout(() => {
      if (transferLockedRef.current) {
        unlockScroll();
        transferLockedRef.current = false;
      }
      setTransferState("done");
      setActivePanel("interCad");
    }, lastDelay + 400);
  };

  const visibleItems = MESSAGES.filter(m => visibleMsgs.has(m.id));
  const visibleTransferItems = TRANSFER_MESSAGES.filter(m => visibleTransferMsgs.has(m.id));

  return (
    <section
      id="live-demo"
      ref={sectionRef}
      className="relative bg-[#f8fafc] border-t border-[#dbe6f5]"
      style={{ height: "100svh" }}
    >

      {/* ── Solid-bg stage — the window floats inside this, inset with padding ── */}
      <div className="flex h-full w-full items-center justify-center p-3 sm:p-6 lg:p-10">
        <div className="relative flex h-full w-full max-w-[1400px] flex-col overflow-hidden rounded-2xl border border-[#dbe6f5] bg-[#ffffff] shadow-2xl">
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
                    Tap here to view the model & more demos
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
                { label: "Part Studios",       active: !showInterCad, accent: "#3b82f6", onClick: () => setActivePanel("partStudio") },
                { label: "Documents",          active: false,         accent: "#3b82f6", onClick: undefined },
                { label: "Assemblies",         active: false,         accent: "#3b82f6", onClick: undefined },
                { label: "Variables",          active: false,         accent: "#3b82f6", onClick: undefined },
                {
                  label: "Inter-CAD Transfer",
                  active: showInterCad,
                  accent: "#06b6d4",
                  onClick: transferState === "done" ? () => setActivePanel("interCad") : undefined,
                },
              ].map(item => (
                <div
                  key={item.label}
                  onClick={item.onClick}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm sm:text-xs select-none ${
                    item.onClick ? "cursor-pointer hover:bg-[#e2e8f0]" : ""
                  } ${
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
                const active = h.active && !showInterCad;
                const clickable = h.id === "mug";
                return (
                  <div
                    key={h.id}
                    onClick={clickable ? () => setActivePanel("partStudio") : undefined}
                    className={`rounded-md px-3 py-2.5 ${clickable ? "cursor-pointer hover:bg-[#e2e8f0]" : ""} ${
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

            {/* Inter-CAD import entry — user-initiated only, never auto-clicked */}
            <div className="px-2 pt-2 pb-2 border-t border-[#dbe6f5]">
              <p className="px-3 pb-2 pt-2 text-[11px] sm:text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wide">
                Inter-CAD
              </p>
              <button
                ref={interCadRef}
                onClick={startTransfer}
                disabled={transferState === "playing"}
                className={`w-full rounded-md text-left px-3 py-2.5 border transition-colors group ${
                  showInterCad
                    ? "border-blue-500 bg-blue-500/10"
                    : transferState === "idle" && cursorHintDone
                      ? "breathe-blue border-blue-300"
                      : "border-[#dbe6f5] hover:border-blue-300"
                }`}
              >
                <p className={`text-sm sm:text-xs truncate transition-colors ${
                  showInterCad ? "text-[#334155]" : "text-[#64748b] group-hover:text-[#334155]"
                }`}>
                  {INTER_CAD.label}
                </p>
                <p className={`text-[11px] sm:text-[10px] transition-colors ${
                  showInterCad ? "text-blue-600" : "text-[#64748b] group-hover:text-blue-600"
                }`}>
                  {INTER_CAD.sub}
                </p>
              </button>
            </div>

            <div className="mt-auto p-4 border-t border-[#dbe6f5]">
              <p className="text-[11px] sm:text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wide">Settings</p>
            </div>
          </aside>

          {/* ── Middle: Part Studio panel ── */}
          <div
            className="hidden sm:flex flex-col border-r border-[#dbe6f5] bg-[#f8fafc]"
            style={{ width: "clamp(200px, 32%, 320px)", flexShrink: 0 }}
          >
            {/* Tabs — Inter-CAD only exists once the transfer has been triggered */}
            <div className="flex items-center gap-1 border-b border-[#dbe6f5] px-3 py-2 flex-shrink-0">
              <button
                onClick={() => setActivePanel("partStudio")}
                className={`rounded-md px-3 py-1.5 text-xs sm:text-[11px] font-medium transition-colors ${
                  !showInterCad
                    ? "bg-[#eef2f9] text-[#0f172a]"
                    : "text-[#94a3b8] hover:text-[#475569] hover:bg-[#f1f5f9]"
                }`}
              >
                Model Gen
              </button>
              {transferState !== "idle" && (
                <button
                  onClick={() => setActivePanel("interCad")}
                  className={`rounded-md px-3 py-1.5 text-xs sm:text-[11px] font-medium transition-colors ${
                    showInterCad
                      ? "bg-[#eef2f9] text-[#0f172a]"
                      : "text-[#94a3b8] hover:text-[#475569] hover:bg-[#f1f5f9]"
                  }`}
                >
                  Inter-CAD
                </button>
              )}
            </div>

            {showInterCad ? (
              <div className="flex-1 overflow-y-auto px-4 py-3">
                <InterCadPanel />
              </div>
            ) : (
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              {/* Feature tree */}
              <div>
                <p className="text-[11px] sm:text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wide mb-2">
                  Feature Tree
                </p>
                <div className="space-y-0.5">
                  {FEATURES.map(f => (
                    <div
                      key={f.id}
                      className={`flex items-center gap-2 py-0.5 transition-all duration-400 ${
                        visibleFeat.has(f.id)
                          ? "opacity-100 translate-x-0"
                          : "opacity-0 -translate-x-2"
                      }`}
                    >
                      <FeatureIcon type={f.icon} />
                      <span className="font-mono text-xs sm:text-[10px] text-[#475569]">{f.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Variables — drill-down accordion */}
              {visibleMsgs.has("result") && (
                <div className="rounded-md border border-[#dbe6f5] bg-[#eef2f9] overflow-hidden">
                  <p className="px-3 pt-2.5 pb-1.5 text-[11px] sm:text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wide border-b border-[#dbe6f5]">
                    Live Variables
                  </p>
                  {VAR_GROUPS.map(group => (
                    <div key={group.label} className="border-b border-[#dbe6f5] last:border-0">
                      <button
                        onClick={() => toggleVarGroup(group.label)}
                        className="w-full flex items-center gap-1.5 px-3 py-2 hover:bg-[#e2e8f0] transition-colors"
                      >
                        <span
                          className="text-[10px] text-[#64748b] flex-shrink-0 transition-transform duration-150"
                          style={{ display: "inline-block", transform: expandedVars.has(group.label) ? "rotate(90deg)" : "rotate(0deg)" }}
                        >
                          ▶
                        </span>
                        <span className="text-xs sm:text-[11px] font-medium text-[#475569]">
                          {group.label}
                        </span>
                        <span className="ml-auto font-mono text-[10px] sm:text-[8px] text-[#94a3b8]">
                          {group.vars.length}
                        </span>
                      </button>
                      {expandedVars.has(group.label) && (
                        <div className="px-3 pb-2 space-y-1 border-t border-[#eef2f9]">
                          {group.vars.map(([name, val, unit]) => (
                            <div key={name} className="flex items-center justify-between py-0.5">
                              <span className="font-mono text-[11px] sm:text-[9px] text-[#64748b]">{name}</span>
                              <span className="font-mono text-[11px] sm:text-[9px] text-[#3b82f6]">
                                {val} <span className="text-[#94a3b8]">{unit}</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Mesh button / inline viewer */}
              {visibleMsgs.has("result") && (
                <>
                  {!showMesh ? (
                    <button
                      ref={meshBtnRef}
                      onClick={() => setShowMesh(true)}
                      className="w-full rounded-md flex items-center justify-center gap-1.5 border border-[#dbe6f5] hover:border-[#334155] bg-[#0f172a] hover:bg-black py-2 text-xs sm:text-[11px] font-medium text-white transition-colors"
                    >
                      ↗ View mesh model
                    </button>
                  ) : (
                    <div className="rounded-md overflow-hidden border border-black bg-black" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.25)" }}>
                      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10">
                        <span className="text-[11px] sm:text-[10px] font-medium text-white/80">
                          Local model
                        </span>
                        <button
                          onClick={() => setShowMesh(false)}
                          className="font-mono text-sm text-white/50 hover:text-white transition-colors leading-none"
                        >
                          ×
                        </button>
                      </div>
                      <div className="overflow-hidden" style={{ height: 240 }}>
                        <MugModelViewer />
                      </div>
                      <p className="px-3 py-1.5 text-[11px] sm:text-[10px] text-white/40">
                        Drag to rotate · scroll to zoom
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
            )}

            {/* Status bar */}
            <div className="flex items-center gap-2 px-4 py-2 border-t border-[#dbe6f5]">
              <span
                className={`h-1.5 w-1.5 flex-shrink-0 ${
                  (showInterCad ? transferState === "done" : animDone) ? "bg-[#3b82f6]" : "bg-[#cbd5e1] animate-pulse"
                }`}
              />
              <span className="text-[11px] sm:text-[10px] text-[#94a3b8]">
                {showInterCad
                  ? "Transferred · 13 features mapped"
                  : animDone ? "Complete · 6 features · 9 variables" : "Generating…"}
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
                {visibleItems.map(item => (
                  <ChatMessage
                    key={item.id}
                    item={item}
                    expanded={expandedSet.has(item.id)}
                    onToggle={() => toggleThink(item.id)}
                  />
                ))}
                {transferState !== "idle" && visibleTransferItems.length > 0 && (
                  <div className="flex items-center gap-2 py-1">
                    <div className="h-px flex-1 bg-[#dbe6f5]" />
                    <span className="text-[11px] sm:text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wide">Inter-CAD transfer</span>
                    <div className="h-px flex-1 bg-[#dbe6f5]" />
                  </div>
                )}
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
                {showTyping && (
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
                {!animDone && visibleLogs.length > 0 && (
                  <span className="text-[#3b82f6] animate-pulse">▌</span>
                )}
              </div>
            )}

            {/* Decorative input */}
            <div className="px-5 py-3 border-t border-[#dbe6f5] flex-shrink-0">
              <div className="flex items-center gap-2 rounded-lg border border-[#dbe6f5] bg-[#ffffff] px-3 py-2.5">
                <span className="flex-1 text-sm sm:text-xs text-[#94a3b8] select-none">
                  {animDone
                    ? "Design complete — scroll or swipe to return to the site"
                    : started
                      ? "Demo in progress…"
                      : "Awaiting input…"}
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
                  { label: "Part Studios",       active: !showInterCad, accent: "#3b82f6", onClick: () => setActivePanel("partStudio") },
                  { label: "Documents",          active: false,         accent: "#3b82f6", onClick: undefined },
                  { label: "Assemblies",         active: false,         accent: "#3b82f6", onClick: undefined },
                  { label: "Variables",          active: false,         accent: "#3b82f6", onClick: undefined },
                  {
                    label: "Inter-CAD Transfer",
                    active: showInterCad,
                    accent: "#06b6d4",
                    onClick: transferState === "done" ? () => setActivePanel("interCad") : undefined,
                  },
                ].map(item => (
                  <div
                    key={item.label}
                    onClick={item.onClick}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm sm:text-xs select-none ${item.onClick ? "cursor-pointer" : ""} ${
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
                  const active = h.active && !showInterCad;
                  const clickable = h.id === "mug";
                  return (
                    <div
                      key={h.id}
                      onClick={clickable ? () => setActivePanel("partStudio") : undefined}
                      className={`rounded-md px-3 py-2.5 ${clickable ? "cursor-pointer" : ""} ${active ? "bg-[#eef2f9] border-l-2 border-[#3b82f6]" : ""}`}
                    >
                      <p className={`text-sm sm:text-xs truncate ${active ? "text-[#334155]" : "text-[#64748b]"}`}>{h.label}</p>
                      <p className={`text-[11px] sm:text-[10px] ${active ? "text-[#64748b]" : "text-[#94a3b8]"}`}>{h.sub}</p>
                    </div>
                  );
                })}
              </div>

              {/* Inter-CAD import entry */}
              <div className="px-2 pt-4 border-b border-[#dbe6f5] pb-4">
                <p className="px-3 pb-2 text-[11px] sm:text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wide">Inter-CAD</p>
                <button
                  onClick={startTransfer}
                  disabled={transferState === "playing"}
                  className={`w-full rounded-md text-left px-3 py-2.5 border transition-colors group ${
                    showInterCad
                      ? "border-blue-500 bg-blue-500/10"
                      : transferState === "idle" && cursorHintDone
                        ? "breathe-blue border-blue-300"
                        : "border-[#dbe6f5]"
                  }`}
                >
                  <p className={`text-sm sm:text-xs truncate ${showInterCad ? "text-[#334155]" : "text-[#64748b]"}`}>
                    {INTER_CAD.label}
                  </p>
                  <p className={`text-[11px] sm:text-[10px] ${showInterCad ? "text-blue-600" : "text-[#64748b]"}`}>
                    {INTER_CAD.sub}
                  </p>
                </button>
              </div>

              {/* Tabs — Inter-CAD only exists once the transfer has been triggered */}
              <div className="flex items-center gap-1 border-b border-[#dbe6f5] px-3 py-2">
                <button
                  onClick={() => setActivePanel("partStudio")}
                  className={`rounded-md px-3 py-1.5 text-xs sm:text-[11px] font-medium transition-colors ${
                    !showInterCad ? "bg-[#eef2f9] text-[#0f172a]" : "text-[#94a3b8]"
                  }`}
                >
                  Model Gen
                </button>
                {transferState !== "idle" && (
                  <button
                    onClick={() => setActivePanel("interCad")}
                    className={`rounded-md px-3 py-1.5 text-xs sm:text-[11px] font-medium transition-colors ${
                      showInterCad ? "bg-[#eef2f9] text-[#0f172a]" : "text-[#94a3b8]"
                    }`}
                  >
                    Inter-CAD
                  </button>
                )}
              </div>

              {showInterCad ? (
                <div className="px-4 pt-4 pb-6">
                  <InterCadPanel />
                </div>
              ) : (
              <>
              {/* Feature tree */}
              <div className="px-4 pt-4 border-b border-[#dbe6f5] pb-4">
                <p className="text-[11px] sm:text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wide mb-2">Feature Tree · mug_v1</p>
                <div className="space-y-0.5">
                  {FEATURES.map(f => (
                    <div key={f.id} className={`flex items-center gap-2 py-0.5 transition-all duration-300 ${visibleFeat.has(f.id) ? "opacity-100" : "opacity-0"}`}>
                      <FeatureIcon type={f.icon} />
                      <span className="font-mono text-xs sm:text-[10px] text-[#475569]">{f.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Variables */}
              {visibleMsgs.has("result") && (
                <div className="px-4 pt-4 border-b border-[#dbe6f5] pb-4">
                  <p className="text-[11px] sm:text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wide mb-2">Live Variables</p>
                  <div className="rounded-md border border-[#dbe6f5] bg-[#eef2f9] overflow-hidden">
                    {VAR_GROUPS.map(group => (
                      <div key={group.label} className="border-b border-[#dbe6f5] last:border-0">
                        <button
                          onClick={() => toggleVarGroup(group.label)}
                          className="w-full flex items-center gap-1.5 px-3 py-2 hover:bg-[#e2e8f0] transition-colors"
                        >
                          <span
                            className="text-[10px] text-[#64748b] flex-shrink-0 transition-transform duration-150"
                            style={{ display: "inline-block", transform: expandedVars.has(group.label) ? "rotate(90deg)" : "rotate(0deg)" }}
                          >▶</span>
                          <span className="text-xs sm:text-[11px] font-medium text-[#475569]">{group.label}</span>
                          <span className="ml-auto font-mono text-[10px] sm:text-[8px] text-[#94a3b8]">{group.vars.length}</span>
                        </button>
                        {expandedVars.has(group.label) && (
                          <div className="px-3 pb-2 space-y-1 border-t border-[#eef2f9]">
                            {group.vars.map(([name, val, unit]) => (
                              <div key={name} className="flex items-center justify-between py-0.5">
                                <span className="font-mono text-[11px] sm:text-[9px] text-[#64748b]">{name}</span>
                                <span className="font-mono text-[11px] sm:text-[9px] text-[#3b82f6]">{val} <span className="text-[#94a3b8]">{unit}</span></span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mesh viewer */}
              {visibleMsgs.has("result") && (
                <div className="px-4 pt-4 pb-6">
                  {!showMesh ? (
                    <button
                      onClick={() => setShowMesh(true)}
                      className="w-full rounded-md flex items-center justify-center gap-1.5 border border-[#dbe6f5] hover:border-[#334155] bg-[#0f172a] hover:bg-black py-2 text-xs sm:text-[11px] font-medium text-white transition-colors"
                    >
                      ↗ View mesh model
                    </button>
                  ) : (
                    <div className="rounded-md overflow-hidden border border-black bg-black">
                      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10">
                        <span className="text-[11px] sm:text-[10px] font-medium text-white/80">Local model</span>
                        <button onClick={() => setShowMesh(false)} className="font-mono text-sm text-white/50 hover:text-white transition-colors leading-none">×</button>
                      </div>
                      <div className="overflow-hidden" style={{ height: 220 }}>
                        <MugModelViewer />
                      </div>
                      <p className="px-3 py-1.5 text-[11px] sm:text-[10px] text-white/40">Drag to rotate · scroll to zoom</p>
                    </div>
                  )}
                </div>
              )}
              </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Fake cursor hint (tablet and up) ── */}
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

function FeatureIcon({ type }: { type: "sketch" | "plane" | "solid" }) {
  if (type === "sketch") {
    // pencil / sketch icon
    return (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0">
        <path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z" stroke="#5a7aff" strokeWidth="1" strokeLinejoin="round" />
        <circle cx="9.5" cy="2.5" r="1" fill="#5a7aff" opacity="0.4" />
      </svg>
    );
  }
  if (type === "plane") {
    // plane / rectangle icon
    return (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0">
        <rect x="1.5" y="3" width="9" height="6" rx="0.5" stroke="#475569" strokeWidth="1" />
        <line x1="1.5" y1="6" x2="10.5" y2="6" stroke="#475569" strokeWidth="0.5" strokeDasharray="1.5 1" />
      </svg>
    );
  }
  // solid / extrude icon
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0">
      <rect x="2" y="4" width="7" height="6" rx="0.5" stroke="#475569" strokeWidth="1" />
      <path d="M2 4L5 2H9L9 8" stroke="#475569" strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
}
