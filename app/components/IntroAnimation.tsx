"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const PHASE_RISE    = 80;
const PHASE_TEXT    = 350;
const PHASE_REVEAL  = 800;
const PHASE_SLIDE   = 900;
const PHASE_UNMOUNT = 1650;

export default function IntroAnimation({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"idle" | "rise" | "text" | "slide">("idle");
  const [taglineShown, setTaglineShown] = useState(false);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    const t1 = setTimeout(() => setPhase("rise"),  PHASE_RISE);
    const t2 = setTimeout(() => { setPhase("text"); setTaglineShown(true); }, PHASE_TEXT);
    const t3 = setTimeout(() => {
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
      className="fixed inset-0 z-[999] flex items-center justify-center bg-[#F5F0E8]"
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
            "linear-gradient(rgba(30,41,59,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(30,41,59,0.05) 1px, transparent 1px)",
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
          background: "radial-gradient(circle, rgba(199,226,255,0.6) 0%, transparent 70%)",
          filter: "blur(40px)",
          opacity: risen ? 1 : 0,
          transition: "opacity 1s ease",
        }}
      />

      {/* Content */}
      <div className="relative flex flex-col items-center gap-5 select-none -mt-32">

        <div className="flex flex-col items-center gap-0">

          {/* Logo */}
          <div
            className="flex-shrink-0"
            style={{
              opacity: risen ? 1 : 0,
              transform: risen ? "translateY(0)" : "translateY(24px)",
              transition: "opacity 0.7s ease, transform 0.9s cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            <Image
              src="/logo.svg"
              alt=""
              width={220}
              height={220}
              loading="eager"
              style={{ width: "clamp(60px, 15vw, 110px)", height: "auto", filter: "brightness(0)" }}
            />
          </div>

          {/* Title */}
          <div
            className="font-bold tracking-tight whitespace-nowrap mt-2 sm:-mt-6"
            style={{
              fontSize: "clamp(2.5rem, 8vw, 5rem)",
              opacity: risen ? 1 : 0,
              transform: risen ? "translateY(0)" : "translateY(48px)",
              transition: "opacity 0.7s ease, transform 1s cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            <span className="text-[#1E293B]">Parametra</span>
          </div>
        </div>

        {/* Tagline */}
        <p
          className="text-sm tracking-widest uppercase font-medium"
          style={{
            color: "rgba(30,41,59,0.4)",
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
