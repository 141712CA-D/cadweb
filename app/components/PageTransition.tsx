"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

const EXIT_DURATION = 260;
const ENTER_DURATION = 420;

/**
 * Whole-page route transition: the outgoing page (a frozen snapshot) fades
 * out while falling downward, then the new page fades in while flowing
 * upward into place. Mirrors MorphSwitch's frozen-snapshot exit / live entry
 * technique, keyed on the route pathname instead of a form tab key.
 */
export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const [displayPathname, setDisplayPathname] = useState(pathname);
  const [frozen, setFrozen] = useState<ReactNode | null>(null);
  const [phase, setPhase] = useState<"idle" | "out" | "in">("idle");

  // React batches the pathname + children update together, so by the time an
  // effect runs, `children` already reflects the new route. Snapshot the
  // previous children on every render so it's available the instant the
  // pathname changes.
  const lastChildrenRef = useRef(children);
  const prevChildrenForTransition = lastChildrenRef.current;
  lastChildrenRef.current = children;

  useLayoutEffect(() => {
    if (pathname === displayPathname) return;

    setFrozen(prevChildrenForTransition);
    setPhase("out");

    const outTimer = setTimeout(() => {
      setDisplayPathname(pathname);
      setPhase("in");
    }, EXIT_DURATION);

    return () => clearTimeout(outTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useLayoutEffect(() => {
    if (phase !== "in") return;

    const inTimer = setTimeout(() => {
      setPhase("idle");
      setFrozen(null);
    }, ENTER_DURATION);
    return () => clearTimeout(inTimer);
  }, [phase, displayPathname]);

  const showingFrozen = phase === "out";

  return (
    <div
      key={displayPathname}
      style={
        phase === "out"
          ? { animation: `page-fade-out-down ${EXIT_DURATION}ms cubic-bezier(0.4,0,0.2,1) forwards` }
          : phase === "in"
          ? { animation: `page-fade-in-up ${ENTER_DURATION}ms cubic-bezier(0.16,1,0.3,1) forwards` }
          : undefined
      }
    >
      {showingFrozen ? frozen : children}
    </div>
  );
}
