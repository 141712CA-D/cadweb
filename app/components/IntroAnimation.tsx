"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";

const FULL_TEXT = "Project CADen";
const PHASE_SCANLINE  = 300;   // ms — scan line starts
const PHASE_TYPING    = 900;   // ms — text starts typing
const PHASE_BURST     = 1900;  // ms — radial burst plays (after typing finishes ~1810ms)
const PHASE_EXIT      = 2300;  // ms — overlay begins fading out
const PHASE_UNMOUNT   = 3000;  // ms — component removed from DOM

export default function IntroAnimation({ onDone }: { onDone: () => void }) {
  const [phase, setPhase]         = useState<"idle"|"scan"|"type"|"burst"|"exit">("idle");
  const [displayed, setDisplayed] = useState("");
  const [mounted, setMounted]     = useState(true);
  const typingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Lock scroll while intro plays
    document.body.style.overflow = "hidden";

    const t1 = setTimeout(() => setPhase("scan"),  PHASE_SCANLINE);
    const t2 = setTimeout(() => setPhase("type"),  PHASE_TYPING);
    const t3 = setTimeout(() => setPhase("burst"), PHASE_BURST);
    const t4 = setTimeout(() => {
      setPhase("exit");
      document.body.style.overflow = "";
      document.body.focus();
    }, PHASE_EXIT);
    const t5 = setTimeout(() => {
      setMounted(false);
      onDone();
    }, PHASE_UNMOUNT);

    return () => { [t1, t2, t3, t4, t5].forEach(clearTimeout); };
  }, [onDone]);

  // Typewriter
  useEffect(() => {
    if (phase !== "type") return;
    let i = 0;
    typingRef.current = setInterval(() => {
      i++;
      setDisplayed(FULL_TEXT.slice(0, i));
      if (i >= FULL_TEXT.length) clearInterval(typingRef.current!);
    }, 70);
    return () => { if (typingRef.current) clearInterval(typingRef.current); };
  }, [phase]);

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black"
      style={{
        transition: phase === "exit" ? "opacity 0.8s cubic-bezier(0.4,0,0.2,1)" : "none",
        opacity: phase === "exit" ? 0 : 1,
        pointerEvents: phase === "exit" ? "none" : "auto",
      }}
    >
      {/* Background grid (same as hero) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          opacity: phase === "idle" ? 0 : 1,
          transition: "opacity 1s ease",
        }}
      />

      {/* Scan line */}
      {(phase === "scan" || phase === "type" || phase === "burst") && (
        <div
          className="absolute left-0 right-0 h-px pointer-events-none"
          style={{
            background: "linear-gradient(90deg, transparent 0%, rgba(37,99,235,0.8) 20%, rgba(14,165,233,1) 50%, rgba(37,99,235,0.8) 80%, transparent 100%)",
            boxShadow: "0 0 20px rgba(14,165,233,0.6), 0 0 60px rgba(37,99,235,0.3)",
            animation: "intro-scan 1.0s cubic-bezier(0.4, 0, 0.2, 1) forwards",
          }}
        />
      )}

      {/* Ambient orbs that appear during typing */}
      {(phase === "type" || phase === "burst") && (
        <>
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 500, height: 500,
              top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              background: "radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 70%)",
              filter: "blur(40px)",
              animation: "intro-orb-in 0.8s ease forwards",
            }}
          />
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 400, height: 400,
              top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              background: "radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%)",
              filter: "blur(30px)",
              animation: "intro-orb-in 1.0s ease forwards",
            }}
          />
        </>
      )}

      {/* Burst ring */}
      {phase === "burst" && (
        <div
          className="absolute rounded-full pointer-events-none border border-blue-500/40"
          style={{
            width: 200, height: 200,
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            animation: "intro-burst 0.8s cubic-bezier(0.0, 0.0, 0.2, 1) forwards",
          }}
        />
      )}

      {/* Logo */}
      <div className="relative flex flex-col items-center gap-6 select-none">
        {/* Logo mark */}
        {(phase === "type" || phase === "burst") && (
          <div
            style={{
              animation: "intro-icon-in 0.5s cubic-bezier(0.16,1,0.3,1) forwards",
              filter: "drop-shadow(0 0 24px rgba(37,99,235,0.7)) drop-shadow(0 0 60px rgba(14,165,233,0.3))",
            }}
          >
            <Image
              src="/logo copy.png"
              alt="Project CADen"
              width={96}
              height={96}
              loading="eager"
              style={{ width: 96, height: "auto" }}
            />
          </div>
        )}

        {/* Typewriter text */}
        <div
          className="font-bold tracking-tight"
          style={{ fontSize: "clamp(2.5rem, 8vw, 5rem)" }}
        >
          {/* "Project " in white */}
          <span className="text-white/90">
            {displayed.slice(0, Math.min(displayed.length, 8))}
          </span>
          {/* "CADen" in gradient */}
          {displayed.length > 8 && (
            <span
              style={{
                background: "linear-gradient(135deg, #60a5fa 0%, #38bdf8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 0 20px rgba(37,99,235,0.8))",
              }}
            >
              {displayed.slice(8)}
            </span>
          )}
          {/* Blinking cursor */}
          {displayed.length < FULL_TEXT.length && (
            <span
              className="inline-block w-0.5 ml-1 bg-cyan-400"
              style={{
                height: "0.85em",
                verticalAlign: "middle",
                animation: "intro-cursor 0.8s step-end infinite",
              }}
            />
          )}
        </div>

        {/* Tagline — appears after typing completes */}
        {displayed === FULL_TEXT && (
          <p
            className="text-sm tracking-widest uppercase text-white/30 font-medium"
            style={{ animation: "intro-tagline 0.6s ease forwards", opacity: 0 }}
          >
            AI-Powered CAD Design
          </p>
        )}
      </div>

      {/* Corner bracket decorations */}
      {(phase === "type" || phase === "burst") && (
        <>
          {[
            { top: "10%", left: "8%",  rotate: "0deg"    },
            { top: "10%", right: "8%", rotate: "90deg"   },
            { bottom: "10%", left: "8%",  rotate: "270deg" },
            { bottom: "10%", right: "8%", rotate: "180deg" },
          ].map((pos, i) => (
            <div
              key={i}
              className="absolute w-8 h-8 pointer-events-none"
              style={{
                ...pos,
                transform: `rotate(${pos.rotate})`,
                borderTop: "2px solid rgba(37,99,235,0.5)",
                borderLeft: "2px solid rgba(37,99,235,0.5)",
                animation: `intro-corner 0.4s ${0.1 * i}s ease forwards`,
                opacity: 0,
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}
