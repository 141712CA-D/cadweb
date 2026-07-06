"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

interface MorphSwitchProps {
  /** Unique key identifying which content variant is active (e.g. "individual" | "team") */
  activeKey: string;
  /** The content to render for the current activeKey */
  children: ReactNode;
  /** Total transition duration in ms (default 320) */
  duration?: number;
  className?: string;
}

/**
 * Smoothly morphs between two content variants with no overlap: the outgoing
 * content (a frozen snapshot) fades out first, then the live incoming content
 * fades in, while the container height animates between the two natural heights.
 *
 * Unlike a naive "cache the children" approach, the live `children` prop is
 * rendered as soon as the incoming phase starts, so subsequent updates
 * (typing, validation errors, etc.) are reflected immediately — only the
 * brief exit animation uses a frozen snapshot of the previous content.
 */
export default function MorphSwitch({ activeKey, children, duration = 320, className = "" }: MorphSwitchProps) {
  const [displayKey, setDisplayKey] = useState(activeKey);
  const [frozen, setFrozen] = useState<ReactNode | null>(null);
  const [height, setHeight] = useState<number | "auto">("auto");
  const [phase, setPhase] = useState<"idle" | "out" | "in">("idle");

  const contentRef = useRef<HTMLDivElement>(null);
  // Tracks the most recently rendered children so we can snapshot the *previous*
  // content the instant activeKey changes (React batches the key + children
  // update together, so by the time an effect runs, `children` is already new).
  const lastChildrenRef = useRef(children);
  const prevChildrenForTransition = lastChildrenRef.current;
  lastChildrenRef.current = children;

  const outDuration = Math.round(duration * 0.4);
  const inDuration = duration - outDuration;

  // Trigger the exit phase whenever the active key changes.
  useLayoutEffect(() => {
    if (activeKey === displayKey) return;

    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
    setFrozen(prevChildrenForTransition);
    setPhase("out");

    const outTimer = setTimeout(() => {
      setDisplayKey(activeKey);
      setPhase("in");
    }, outDuration);

    return () => clearTimeout(outTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey]);

  // Once the new (live) content is mounted, measure it and animate the height in, then settle.
  useLayoutEffect(() => {
    if (phase !== "in" || !contentRef.current) return;

    setHeight(contentRef.current.scrollHeight);

    const inTimer = setTimeout(() => {
      setPhase("idle");
      setFrozen(null);
    }, inDuration);
    return () => clearTimeout(inTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, displayKey]);

  // While settled, keep height in sync with live content changes (e.g. a sub-field appearing).
  useLayoutEffect(() => {
    if (phase !== "idle" || !contentRef.current) return;
    const el = contentRef.current;
    setHeight(el.scrollHeight);
    const ro = new ResizeObserver(() => setHeight(el.scrollHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [phase, displayKey, children]);

  const showingFrozen = phase === "out";

  return (
    <div
      className={`overflow-hidden ${className}`}
      style={{ height, transition: `height ${duration}ms cubic-bezier(0.4,0,0.2,1)` }}
    >
      <div
        ref={contentRef}
        key={displayKey}
        style={
          phase === "out"
            ? { animation: `morph-fade-out ${outDuration}ms cubic-bezier(0.4,0,0.2,1) forwards` }
            : phase === "in"
            ? { animation: `morph-fade-in ${inDuration}ms cubic-bezier(0.4,0,0.2,1) forwards` }
            : { opacity: 1 }
        }
      >
        {showingFrozen ? frozen : children}
      </div>
    </div>
  );
}
