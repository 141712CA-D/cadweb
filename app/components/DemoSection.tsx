"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { lockScroll, unlockScroll } from "../../lib/scrollLock";

const MugModelViewer = dynamic(() => import("./MugModelViewer"), { ssr: false });

// ── Types ─────────────────────────────────────────────────────────────────────

type MsgType = "user" | "thinking" | "assistant" | "result";
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

const MESSAGES: Msg[] = [
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
const FEATURES: { id: string; name: string; icon: "sketch" | "plane" | "solid" }[] = [
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

const VAR_GROUPS: { label: string; vars: [string, string, string][] }[] = [
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

const SCRIPT: Step[] = [
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
const LOG_LINES: LogLine[] = [
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

// ── Component ─────────────────────────────────────────────────────────────────

export default function DemoSection() {
  const sectionRef  = useRef<HTMLDivElement>(null);
  const chatRef     = useRef<HTMLDivElement>(null);
  const startedRef  = useRef(false);
  const lockedRef   = useRef(false);
  const lastScrollY = useRef(0);

  // Always start empty (SSR-safe) — fast-forward to complete state in useEffect if already played
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

  const logsRef       = useRef<HTMLDivElement>(null);
  const logsTabRef    = useRef<HTMLButtonElement>(null);
  const convTabRef    = useRef<HTMLButtonElement>(null);
  const meshBtnRef    = useRef<HTMLButtonElement>(null);
  const cursorRunning = useRef(false);

  // Refs mirror state so the async cursor animation reads fresh values
  // even if the user interacts between animDone and the animation starting.
  const activeTabRef   = useRef(activeTab);
  const expandedSetRef = useRef(expandedSet);
  const showMeshRef    = useRef(showMesh);
  useEffect(() => { activeTabRef.current   = activeTab;   }, [activeTab]);
  useEffect(() => { expandedSetRef.current = expandedSet; }, [expandedSet]);
  useEffect(() => { showMeshRef.current    = showMesh;    }, [showMesh]);

  // Cursor animation state (desktop-only hint)
  const [cursor, setCursor] = useState({ x: 0, y: 0, visible: false, tooltip: "", clicking: false });

  // On mount: if demo already played this session, fast-forward to complete state immediately
  useEffect(() => {
    if (sessionStorage.getItem("demoAnimPlayed") !== "true") return;
    startedRef.current = true;
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
  }, [visibleMsgs, showTyping]);

  // Scroll logs pane to bottom
  useEffect(() => {
    const el = logsRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [visibleLogs]);

  // Start animation + scroll-lock — only on first-ever view (gated by sessionStorage)
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    // Already played in a previous mount — skip animation and lock entirely
    if (sessionStorage.getItem("demoAnimPlayed") === "true") {
      startedRef.current = true;
      return;
    }

    lastScrollY.current = window.scrollY;
    const onScroll = () => { lastScrollY.current = window.scrollY; };
    window.addEventListener("scroll", onScroll, { passive: true });

    const runAnimation = () => {
      if (startedRef.current) return;
      startedRef.current = true;

      lockScroll();
      lockedRef.current = true;

      const lastDelay = Math.max(...SCRIPT.map(s => s.delay), ...LOG_LINES.map(l => l.t));
      const timers: ReturnType<typeof setTimeout>[] = [];

      SCRIPT.forEach((step, i) => {
        timers.push(
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
          }, step.delay)
        );
      });

      LOG_LINES.forEach(line => {
        timers.push(
          setTimeout(() => {
            setVisibleLogs(prev => [...prev, line]);
          }, line.t)
        );
      });

      timers.push(
        setTimeout(() => {
          if (lockedRef.current) {
            unlockScroll();
            lockedRef.current = false;
          }
          sessionStorage.setItem("demoAnimPlayed", "true");
        }, lastDelay + 200)
      );
    };

    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !startedRef.current) {
          runAnimation();
        }
      },
      { threshold: 0.6 }
    );
    obs.observe(section);

    return () => {
      obs.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (lockedRef.current) { unlockScroll(); lockedRef.current = false; }
    };
  }, []);

  // Cursor hint animation — desktop only, runs once on first demo completion
  useEffect(() => {
    if (!animDone) return;
    if (typeof window !== "undefined" && window.innerWidth < 1024) return;
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
      }

      setCursor(c => ({ ...c, visible: false, tooltip: "" }));
      sessionStorage.setItem("cursorHintPlayed", "true");
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

  const visibleItems = MESSAGES.filter(m => visibleMsgs.has(m.id));

  return (
    <section id="live-demo" ref={sectionRef} className="relative bg-[#080808] border-t border-[#1a1a1a] overflow-hidden" style={{ height: "100svh" }}>

      {/* ── Browser chrome frame — exact viewport height ── */}
      <div className="flex flex-col w-full overflow-hidden" style={{ height: "100svh" }}>
        {/* Title bar */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-b border-[#121212] bg-[#090909] flex-shrink-0">
          {/* Mobile: hamburger */}
          <button
            className="flex lg:hidden items-center gap-1.5 flex-shrink-0"
            onClick={() => setShelfOpen(true)}
            aria-label="Open file panel"
          >
            <span className="flex flex-col gap-[3px]">
              <span className="block h-px w-4 bg-[#3a3a3a]" />
              <span className="block h-px w-4 bg-[#3a3a3a]" />
              <span className="block h-px w-3 bg-[#3a3a3a]" />
            </span>
          </button>
          {/* Desktop: traffic lights */}
          <div className="hidden lg:flex items-center gap-1.5 flex-shrink-0">
            <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <div className="h-3 w-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="flex items-center border border-[#181818] bg-[#0c0c0c] px-4 py-1 min-w-44 justify-center">
              <span className="font-mono text-[10px] text-[#3a3a3a]">parametra.ai</span>
            </div>
          </div>
          <div className="w-8 lg:w-16 flex-shrink-0" />
        </div>

        {/* App body — fills remaining viewport */}
        <div className="flex flex-1 min-h-0" style={{ height: "calc(100svh - 41px)" }}>

          {/* ── Left sidebar ── */}
          <aside className="hidden lg:flex w-52 flex-shrink-0 flex-col border-r border-[#121212] bg-[#080808]">
            {/* Brand */}
            <div className="px-4 py-3 border-b border-[#121212] flex items-center gap-2">
              <span className="font-mono text-xs text-[#00ff41] tracking-[0.1em]">Parametra</span>
              <span className="font-mono text-[8px] text-[#222]">v1.0</span>
            </div>

            {/* Nav */}
            <nav className="px-2 pt-3 space-y-px">
              {[
                { label: "Part Studios", active: true  },
                { label: "Documents",    active: false },
                { label: "Assemblies",   active: false },
                { label: "Variables",    active: false },
              ].map(item => (
                <div
                  key={item.label}
                  className={`flex items-center gap-2 px-3 py-2 text-xs select-none ${
                    item.active ? "bg-[#0e0e0e] text-[#bbb]" : "text-[#2e2e2e]"
                  }`}
                >
                  <span
                    className={`h-1 w-1 rounded-full flex-shrink-0 ${
                      item.active ? "bg-[#00ff41]" : "bg-[#1c1c1c]"
                    }`}
                  />
                  {item.label}
                </div>
              ))}
            </nav>

            {/* Design history */}
            <div className="px-2 pt-4">
              <p className="px-3 pb-2 font-mono text-[8px] text-[#1c1c1c] uppercase tracking-[0.2em]">
                Recent
              </p>
              {HISTORY.map(h => (
                <div
                  key={h.id}
                  className={`px-3 py-2.5 ${
                    h.active ? "bg-[#0e0e0e] border-l-2 border-[#00ff41]" : ""
                  }`}
                >
                  <p
                    className={`text-xs truncate ${
                      h.active ? "text-[#bbb]" : "text-[#252525]"
                    }`}
                  >
                    {h.label}
                  </p>
                  <p
                    className={`font-mono text-[9px] ${
                      h.active ? "text-[#333]" : "text-[#181818]"
                    }`}
                  >
                    {h.sub}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-auto p-4 border-t border-[#121212]">
              <p className="font-mono text-[8px] text-[#1c1c1c] uppercase tracking-widest">Settings</p>
            </div>
          </aside>

          {/* ── Middle: Part Studio panel ── */}
          <div
            className="hidden sm:flex flex-col border-r border-[#121212] bg-[#090909]"
            style={{ width: "clamp(200px, 32%, 320px)", flexShrink: 0 }}
          >
            <div className="px-4 py-3 border-b border-[#121212]">
              <p className="font-mono text-[9px] text-[#2a2a2a] uppercase tracking-[0.2em]">
                Part Studio
              </p>
              <p className="text-sm text-[#777] mt-0.5">mug_v1</p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              {/* Feature tree */}
              <div>
                <p className="font-mono text-[8px] text-[#202020] uppercase tracking-[0.2em] mb-2">
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
                      <span className="font-mono text-[10px] text-[#686868]">{f.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Variables — drill-down accordion */}
              {visibleMsgs.has("result") && (
                <div className="border border-[#141414] bg-[#070707]">
                  <p className="px-3 pt-2.5 pb-1.5 font-mono text-[8px] text-[#222] uppercase tracking-[0.2em] border-b border-[#111]">
                    Live Variables
                  </p>
                  {VAR_GROUPS.map(group => (
                    <div key={group.label} className="border-b border-[#111] last:border-0">
                      <button
                        onClick={() => toggleVarGroup(group.label)}
                        className="w-full flex items-center gap-1.5 px-3 py-2 hover:bg-[#0c0c0c] transition-colors"
                      >
                        <span
                          className="font-mono text-[8px] text-[#2e2e2e] flex-shrink-0 transition-transform duration-150"
                          style={{ display: "inline-block", transform: expandedVars.has(group.label) ? "rotate(90deg)" : "rotate(0deg)" }}
                        >
                          ▶
                        </span>
                        <span className="font-mono text-[9px] text-[#484848] uppercase tracking-widest">
                          {group.label}
                        </span>
                        <span className="ml-auto font-mono text-[8px] text-[#222]">
                          {group.vars.length}
                        </span>
                      </button>
                      {expandedVars.has(group.label) && (
                        <div className="px-3 pb-2 space-y-1 border-t border-[#0e0e0e]">
                          {group.vars.map(([name, val, unit]) => (
                            <div key={name} className="flex items-center justify-between py-0.5">
                              <span className="font-mono text-[9px] text-[#383838]">{name}</span>
                              <span className="font-mono text-[9px] text-[#00ff41]">
                                {val} <span className="text-[#242424]">{unit}</span>
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
                      className="w-full border border-[#1c1c1c] hover:border-[#00ff41] py-2 font-mono text-[9px] text-[#333] hover:text-[#00ff41] transition-colors uppercase tracking-widest"
                    >
                      ↗ view mesh model
                    </button>
                  ) : (
                    <div className="border border-[#00ff41]" style={{ boxShadow: "0 0 20px rgba(0,255,65,0.04)" }}>
                      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#0e0e0e]">
                        <span className="font-mono text-[8px] text-[#00ff41] uppercase tracking-widest">
                          mug_v1.stl
                        </span>
                        <button
                          onClick={() => setShowMesh(false)}
                          className="font-mono text-sm text-[#2e2e2e] hover:text-[#888] transition-colors leading-none"
                        >
                          ×
                        </button>
                      </div>
                      <div className="overflow-hidden" style={{ height: 240 }}>
                        <MugModelViewer />
                      </div>
                      <p className="px-3 py-1.5 font-mono text-[8px] text-[#222]">
                        drag to rotate · scroll to zoom
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Status bar */}
            <div className="flex items-center gap-2 px-4 py-2 border-t border-[#121212]">
              <span
                className={`h-1.5 w-1.5 flex-shrink-0 ${
                  animDone ? "bg-[#00ff41]" : "bg-[#222] animate-pulse"
                }`}
              />
              <span className="font-mono text-[9px] text-[#222]">
                {animDone ? "complete · 6 features · 9 variables" : "generating…"}
              </span>
            </div>
          </div>

          {/* ── Right: Chat panel ── */}
          <div className="flex flex-col flex-1 min-w-0 bg-[#080808]">
            {/* Tabs */}
            <div className="flex items-end border-b border-[#121212] px-5 flex-shrink-0">
              <button
                ref={convTabRef}
                onClick={() => setActiveTab("conversation")}
                className={`py-3 mr-5 font-mono text-[10px] uppercase tracking-widest transition-colors ${
                  activeTab === "conversation"
                    ? "text-[#888] border-b border-[#00ff41]"
                    : "text-[#242424] hover:text-[#333]"
                }`}
              >
                Conversation
              </button>
              <button
                ref={logsTabRef}
                onClick={() => setActiveTab("logs")}
                className={`py-3 font-mono text-[10px] uppercase tracking-widest transition-colors ${
                  activeTab === "logs"
                    ? "text-[#888] border-b border-[#00ff41]"
                    : "text-[#242424] hover:text-[#333]"
                }`}
              >
                Logs
                {visibleLogs.length > 0 && (
                  <span className="ml-1.5 font-mono text-[8px] text-[#2a2a2a]">
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
                {showTyping && (
                  <div className="flex items-center gap-2.5">
                    <PAvatar />
                    <div className="flex gap-1 pt-0.5">
                      {[0, 120, 240].map(d => (
                        <span
                          key={d}
                          className="h-1.5 w-1.5 rounded-full bg-[#00ff41] animate-bounce"
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
              <div ref={logsRef} className="flex-1 overflow-y-auto px-4 py-3 font-mono text-[9px] leading-[1.8] space-y-0">
                {visibleLogs.map((line, i) => (
                  <p key={i} className={
                    line.level === "ok"   ? "text-[#00ff41]" :
                    line.level === "api"  ? "text-[#4a9eff]" :
                    line.level === "warn" ? "text-[#f5a623]" :
                                           "text-[#383838]"
                  }>
                    {line.text}
                  </p>
                ))}
                {!animDone && visibleLogs.length > 0 && (
                  <span className="text-[#00ff41] animate-pulse">▌</span>
                )}
              </div>
            )}

            {/* Decorative input */}
            <div className="px-5 py-3 border-t border-[#121212] flex-shrink-0">
              <div className="flex items-center gap-2 border border-[#141414] bg-[#0b0b0b] px-3 py-2.5">
                <span className="flex-1 font-mono text-[10px] text-[#1c1c1c] select-none">
                  {animDone ? "design complete — ask a follow-up" : "demo in progress…"}
                </span>
                <span className="font-mono text-[9px] text-[#1a1a1a] border border-[#181818] px-2 py-0.5 uppercase tracking-widest">
                  ↑
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Fake cursor hint (desktop only) ── */}
      <div className="hidden lg:block pointer-events-none">
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
            style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.8))" }}
          >
            <path d="M4 2L4 15L7.5 11.5L10 17L12 16L9.5 10.5L14 10.5L4 2Z" fill="white" stroke="#000" strokeWidth="0.8" strokeLinejoin="round" />
          </svg>
          {/* Tooltip */}
          {cursor.tooltip && (
            <div
              className="absolute left-5 top-0 whitespace-nowrap border border-[#00ff41] bg-[#080808] px-2.5 py-1.5 font-mono text-[9px] text-[#00ff41] uppercase tracking-widest"
              style={{ boxShadow: "0 0 16px rgba(0,255,65,0.15)" }}
            >
              {cursor.tooltip}
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile slide-in shelf ── */}
      {/* Backdrop */}
      <div
        className={`absolute inset-0 z-40 bg-black/60 transition-opacity duration-300 lg:hidden ${
          shelfOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setShelfOpen(false)}
      />
      {/* Shelf panel */}
      <div
        className={`absolute top-0 left-0 z-50 h-full w-72 flex flex-col bg-[#080808] border-r border-[#1c1c1c] transition-transform duration-300 ease-out lg:hidden ${
          shelfOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#141414]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[#00ff41] tracking-[0.1em]">Parametra</span>
            <span className="font-mono text-[8px] text-[#222]">v1.0</span>
          </div>
          <button onClick={() => setShelfOpen(false)} className="font-mono text-lg text-[#333] hover:text-[#888] leading-none">×</button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {/* Nav */}
          <nav className="px-2 pt-3 space-y-px border-b border-[#141414] pb-3">
            {[
              { label: "Part Studios", active: true  },
              { label: "Documents",    active: false },
              { label: "Assemblies",   active: false },
              { label: "Variables",    active: false },
            ].map(item => (
              <div
                key={item.label}
                className={`flex items-center gap-2 px-3 py-2 text-xs select-none ${
                  item.active ? "bg-[#0e0e0e] text-[#bbb]" : "text-[#2e2e2e]"
                }`}
              >
                <span className={`h-1 w-1 rounded-full flex-shrink-0 ${item.active ? "bg-[#00ff41]" : "bg-[#1c1c1c]"}`} />
                {item.label}
              </div>
            ))}
          </nav>

          {/* History */}
          <div className="px-2 pt-4 border-b border-[#141414] pb-4">
            <p className="px-3 pb-2 font-mono text-[8px] text-[#1c1c1c] uppercase tracking-[0.2em]">Recent</p>
            {HISTORY.map(h => (
              <div key={h.id} className={`px-3 py-2.5 ${h.active ? "bg-[#0e0e0e] border-l-2 border-[#00ff41]" : ""}`}>
                <p className={`text-xs truncate ${h.active ? "text-[#bbb]" : "text-[#252525]"}`}>{h.label}</p>
                <p className={`font-mono text-[9px] ${h.active ? "text-[#333]" : "text-[#181818]"}`}>{h.sub}</p>
              </div>
            ))}
          </div>

          {/* Feature tree */}
          <div className="px-4 pt-4 border-b border-[#141414] pb-4">
            <p className="font-mono text-[8px] text-[#202020] uppercase tracking-[0.2em] mb-2">Feature Tree · mug_v1</p>
            <div className="space-y-0.5">
              {FEATURES.map(f => (
                <div key={f.id} className={`flex items-center gap-2 py-0.5 transition-all duration-300 ${visibleFeat.has(f.id) ? "opacity-100" : "opacity-0"}`}>
                  <FeatureIcon type={f.icon} />
                  <span className="font-mono text-[10px] text-[#686868]">{f.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Variables */}
          {visibleMsgs.has("result") && (
            <div className="px-4 pt-4 border-b border-[#141414] pb-4">
              <p className="font-mono text-[8px] text-[#202020] uppercase tracking-[0.2em] mb-2">Live Variables</p>
              <div className="border border-[#141414] bg-[#070707]">
                {VAR_GROUPS.map(group => (
                  <div key={group.label} className="border-b border-[#111] last:border-0">
                    <button
                      onClick={() => toggleVarGroup(group.label)}
                      className="w-full flex items-center gap-1.5 px-3 py-2 hover:bg-[#0c0c0c] transition-colors"
                    >
                      <span
                        className="font-mono text-[8px] text-[#2e2e2e] flex-shrink-0 transition-transform duration-150"
                        style={{ display: "inline-block", transform: expandedVars.has(group.label) ? "rotate(90deg)" : "rotate(0deg)" }}
                      >▶</span>
                      <span className="font-mono text-[9px] text-[#484848] uppercase tracking-widest">{group.label}</span>
                      <span className="ml-auto font-mono text-[8px] text-[#222]">{group.vars.length}</span>
                    </button>
                    {expandedVars.has(group.label) && (
                      <div className="px-3 pb-2 space-y-1 border-t border-[#0e0e0e]">
                        {group.vars.map(([name, val, unit]) => (
                          <div key={name} className="flex items-center justify-between py-0.5">
                            <span className="font-mono text-[9px] text-[#383838]">{name}</span>
                            <span className="font-mono text-[9px] text-[#00ff41]">{val} <span className="text-[#242424]">{unit}</span></span>
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
                  className="w-full border border-[#1c1c1c] hover:border-[#00ff41] py-2 font-mono text-[9px] text-[#333] hover:text-[#00ff41] transition-colors uppercase tracking-widest"
                >
                  ↗ view mesh model
                </button>
              ) : (
                <div className="border border-[#00ff41]">
                  <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#0e0e0e]">
                    <span className="font-mono text-[8px] text-[#00ff41] uppercase tracking-widest">mug_v1.stl</span>
                    <button onClick={() => setShowMesh(false)} className="font-mono text-sm text-[#2e2e2e] hover:text-[#888] transition-colors leading-none">×</button>
                  </div>
                  <div className="overflow-hidden" style={{ height: 220 }}>
                    <MugModelViewer />
                  </div>
                  <p className="px-3 py-1.5 font-mono text-[8px] text-[#222]">drag to rotate · scroll to zoom</p>
                </div>
              )}
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
    <div className="h-5 w-5 flex-shrink-0 flex items-center justify-center border border-[#1a1a1a] bg-[#0f0f0f] overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.svg" alt="Parametra" className="h-3.5 w-3.5 object-contain" />
    </div>
  );
}

function ChatMessage({
  item,
  expanded,
  onToggle,
}: {
  item: Msg;
  expanded: boolean;
  onToggle: () => void;
}) {
  if (item.type === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[78%] border border-[#1c1c1c] bg-[#0e0e0e] px-3 py-2">
          <p className="text-xs text-[#c0c0c0] leading-relaxed">{item.text}</p>
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
          className="font-mono text-[9px] text-[#282828] group-hover:text-[#555] transition-colors mt-px flex-shrink-0"
          style={{ display: "inline-block", transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          ▶
        </span>
        <div>
          <span className="font-mono text-[9px] text-[#282828] group-hover:text-[#555] uppercase tracking-widest transition-colors">
            thinking ({item.lines?.length} steps)
          </span>
          {expanded && (
            <div className="mt-1.5 border-l-2 border-[#131313] pl-2.5 space-y-0.5">
              {item.lines?.map((line, i) => (
                <p key={i} className="font-mono text-[9px] text-[#303030] leading-5">
                  {line}
                </p>
              ))}
            </div>
          )}
        </div>
      </button>
    );
  }

  if (item.type === "assistant") {
    return (
      <div className="flex items-start gap-2.5">
        <PAvatar />
        <div className="flex-1 max-w-[85%] space-y-2">
          {item.text?.split("\n\n").map((para, i) => (
            <p key={i} className="text-xs text-[#888] leading-relaxed">
              {para}
            </p>
          ))}
        </div>
      </div>
    );
  }

  if (item.type === "result") {
    return (
      <div className="flex items-start gap-2.5">
        <PAvatar />
        <div className="flex-1">
          <div className="border border-[#161616] bg-[#080808] p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-[#00ff41]">✓ built</span>
              <span className="font-mono text-[9px] text-[#282828]">mug_v1 · Part Studio</span>
            </div>
            <p className="font-mono text-[9px] text-[#2e2e2e] leading-5">
              12 features · 9 live variables
              <br />
              ↳ edit any variable in Onshape and the part rebuilds.
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
        <rect x="1.5" y="3" width="9" height="6" rx="0.5" stroke="#888" strokeWidth="1" />
        <line x1="1.5" y1="6" x2="10.5" y2="6" stroke="#888" strokeWidth="0.5" strokeDasharray="1.5 1" />
      </svg>
    );
  }
  // solid / extrude icon
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0">
      <rect x="2" y="4" width="7" height="6" rx="0.5" stroke="#888" strokeWidth="1" />
      <path d="M2 4L5 2H9L9 8" stroke="#888" strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
}
