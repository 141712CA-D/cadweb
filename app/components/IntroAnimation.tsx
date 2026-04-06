"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const PHASE_RISE    = 80;    // logo + title rise from bottom
const PHASE_TEXT    = 350;   // tagline fades in
const PHASE_REVEAL  = 800;   // call onDone so page is ready underneath
const PHASE_SLIDE   = 900;   // overlay slides up (curtain reveal)
const PHASE_UNMOUNT = 1650;  // remove from DOM

export default function IntroAnimation({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"idle" | "rise" | "text" | "slide">("idle");
  const [taglineShown, setTaglineShown] = useState(false);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    const t1 = setTimeout(() => setPhase("rise"),  PHASE_RISE);
    const t2 = setTimeout(() => { setPhase("text"); setTaglineShown(true); }, PHASE_TEXT);
    const t3 = setTimeout(() => {
      // Make page content visible underneath before slide starts
      document.body.style.overflow = "";
      document.body.focus();
      onDone();
    }, PHASE_REVEAL);
    const t4 = setTimeout(() => setPhase("slide"), PHASE_SLIDE);
    const t5 = setTimeout(() => setMounted(false), PHASE_UNMOUNT);

    return () => { [t1, t2, t3, t4, t5].forEach(clearTimeout); };
  }, [onDone]);

  if (!mounted) return null;

  const risen = phase === "rise" || phase === "text" || phase === "slide";

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black"
      style={{
        transform: phase === "slide" ? "translateY(-100%)" : "translateY(0)",
        transition: phase === "slide" ? "transform 0.75s cubic-bezier(0.76, 0, 0.24, 1)" : "none",
        pointerEvents: phase === "slide" ? "none" : "auto",
      }}
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Ambient orb */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 600, height: 600,
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)",
          filter: "blur(40px)",
          opacity: risen ? 1 : 0,
          transition: "opacity 1s ease",
        }}
      />

      {/* Content */}
      <div className="relative flex flex-col items-center gap-5 select-none -mt-32">

        {/* Logo left, title right */}
        <div className="flex flex-col items-center gap-0">

          {/* Logo */}
          <div
            className="flex-shrink-0"
            style={{
              opacity: risen ? 1 : 0,
              transform: risen ? "translateY(0)" : "translateY(24px)",
              transition: "opacity 0.7s ease, transform 0.9s cubic-bezier(0.16,1,0.3,1)",
              filter: "drop-shadow(0 0 24px rgba(37,99,235,0.7)) drop-shadow(0 0 60px rgba(14,165,233,0.3))",
            }}
          >
            <Image
              src="/logo.svg"
              alt=""
              width={220}
              height={220}
              loading="eager"
              style={{ width: "clamp(60px, 15vw, 110px)", height: "auto" }}
            />
          </div>

          {/* Title */}
          <div
            className="font-bold tracking-tight whitespace-nowrap -mt-20"
            style={{
              fontSize: "clamp(2.5rem, 8vw, 5rem)",
              opacity: risen ? 1 : 0,
              transform: risen ? "translateY(0)" : "translateY(48px)",
              transition: "opacity 0.7s ease, transform 1s cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            <span className="text-white/90">Project </span>
            <span
              style={{
                background: "linear-gradient(135deg, #60a5fa 0%, #38bdf8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 0 20px rgba(37,99,235,0.6))",
              }}
            >
              CADen
            </span>
          </div>
        </div>

        {/* Tagline — fades in after title settles */}
        <p
          className="text-sm tracking-widest uppercase font-medium"
          style={{
            color: "rgba(255,255,255,0.3)",
            opacity: taglineShown ? 1 : 0,
            transform: taglineShown ? "translateY(0)" : "translateY(10px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
        >
          AI-Powered CAD Design
        </p>

      </div>
    </div>
  );
}
