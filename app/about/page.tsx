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
    image: "/AbhijeetHeadshot.png" as string | null,
    objectPosition: "center center",
    socials: [{ label: "LinkedIn", href: "https://www.linkedin.com/in/abhijeet-chopra-473383319/" }],
  },
];

// snap-start + snap-stop-always
const snap: React.CSSProperties = { scrollSnapAlign: "start", scrollSnapStop: "always" };

export default function AboutPage() {
  useEffect(() => {
    window.location.href = "/";
  }, []);

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

  return null;
}
