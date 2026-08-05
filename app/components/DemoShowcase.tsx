"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Two-pane product showcase that replaced the interactive mock-app demo
 * (DemoSection.tsx — kept in the repo, no longer mounted).
 *
 * The recordings are MacBook mockups rendered on a near-white background, so
 * they carry their own device shell — there is deliberately no card, border or
 * fake window chrome around them. `.demo-reel` (globals.css) multiplies the
 * clip into the page's white and feathers its edges, so each machine reads as
 * an object sitting on the page rather than a video in a box.
 *
 * - Desktop (lg+): the two reels sit side by side, same size, no hover state.
 * - Mobile/tablet: one above the other, in the same order.
 *
 * Each caption sits directly under its own recording at every breakpoint, and
 * each pane fades up the first time it scrolls into view.
 */

const PANES = [
  {
    id: "home",
    src: "/HomepageDemoVideo.mov",
    eyebrow: "01 · Application home",
    caption:
      "Application home — maintain your pulls, version history, and persisting.",
  },
  {
    id: "graph",
    src: "/GraphDemoVideo.mov",
    eyebrow: "02 · Intent graph",
    caption:
      "View how intent is distributed in your project, with each node opening up different parts of the project.",
  },
] as const;

type PaneId = (typeof PANES)[number]["id"];

export default function DemoShowcase() {
  const [inView, setInView] = useState<Record<PaneId, boolean>>({ home: false, graph: false });
  const paneRefs = useRef<Partial<Record<PaneId, HTMLElement | null>>>({});
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
    <section id="live-demo" className="relative z-10 border-t border-[#dbe6f5] bg-white px-3 py-20 sm:px-4 sm:py-24 lg:px-4">
      <div className="mx-auto w-full max-w-[96vw] lg:max-w-[max(80rem,96vw)]">
        <p className="mb-6 px-2 font-mono text-xs uppercase tracking-[0.3em] text-[#3b82f6] sm:mb-8">
          Inside the application
        </p>

        {/* Side by side on lg+, stacked in the same order below it.
            The gap is deliberately tight: `.demo-reel`'s mask already fades out
            the outer 10% of each clip, so two panes carry ~20% of their own
            whitespace between them — a Tailwind gap on top of that reads as a
            gulf, and the machines stop looking like one exhibit. */}
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2 lg:gap-2">
          {PANES.map(pane => {
            const visible = inView[pane.id];

            return (
              <figure
                key={pane.id}
                ref={el => { paneRefs.current[pane.id] = el; }}
                className="m-0 transition-all duration-700 ease-out"
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateY(0)" : "translateY(24px)",
                }}
              >
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
                  className="demo-reel block aspect-video w-full object-cover"
                />

                {/* Clear of the frame — the mockup carries its own drop shadow
                    below the machine, so the caption starts under all of it. */}
                <figcaption className="mt-2 px-2 text-center sm:mt-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#3b82f6]">{pane.eyebrow}</p>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#475569]">{pane.caption}</p>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
