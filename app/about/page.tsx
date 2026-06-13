"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import DevBanner from "../components/DevBanner";
import Header from "../components/Header";

const icons: Record<string, React.ReactNode> = {
  LinkedIn: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  ),
  Website: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="12" cy="12" r="10"/>
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
};

const team = [
  {
    name: "Andrew Yang",
    role: "Co-Founder",
    major: "Mechanical Engineering",
    university: "University of Michigan · Class of 2029",
    bio: "Andrew is a CAD enthusiast from New York with a passion for turning ideas into real, engineered designs. A robotics warrior at heart, he competed at the FIRST Worlds Robotics Competition in high school — where precision design and fast iteration weren't optional. That drive is exactly what he's bringing to Parametra.",
    image: "/AndyHeadshot.png" as string | null,
    objectPosition: "center 15%",
    socials: [{ label: "LinkedIn", href: "https://www.linkedin.com/in/andrew-yang-1205b8383/" }],
  },
  {
    name: "Sandeep Sawhney",
    role: "Co-Founder",
    major: "Computer Engineering",
    university: "University of Michigan · Class of 2029",
    bio: "Sandeep is a builder from New York at the intersection of AI/ML and hardware, with a deep focus on embedded systems applications. Before Michigan, he was deep in academic research — working in Biomedical Engineering and earning a finalist spot at the Regeneron Science Talent Search. He brings that same research-driven rigor to building the intelligence behind Parametra.",
    image: "/SandeepHeashot.jpg" as string | null,
    objectPosition: "center top",
    socials: [
      { label: "LinkedIn", href: "https://www.linkedin.com/in/sandeep-sawhney-894b12301/" },
      { label: "Website", href: "https://sandeepsawhney.dev/" },
    ],
  },
  {
    name: "Abhijeet Chopra",
    role: "Co-Founder",
    major: "Computer Science",
    university: "New York University · Class of 2029",
    bio: "Abhijeet is a software engineer from New York building the product experience and web infrastructure behind Parametra. He's driven by the belief that powerful tools should feel effortless — and that the gap between a great idea and a finished CAD model should be a lot smaller than it is. He joined Parametra to help close that gap.",
    image: null as string | null,
    objectPosition: "center center",
    socials: [{ label: "LinkedIn", href: "https://www.linkedin.com/in/abhijeet-chopra-473383319/" }],
  },
];

// snap-start + snap-stop-always
const snap: React.CSSProperties = { scrollSnapAlign: "start", scrollSnapStop: "always" };

export default function AboutPage() {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [showNudge, setShowNudge] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeIndexRef = useRef(-1);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onScroll = () => {
      const idx = Math.max(-1, Math.min(team.length, Math.round(container.scrollTop / window.innerHeight) - 1));
      setActiveIndex(idx);
      activeIndexRef.current = idx;
      if (container.scrollTop > 60) setShowNudge(false);
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setShowNudge(true), 2000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      e.preventDefault();
      const next = e.key === "ArrowDown"
        ? activeIndexRef.current + 1
        : activeIndexRef.current - 1;
      const clamped = Math.max(-1, Math.min(team.length, next));
      containerRef.current?.scrollTo({
        top: Math.max(0, (clamped + 1) * window.innerHeight),
        behavior: "smooth",
      });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const scrollToMember = (i: number) => {
    containerRef.current?.scrollTo({ top: (i + 1) * window.innerHeight, behavior: "smooth" });
  };

  // Which card is "on top" of the deck (clamped for when heading/mission is active)
  const deckIndex = Math.max(0, Math.min(team.length - 1, activeIndex));
  const showNodes = activeIndex >= 0 && activeIndex < team.length;

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-y-scroll"
      style={{ scrollSnapType: "y mandatory" }}
    >
      {/* Background */}
      <div className="grid-bg fixed inset-0 pointer-events-none z-0" />
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="orb-1 absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(199,226,255,0.5) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div className="orb-2 absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(199,226,255,0.35) 0%, transparent 70%)", filter: "blur(40px)" }} />
      </div>

      {/* Page background */}
      <div className="fixed inset-0 bg-[#F5F0E8] -z-10" />

      <DevBanner />
      <Header />

      {/* Left node indicator */}
      <div
        className="fixed left-6 sm:left-12 top-1/2 -translate-y-1/2 hidden sm:flex flex-col items-start z-50 transition-opacity duration-500"
        style={{ opacity: showNodes ? 1 : 0, pointerEvents: showNodes ? "auto" : "none" }}
      >
        {team.map((member, i) => (
          <React.Fragment key={member.name}>
            <button onClick={() => scrollToMember(i)} className="py-1 cursor-pointer">
              <div
                className={`w-2 h-2 rounded-full transition-all duration-500 ${activeIndex === i ? "bg-blue-600" : "bg-slate-300"}`}
              />
            </button>
            {i < team.length - 1 && (
              <div className="w-px ml-[3px] bg-slate-200" style={{ height: "32px" }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Mobile dot indicator */}
      <div
        className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:hidden z-50 transition-opacity duration-500"
        style={{ opacity: showNodes ? 1 : 0, pointerEvents: showNodes ? "auto" : "none" }}
      >
        {team.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollToMember(i)}
            className={`h-1.5 rounded-full transition-all duration-500 ${activeIndex === i ? "bg-blue-600" : "bg-slate-300"}`}
            style={{ width: activeIndex === i ? "16px" : "6px" }}
          />
        ))}
      </div>

      {/* ── Section 1: Heading ── */}
      <div className="h-screen flex items-center justify-center relative z-10" style={snap}>
        <div className="text-center px-4">
          <p className="text-xs text-slate-500 tracking-widest uppercase font-mono mb-4">The team</p>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight">
            <span className="gradient-text">Meet the brains</span>
            <br />
            <span className="text-slate-800">behind Parametra.</span>
          </h1>
        </div>

        <div
          className={`absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 transition-all duration-700 ${
            showNudge ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
          }`}
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-400">scroll</span>
          <svg className="h-4 w-4 animate-bounce text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/*
        ── Section 2: Card deck ──
        300vh tall. First 100vh = Andy, next = Sandeep, last = Abhijeet.
        Invisible snap-point divs inside create the per-card snap stops.
        The sticky inner shows the deck at the right state for each position.
      */}
      <div className="relative z-10" style={{ minHeight: "300vh", ...snap }}>

        {/* Invisible snap points for Sandeep and Abhijeet */}
        <div style={{ position: "absolute", top: "100vh", height: "1px", width: "100%", ...snap }} />
        <div style={{ position: "absolute", top: "200vh", height: "1px", width: "100%", ...snap }} />

        {/* Sticky card display */}
        <div className="sticky top-0 h-screen flex items-center justify-center px-4 sm:px-20 pt-24 sm:pt-0" style={{ overflow: "visible" }}>

          <div className="relative w-full max-w-4xl h-[650px] sm:h-[450px] pb-16">
            {team.map((member, cardIndex) => {
              const diff = cardIndex - deckIndex;

              let cardStyle: React.CSSProperties;
              if (diff < 0) {
                cardStyle = { transform: "translateY(-110%)", opacity: 0, zIndex: 0, pointerEvents: "none" };
              } else if (diff === 0) {
                cardStyle = { transform: "translateY(0px) scale(1)", transformOrigin: "top center", opacity: 1, zIndex: 30 };
              } else if (diff === 1) {
                cardStyle = { transform: "translateY(30px) scale(0.95)", transformOrigin: "top center", opacity: 1, zIndex: 20 };
              } else if (diff === 2) {
                cardStyle = { transform: "translateY(60px) scale(0.90)", transformOrigin: "top center", opacity: 1, zIndex: 10 };
              } else {
                cardStyle = { transform: "translateY(90px) scale(0.85)", transformOrigin: "top center", opacity: 0, zIndex: 0 };
              }

              return (
                <div
                  key={member.name}
                  className="absolute inset-0 transition-all duration-700 ease-in-out"
                  style={cardStyle}
                >
                  <div
                    className={`w-full h-[520px] sm:h-[380px] rounded-2xl border p-5 sm:p-8 flex flex-col sm:flex-row items-center gap-5 sm:gap-10 ${
                      diff === 0
                        ? "bg-white border-slate-200"
                        : "bg-white border-slate-200/60"
                    }`}
                  >
                    {/* Photo */}
                    <div
                      className="relative w-32 h-36 sm:w-44 sm:h-52 rounded-xl overflow-hidden border border-indigo-300/50 flex-shrink-0"
                      style={{ boxShadow: "0 0 30px rgba(199,226,255,0.5)" }}
                    >
                      {member.image ? (
                        <Image
                          src={member.image}
                          alt={member.name}
                          fill
                          className="object-cover"
                          style={{ objectPosition: member.objectPosition }}
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-3xl font-bold text-indigo-500"
                          style={{ background: "linear-gradient(145deg, rgba(199,226,255,0.4) 0%, rgba(199,226,255,0.2) 100%)" }}
                        >
                          {member.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                      )}
                    </div>

                    {/* Text */}
                    <div className="flex flex-col gap-3 items-center text-center sm:items-start sm:text-left flex-1 min-w-0">
                      <div>
                        <p className="text-xs text-blue-600 font-semibold tracking-widest uppercase font-mono mb-1.5">{member.role}</p>
                        <h2 className="text-xl sm:text-3xl font-bold text-slate-900">{member.name}</h2>
                        <p className="text-xs text-slate-500 mt-1 font-mono">{member.major} &nbsp;·&nbsp; {member.university}</p>
                      </div>
                      <div className="w-10 h-px bg-gradient-to-r from-blue-600 to-sky-400" />
                      <p className="text-sm text-slate-600 leading-relaxed max-w-md">{member.bio}</p>
                      <div className="flex items-center gap-3">
                        {member.socials.map((s) => (
                          <Link
                            key={s.label}
                            href={s.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 border border-slate-200 hover:text-blue-600 hover:border-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-full transition-all duration-200"
                          >
                            <span className="sm:hidden">{icons[s.label]}</span>
                            <span className="hidden sm:inline">{s.label}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Section 3: Mission + Footer ── */}
      <div className="min-h-screen flex flex-col relative z-10" style={snap}>
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-16">
          <div className="w-full max-w-2xl">
            <div className="text-center mb-8">
              <p className="text-xs text-slate-500 tracking-widest uppercase font-mono mb-4">Our mission</p>
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                <span className="gradient-text">Why we built</span>
                <br />
                <span className="text-slate-800">Parametra.</span>
              </h2>
            </div>
            <div className="space-y-4 text-sm sm:text-base text-slate-600 leading-relaxed">
              <p>
                Most engineers learn the same lesson early: having a great idea is the easy part. Turning it into a real model — one that&apos;s parameterized, constrained, and ready to manufacture — is where the time goes. Hours in tutorials. Days rebuilding sketches from scratch. Weeks learning software that changes with every version.
              </p>
              <p>
                We built Parametra because that gap shouldn&apos;t exist. If you can describe what you need, you should be able to build it. Whether you&apos;re starting with a napkin sketch, an ASME drawing, or just an idea you can type out — Parametra handles the translation.
              </p>
              <p>
                We&apos;re three engineers from New York who got tired of watching great ideas get slowed down by tooling. Parametra is our answer: AI that speaks CAD, so you can focus on what you actually want to build.
              </p>
            </div>
          </div>
        </div>

        <footer className="bg-[#F5F0E8] border-t border-slate-300 py-6 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-700">© {new Date().getFullYear()} Parametra. All rights reserved.</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:flex sm:items-center sm:gap-6">
              <Link href="/contact" className="text-xs text-slate-800 hover:text-slate-900 transition-colors">Contact us</Link>
              <Link href="/signup" className="text-xs text-slate-800 hover:text-slate-900 transition-colors">Join waitlist</Link>
              <Link href="/terms" className="text-xs text-slate-800 hover:text-slate-900 transition-colors">Terms</Link>
              <Link href="/privacy-policy" className="text-xs text-slate-800 hover:text-slate-900 transition-colors">Privacy</Link>
            </div>
          </div>
        </footer>
      </div>

    </div>
  );
}
