/**
 * Scroll-driven flight path for the live-demo window.
 *
 * The demo section is a tall scroll runway with a sticky, viewport-tall stage
 * inside it. As the runway scrolls, the window flies in from the back-left as a
 * closed-up device (MacBook on desktop, phone on mobile), rotates to face the
 * viewer and dissolves its shell as it docks — and then simply stays there.
 * There is deliberately no fly-out: once docked the window holds its position
 * for the rest of the runway and leaves the same way any other section does,
 * by scrolling off the top.
 *
 * This module is pure on purpose — the geometry is the part worth testing, and
 * DemoSection just maps the result onto one element's inline style per frame.
 */

export interface FlightFrame {
  /** X offset as a percentage of the element's own width. */
  tx: number;
  /** Z offset in px. Negative = away from the viewer, positive = toward it. */
  tz: number;
  /** Rotation about the horizontal axis, degrees. */
  rx: number;
  /** Rotation about the vertical axis, degrees. */
  ry: number;
  opacity: number;
  /** 1 = full device shell, 0 = bare window. Drives the `--chrome` CSS var. */
  chrome: number;
  /** True only in the still band — the window is interactive exactly here. */
  docked: boolean;
}

/** Progress at which the fly-in finishes. Everything past this is docked. */
export const ENTRY_END = 0.42;
/**
 * Middle of the docked band — where startDemo scrolls to. Sitting mid-band
 * rather than right on ENTRY_END keeps a scroll nudge from tipping the window
 * back into flight while the demo is running.
 */
export const DOCK_P = (ENTRY_END + 1) / 2;

/**
 * Total runway height, in svh. The sticky stage inside it is 100svh, so the
 * runway travels RUNWAY_SVH - 100: enough to play the fly-in and then hold the
 * docked demo on screen for a beat before the section scrolls away.
 */
export const RUNWAY_SVH = 170;

/**
 * Offset of the dock scroll marker from the top of the runway, in svh.
 * Scrolling that marker to the top of the viewport lands progress on DOCK_P.
 */
export const DOCK_MARKER_TOP_SVH = DOCK_P * (RUNWAY_SVH - 100);

export const DOCKED_FRAME: FlightFrame = {
  tx: 0,
  tz: 0,
  rx: 0,
  ry: 0,
  opacity: 1,
  chrome: 0,
  docked: true,
};

// Written to fold -0 and NaN down to 0 as well as clamping — a stray -0 would
// otherwise surface as "-0.00%" in the transform string.
const clamp01 = (v: number) => (v > 0 ? (v > 1 ? 1 : v) : 0);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Maps scroll progress through the runway (0 → 1) onto a frame of the flight.
 * Values outside [0, 1] are clamped, so callers don't have to.
 */
export function flightAt(p: number): FlightFrame {
  const t = clamp01(p);

  // Fly in: far back-left → docked, shell dissolving over the second half.
  if (t < ENTRY_END) {
    const e = easeOutCubic(t / ENTRY_END);
    return {
      tx: lerp(-38, 0, e),
      tz: lerp(-1250, 0, e),
      rx: lerp(9, 0, e),
      ry: lerp(34, 0, e),
      // Already faintly visible at rest so the device is there as the section
      // slides up, rather than popping in once the runway starts moving.
      opacity: lerp(0.28, 1, clamp01(e * 2.2)),
      chrome: 1 - clamp01((e - 0.5) / 0.5),
      docked: false,
    };
  }

  // Docked, and it stays that way — the window holds position for the rest of
  // the runway and then scrolls off the top like any other section.
  return DOCKED_FRAME;
}

/**
 * Progress of the runway through the viewport, 0 → 1.
 * Returns 1 (docked) when there's no runway to travel — a viewport taller than
 * the section, or a non-layout environment like jsdom.
 */
export function progressFor(rect: { top: number; height: number }, viewportH: number): number {
  const travel = rect.height - viewportH;
  if (travel <= 0) return DOCK_P;
  return clamp01(-rect.top / travel);
}

/** Builds the CSS transform for a frame. Docked frames get `none` for crisp text. */
export function transformFor(f: FlightFrame): string {
  if (f.docked) return "none";
  return `translate3d(${f.tx.toFixed(2)}%, 0, ${f.tz.toFixed(1)}px) rotateX(${f.rx.toFixed(2)}deg) rotateY(${f.ry.toFixed(2)}deg)`;
}
