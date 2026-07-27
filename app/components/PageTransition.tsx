"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { setPageTransitioning } from "@/lib/pageTransitionState";

interface PageTransitionProps {
  children: ReactNode;
}

const EXIT_DURATION = 260;
const ENTER_DURATION = 420;

function isSameOriginNavigableLink(anchor: HTMLAnchorElement) {
  if (!anchor.href) return false;
  if (anchor.hasAttribute("download")) return false;
  if (anchor.target && anchor.target !== "_self") return false;

  const url = new URL(anchor.href, window.location.href);
  return url.origin === window.location.origin;
}

/**
 * Whole-page route transition: clicking an internal link plays the exit
 * animation on the *currently mounted* page first, then triggers the actual
 * navigation only once the exit finishes, then plays the enter animation on
 * the new page. Navigation is deliberately gated behind the exit animation
 * rather than reacting to route changes after the fact — Next streams the
 * new route's RSC payload in as a separate commit from the pathname update,
 * so reacting after the fact races and lets the new page flash in unanimated
 * before the transition can catch up.
 */
export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [displayPathname, setDisplayPathname] = useState(pathname);
  const [frozen, setFrozen] = useState<ReactNode | null>(null);
  const [phase, setPhase] = useState<"idle" | "out" | "in">("idle");

  const childrenRef = useRef(children);
  childrenRef.current = children;

  const pendingHrefRef = useRef<string | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as HTMLElement | null)?.closest("a");
      if (!anchor || !isSameOriginNavigableLink(anchor)) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.pathname === pathname) return;

      e.preventDefault();
      pendingHrefRef.current = url.pathname + url.search + url.hash;

      setFrozen(childrenRef.current);
      setPhase("out");
      setPageTransitioning(true);

      setTimeout(() => {
        // scroll: false — we jump to the top ourselves at the swap, before
        // paint, so the reposition is never visible.
        if (pendingHrefRef.current) router.push(pendingHrefRef.current, { scroll: false });
      }, EXIT_DURATION);
    };

    // Capture phase: Next's <Link> attaches its own click handler that runs
    // during the bubble phase and navigates immediately. Intercepting on the
    // capture phase guarantees this handler runs first, so preventDefault()
    // actually stops that handler from firing.
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [pathname, router]);

  // Once the navigation we triggered actually resolves (pathname catches up),
  // swap in the live (now-current) children and play the enter animation.
  // The instant jump to top happens here, inside a layout effect — after the
  // old page is gone but before the new one paints — so neither page is ever
  // seen scrolling.
  useLayoutEffect(() => {
    if (phase !== "out" || pathname === displayPathname) return;

    // behavior: "instant" — the site sets `scroll-behavior: smooth` globally,
    // which would turn a plain scrollTo(0,0) into a visible animated scroll.
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    setDisplayPathname(pathname);
    setPhase("in");
    pendingHrefRef.current = null;
  }, [pathname, phase, displayPathname]);

  useEffect(() => {
    if (phase !== "in") return;

    const inTimer = setTimeout(() => {
      setPhase("idle");
      setFrozen(null);
      setPageTransitioning(false);
    }, ENTER_DURATION);
    return () => clearTimeout(inTimer);
  }, [phase]);

  const showingFrozen = phase === "out";

  return (
    <div
      key={displayPathname}
      style={
        phase === "out"
          ? { animation: `page-fade-out ${EXIT_DURATION}ms cubic-bezier(0.4,0,0.2,1) forwards` }
          : phase === "in"
          ? { animation: `page-fade-in ${ENTER_DURATION}ms cubic-bezier(0.16,1,0.3,1) forwards` }
          : undefined
      }
    >
      {showingFrozen ? frozen : children}
    </div>
  );
}
