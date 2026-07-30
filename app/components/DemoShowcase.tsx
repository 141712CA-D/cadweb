"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Two-pane product showcase that replaced the interactive mock-app demo
 * (DemoSection.tsx — kept in the repo, no longer mounted). Two app recordings
 * in dark window chrome:
 *
 * - Desktop (lg+): panes overlap on a diagonal — Home upper-left, Intent graph
 *   lower-right. Hovering a pane focuses it (raised, scaled, caption slides up)
 *   while the other recedes.
 * - Mobile/tablet: stacked, captions always visible, each pane fades up as it
 *   scrolls into view.
 *
 * One video element per pane serves both layouts — only positioning and the
 * caption presentation are responsive.
 */

const PANES = [
  {
    id: "home",
    src: "/homepage_recording.mov",
    windowTitle: "Parametra — Home",
    eyebrow: "01 · Application home",
    caption:
      "Application home — maintain your pulls, version history, and persisting.",
  },
  {
    id: "graph",
    src: "/graph_recording.mov",
    windowTitle: "Parametra — Intent graph",
    eyebrow: "02 · Intent graph",
    caption:
      "View how intent is distributed in your project, with each node opening up different parts of the project.",
  },
] as const;

type PaneId = (typeof PANES)[number]["id"];

export default function DemoShowcase() {
  const [focus, setFocus] = useState<PaneId | null>(null);
  const [inView, setInView] = useState<Record<PaneId, boolean>>({ home: false, graph: false });
  const paneRefs = useRef<Partial<Record<PaneId, HTMLDivElement | null>>>({});
  const videoRefs = useRef<HTMLVideoElement[]>([]);

  // Fade each pane up the first time it scrolls into view.
  useEffect(() => {
    const observers = PANES.map(pane => {
      const el = paneRefs.current[pane.id];
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setInView(prev => (prev[pane.id] ? prev : { ...prev, [pane.id]: true }));
            obs.disconnect();
          }
        },
        { threshold: 0.2 },
      );
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach(o => o?.disconnect());
  }, []);

  // Keep the recordings looping like GIFs — re-issue play() on any pause or
  // visibility change (muted + playsInline keeps autoplay policy happy).
  useEffect(() => {
    const videos = videoRefs.current;
    const forcePlay = () => {
      videos.forEach(v => {
        const p = v.play();
        if (p) p.catch(() => {});
      });
    };

    forcePlay();
    videos.forEach(v => {
      v.addEventListener("pause", forcePlay);
      v.addEventListener("loadeddata", forcePlay);
    });
    document.addEventListener("visibilitychange", forcePlay);

    return () => {
      videos.forEach(v => {
        v.removeEventListener("pause", forcePlay);
        v.removeEventListener("loadeddata", forcePlay);
      });
      document.removeEventListener("visibilitychange", forcePlay);
    };
  }, []);

  return (
    <section id="live-demo" className="relative z-10 border-t border-[#dbe6f5] bg-[#f8fafc] px-5 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <p className="mb-10 font-mono text-xs uppercase tracking-[0.3em] text-[#3b82f6] sm:mb-12">
          Inside the application
        </p>

        {/* One pane per recording; absolute diagonal overlap on lg+ */}
        <div className="relative lg:aspect-[1.5]">
          {PANES.map((pane, i) => {
            const other = PANES[1 - i].id;
            const visible = inView[pane.id];
            const dimmed = focus === other;
            const focused = focus === pane.id;

            return (
              <div
                key={pane.id}
                ref={el => { paneRefs.current[pane.id] = el; }}
                onMouseEnter={() => setFocus(pane.id)}
                onMouseLeave={() => setFocus(f => (f === pane.id ? null : f))}
                className={`transition-all duration-700 ease-out lg:absolute lg:w-[58%] ${
                  i === 0 ? "mb-8 lg:left-0 lg:top-0 lg:mb-0" : "lg:bottom-0 lg:right-0"
                } ${focused ? "lg:z-30" : i === 0 ? "lg:z-10" : "lg:z-20"}`}
                style={{
                  opacity: !visible ? 0 : dimmed ? 0.55 : 1,
                  transform: visible ? "translateY(0)" : "translateY(24px)",
                }}
              >
                <div
                  className={`overflow-hidden rounded-xl border bg-[#0e1014] transition-all duration-500 ${
                    focused
                      ? "scale-[1.03] border-[#3b82f6]/50 shadow-2xl shadow-[#3b82f6]/10"
                      : "border-[#23262e] shadow-xl"
                  }`}
                >
                  {/* Window chrome */}
                  <div className="flex items-center gap-4 border-b border-[#1c2027] bg-[#0e1014] px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                    </div>
                    <span className="font-mono text-[11px] text-[#8a94a6]">{pane.windowTitle}</span>
                  </div>

                  <div className="relative">
                    <video
                      ref={el => { if (el && !videoRefs.current.includes(el)) videoRefs.current.push(el); }}
                      src={pane.src}
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="auto"
                      disablePictureInPicture
                      controls={false}
                      tabIndex={-1}
                      className="block h-auto w-full"
                    />

                    {/* Desktop caption — slides up over the video on focus */}
                    <div
                      className={`pointer-events-none absolute inset-x-0 bottom-0 hidden bg-gradient-to-t from-[#05070a]/95 via-[#05070a]/70 to-transparent px-5 pb-4 pt-12 transition-all duration-500 lg:block ${
                        focused ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
                      }`}
                    >
                      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#60a5fa]">{pane.eyebrow}</p>
                      <p className="mt-1.5 max-w-lg text-sm leading-6 text-[#e2e8f0]">{pane.caption}</p>
                    </div>
                  </div>

                  {/* Mobile caption — always visible under the video */}
                  <div className="border-t border-[#1c2027] px-4 py-3.5 lg:hidden">
                    <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#60a5fa]">{pane.eyebrow}</p>
                    <p className="mt-1 text-sm leading-6 text-[#cbd5e1]">{pane.caption}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
