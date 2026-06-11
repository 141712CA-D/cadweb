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
    primaryHref: "https://www.linkedin.com/in/andrew-yang-1205b8383/",
    socials: [
      { label: "LinkedIn", href: "https://www.linkedin.com/in/andrew-yang-1205b8383/" },
    ],
  },
  {
    name: "Sandeep Sawhney",
    role: "Co-Founder",
    major: "Computer Engineering",
    university: "University of Michigan · Class of 2029",
    bio: "Sandeep is a builder from New York at the intersection of AI/ML and hardware, with a deep focus on embedded systems applications. Before Michigan, he was deep in academic research — working in Biomedical Engineering and earning a finalist spot at the Regeneron Science Talent Search, one of the most prestigious science competitions in the country. He brings that same research-driven rigor to building the intelligence behind Parametra.",
    image: "/SandeepHeashot.jpg" as string | null,
    objectPosition: "center top",
    primaryHref: "https://sandeepsawhney.dev/",
    socials: [
      { label: "LinkedIn", href: "https://www.linkedin.com/in/sandeep-sawhney-894b12301/" },
      { label: "Website", href: "https://sandeepsawhney.dev/" },
    ],
  },
  {
    name: "Abhijeet Chopra",
    role: "Founding Software Engineer",
    major: "Computer Science",
    university: "New York University",
    bio: "Abhijeet is a software engineer from New York building the product experience and web infrastructure behind Parametra. He's driven by the belief that powerful tools should feel effortless — and that the gap between a great idea and a finished CAD model should be a lot smaller than it is. He joined Parametra to help close that gap.",
    image: null as string | null,
    objectPosition: "center center",
    primaryHref: "https://www.linkedin.com/in/abhijeet-chopra-473383319/",
    socials: [
      { label: "LinkedIn", href: "https://www.linkedin.com/in/abhijeet-chopra-473383319/" },
    ],
  },
];

export default function AboutPage() {
  const [headingProgress, setHeadingProgress] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [missionProgress, setMissionProgress] = useState(0);
  const [showNudge, setShowNudge] = useState(false);

  const headingRef = useRef<HTMLDivElement>(null);
  const teamRef = useRef<HTMLDivElement>(null);
  const missionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;

      if (headingRef.current) {
        const top = headingRef.current.getBoundingClientRect().top + scrollY;
        const scrollable = headingRef.current.offsetHeight - vh;
        setHeadingProgress(Math.max(0, Math.min(1, (scrollY - top) / scrollable)));
      }

      if (teamRef.current) {
        const top = teamRef.current.getBoundingClientRect().top + scrollY;
        const scrolled = scrollY - top;
        setActiveIndex(Math.max(0, Math.min(team.length - 1, Math.floor(scrolled / vh))));
      }

      if (missionRef.current) {
        const top = missionRef.current.getBoundingClientRect().top + scrollY;
        const scrollable = missionRef.current.offsetHeight - vh;
        setMissionProgress(Math.max(0, Math.min(1, (scrollY - top) / scrollable)));
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowNudge(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onScroll = () => { if (window.scrollY > 60) setShowNudge(false); };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNodeClick = (i: number) => {
    if (!teamRef.current) return;
    const top = teamRef.current.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + i * window.innerHeight, behavior: "smooth" });
  };

  const headingStyle = {
    transform: `translateY(${-headingProgress * 80}px)`,
    opacity: Math.max(0, 1 - headingProgress * 2),
  };

  const missionStyle = {
    transform: `translateY(${(1 - Math.min(1, missionProgress * 4)) * 60}px)`,
    opacity: Math.min(1, missionProgress * 4),
  };

  return (
    <div className="relative bg-black">

      <div className="grid-bg fixed inset-0 pointer-events-none" />
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="orb-1 absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)", filter: "blur(40px)" }}
        />
        <div
          className="orb-2 absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(14,165,233,0.10) 0%, transparent 70%)", filter: "blur(40px)" }}
        />
      </div>

      <DevBanner />
      <Header />

      {/* Section 1 — Heading */}
      <div ref={headingRef} style={{ minHeight: "180vh" }} className="relative z-10">
        <div className="sticky top-0 h-screen flex items-center justify-center relative">
          <div style={headingStyle} className="text-center px-4">
            <p className="text-xs text-white/30 tracking-widest uppercase font-mono mb-4">The team</p>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight">
              <span className="gradient-text">Meet the brains</span>
              <br />
              <span className="text-white/90">behind Parametra.ai</span>
            </h1>
          </div>

          {/* Scroll nudge */}
          <div
            className={`absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 transition-all duration-700 ${
              showNudge ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
            }`}
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/35">scroll</span>
            <svg className="h-4 w-4 animate-bounce text-white/30" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>

        </div>
      </div>

      {/* Section 2 — Team */}
      <div ref={teamRef} style={{ minHeight: `${(team.length + 1) * 100}vh` }} className="relative z-10">
        <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">

          {/* Left node indicator */}
          <div className="absolute left-6 sm:left-12 top-1/2 -translate-y-1/2 hidden sm:flex flex-col items-start z-10">
            {team.map((member, i) => (
              <React.Fragment key={member.name}>
                <button onClick={() => handleNodeClick(i)} className="flex items-center gap-3 py-1 cursor-pointer">
                  <div
                    className="w-2 h-2 rounded-full transition-all duration-500 flex-shrink-0"
                    style={{
                      background: activeIndex === i ? "rgba(96,165,250,1)" : "rgba(255,255,255,0.15)",
                      boxShadow: activeIndex === i ? "0 0 8px rgba(37,99,235,0.8)" : "none",
                    }}
                  />
                  <span
                    className="text-xs font-mono transition-all duration-500 whitespace-nowrap"
                    style={{ color: activeIndex === i ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.15)" }}
                  >
                    {member.name.split(" ")[0]}
                  </span>
                </button>
                {i < team.length - 1 && (
                  <div className="w-px ml-[3px]" style={{ height: "32px", background: "rgba(255,255,255,0.08)" }} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Member sections */}
          <div className="absolute inset-0">
            {team.map((member, i) => (
              <div
                key={member.name}
                className="absolute inset-0 flex items-center justify-center transition-opacity duration-700 px-4 sm:px-24"
                style={{
                  opacity: activeIndex === i ? 1 : 0,
                  pointerEvents: activeIndex === i ? "auto" : "none",
                }}
              >
                <div className="w-full max-w-5xl flex flex-col sm:flex-row items-center gap-10 sm:gap-16">

                  {/* Photo */}
                  <div
                    className="relative w-48 h-56 sm:w-64 sm:h-80 rounded-2xl overflow-hidden border border-blue-500/20 flex-shrink-0"
                    style={{ boxShadow: "0 0 60px rgba(37,99,235,0.2)" }}
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
                        className="w-full h-full flex items-center justify-center text-4xl font-bold text-blue-300"
                        style={{ background: "linear-gradient(145deg, rgba(37,99,235,0.3) 0%, rgba(14,165,233,0.2) 100%)" }}
                      >
                        {member.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex flex-col gap-5 items-center text-center sm:items-start sm:text-left flex-1 min-w-0">
                    <div>
                      <p className="text-xs text-blue-400/60 tracking-widest uppercase font-mono mb-2">{member.role}</p>
                      <h2 className="text-3xl sm:text-5xl font-bold text-white">{member.name}</h2>
                      <p className="text-sm text-white/30 mt-2 font-mono">{member.major} &nbsp;·&nbsp; {member.university}</p>
                    </div>
                    <div className="w-12 h-px bg-gradient-to-r from-blue-500/40 to-sky-400/40" />
                    <p className="text-sm sm:text-base text-white/40 leading-relaxed max-w-lg">{member.bio}</p>
                    <div className="flex items-center gap-3">
                      {member.socials.map((s) => (
                        <Link
                          key={s.label}
                          href={s.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-xs font-mono text-blue-400/60 hover:text-blue-400 border border-blue-500/20 hover:border-blue-500/50 px-3 py-1.5 rounded-full transition-all duration-200"
                        >
                          <span className="sm:hidden">{icons[s.label]}</span>
                          <span className="hidden sm:inline">{s.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>

          {/* Mobile dot indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:hidden z-10">
            {team.map((_, i) => (
              <button
                key={i}
                onClick={() => handleNodeClick(i)}
                className="h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: activeIndex === i ? "16px" : "6px",
                  background: activeIndex === i ? "rgba(96,165,250,1)" : "rgba(255,255,255,0.2)",
                }}
              />
            ))}
          </div>

        </div>
      </div>

      {/* Section 3 — Mission */}
      <div ref={missionRef} style={{ minHeight: "180vh" }} className="relative z-10">
        <div className="sticky top-0 h-screen flex items-center justify-center">
          <div style={missionStyle} className="w-full max-w-2xl px-4 sm:px-6">
            <div className="text-center mb-8">
              <p className="text-xs text-white/30 tracking-widest uppercase font-mono mb-4">Our mission</p>
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                <span className="gradient-text">Why we built</span>
                <br />
                <span className="text-white/90">Parametra.</span>
              </h2>
            </div>
            <div className="space-y-4 text-sm sm:text-base text-white/40 leading-relaxed">
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
      </div>

      {/* Footer */}
      <footer className="relative z-10 bg-black border-t border-white/5 py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/20">© {new Date().getFullYear()} Parametra.ai. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/contact" className="text-xs text-white/25 hover:text-white/60 transition-colors">Contact us</Link>
            <Link href="/signup" className="text-xs text-white/25 hover:text-white/60 transition-colors">Join waitlist</Link>
            <Link href="/terms" className="text-xs text-white/25 hover:text-white/60 transition-colors">Terms</Link>
            <Link href="/privacy-policy" className="text-xs text-white/25 hover:text-white/60 transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
