"use client";

import { useEffect, useRef, useState } from "react";
import { lockScroll, unlockScroll } from "@/lib/scrollLock";

export default function DemoSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const triggeredRef = useRef(false);
  const lockedRef = useRef(false);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video) return;

    // Track scroll direction so the lock only captures downward passes —
    // scrolling back up through the section shouldn't re-trap the user.
    let lastY = window.scrollY;
    let scrollingDown = true;
    const onScroll = () => {
      const y = window.scrollY;
      if (y !== lastY) scrollingDown = y > lastY;
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          // Out of view: pause replays, but never interrupt the locked run.
          if (!lockedRef.current) video.pause();
          return;
        }

        if (!triggeredRef.current) {
          // The one-time locked run only captures a downward pass.
          if (!scrollingDown) return;
          triggeredRef.current = true;

          // Lock synchronously so momentum/fling scrolling can't carry the
          // user past the section while video.play() is still resolving.
          lockedRef.current = true;
          setLocked(true);
          lockScroll();
          section.scrollIntoView({ block: "center" });

          video.currentTime = 0;
          video.play().catch(() => {
            // Autoplay blocked — don't trap the user, release the lock.
            lockedRef.current = false;
            setLocked(false);
            unlockScroll();
          });
          return;
        }

        // Replay mode: after the one-time locked run, just loop in view.
        if (!lockedRef.current) {
          video.loop = true;
          video.play().catch(() => {});
        }
      },
      { threshold: 0.6 }
    );

    observer.observe(section);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const handleEnded = () => {
    if (lockedRef.current) {
      lockedRef.current = false;
      setLocked(false);
      unlockScroll();
    }
    // Keep the demo running as a loop now that the lock is released.
    const video = videoRef.current;
    if (video) {
      video.loop = true;
      video.play().catch(() => {});
    }
  };

  useEffect(() => {
    return () => {
      if (lockedRef.current) {
        lockedRef.current = false;
        unlockScroll();
      }
    };
  }, []);

  return (
    <section ref={sectionRef} className="bg-[#0f0f0f] border-t border-[#262626] py-20 px-6">
      <div className="max-w-5xl mx-auto flex flex-col items-center gap-4 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#00ff41]">See it in action</p>
        <h2 className="text-3xl font-black leading-tight text-[#e8e8e8] sm:text-4xl lg:text-5xl">
          Prompt to part, in real time.
        </h2>
        <p className="max-w-xl text-sm leading-6 text-[#888] sm:text-base">
          Watch Parametra turn a plain-English prompt into a fully constrained Onshape part studio — unedited, start to finish.
        </p>
        <div className="mt-6 w-full max-w-3xl border border-[#262626] bg-[#161616] p-4">
          <div className="relative overflow-hidden bg-[#0f0f0f]">
            <video
              ref={videoRef}
              src="/demo.mp4"
              muted
              playsInline
              onEnded={handleEnded}
              className="block w-full"
            />
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between border-t border-[#262626] bg-[#161616] px-3 py-2">
              <span className="font-mono text-[11px] text-[#00ff41]">
                {locked ? "playing · scroll unlocks after" : "live demo · unedited"}
              </span>
              <span className={`h-1.5 w-1.5 bg-[#00ff41] ${locked ? "animate-pulse" : ""}`} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}