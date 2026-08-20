"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Two-row product showcase that replaced the interactive mock-app demo
 * (DemoSection.tsx — kept in the repo, no longer mounted).
 *
 * Each row pairs copy with a screen-only app recording on lg+, alternating
 * sides (video left for Application Home, video right for Interoperability
 * Layer). Below lg the rows stack in the same visual order: video above the
 * copy for Application Home, copy above the video for Interoperability
 * Layer. The recordings are raw screen
 * captures — no device mockup baked in — so each one is framed in a dark
 * macOS-style window chrome, matching the real-app dark palette the site's
 * design language reserves for app surfaces.
 *
 * Scroll behavior: each row is a near-viewport-height scene that fades/slides
 * in when it enters the viewport and fades back out when it leaves.
 */

const PANES = [
  {
    id: "home",
    src: "/HomepageDemoVideoScreenOnly.mov",
    videoSide: "left",
    eyebrow: "01",
    title: "Application Home",
    caption:
      "Maintain your pulls, version history, and persisting — every capture of your model, in one place.",
  },
  {
    id: "graph",
    src: "/ApplicationDemoVideoScreenOnly.mov",
    videoSide: "right",
    eyebrow: "02",
    title: "Interoperability Layer",
    caption:
      "Manage your design intent and prepare to stage commits that update your CAD designs as you transfer between softwares.",
  },
] as const;

type PaneId = (typeof PANES)[number]["id"];

export default function DemoShowcase() {
  const [inView, setInView] = useState<Record<PaneId, boolean>>({ home: false, graph: false });
  const paneRefs = useRef<Partial<Record<PaneId, HTMLElement | null>>>({});
  const videoRefs = useRef<HTMLVideoElement[]>([]);

  // Fade each row in when it enters the viewport and back out when it leaves.
  useEffect(() => {
    const observers = PANES.map(pane => {
      const el = paneRefs.current[pane.id];
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => {
          setInView(prev =>
            prev[pane.id] === entry.isIntersecting
              ? prev
              : { ...prev, [pane.id]: entry.isIntersecting },
          );
        },
        { threshold: 0.35 },
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
    <section id="live-demo" className="relative z-10 border-t border-[#dbe6f5] bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.3em] text-[#3b82f6]">
          Inside the application
        </p>

        {PANES.map(pane => {
          const visible = inView[pane.id];
          const videoLeft = pane.videoSide === "left";

          return (
            <div
              key={pane.id}
              ref={el => { paneRefs.current[pane.id] = el; }}
              className={`grid min-h-[80svh] grid-cols-1 content-center items-center gap-8 py-10 transition-all duration-700 ease-out lg:gap-14 ${
                videoLeft
                  ? "lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]"
                  : "lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
              }`}
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(32px)",
              }}
            >
              {/* Copy — sits opposite the video on lg+ (order flips per row).
                  Stacked below lg, the same order carries over: video-left
                  rows put the video on top, video-right rows the text. */}
              <div className={videoLeft ? "order-2" : undefined}>
                <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#94a3b8]">{pane.eyebrow}</p>
                <h3 className="mt-3 text-2xl font-black tracking-tight text-[#0f172a] sm:text-3xl lg:text-4xl">
                  {pane.title}
                </h3>
                <p className="mt-4 max-w-md text-base leading-7 text-[#475569]">{pane.caption}</p>
              </div>

              {/* Screen-only recording in dark macOS-style window chrome —
                  the app-surface exception to the light site shell. */}
              <div className={`overflow-hidden rounded-xl border border-[#1c2027] bg-[#0b0d11] shadow-[0_24px_60px_-20px_rgba(15,23,42,0.35)] ${videoLeft ? "order-1" : ""}`}>
                <div className="flex items-center gap-1.5 border-b border-[#1c2027] bg-[#12151b] px-3.5 py-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                </div>
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
                  className="block aspect-[3456/2234] w-full object-cover"
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
