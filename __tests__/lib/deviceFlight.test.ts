import { describe, expect, it } from "vitest";
import {
  DOCK_MARKER_TOP_SVH,
  DOCK_P,
  ENTRY_END,
  RUNWAY_SVH,
  flightAt,
  progressFor,
  transformFor,
} from "@/lib/deviceFlight";

// The flight is the one piece of the device animation with real geometry in it,
// and it's invisible to the component tests (jsdom has no layout). These lock
// down the shape of the curve: continuity at the band edge, a docked band that
// is genuinely still all the way to the end of the runway, and a dock marker
// that lands inside it.

describe("flightAt", () => {
  it("starts off-stage: left, pushed back, rotated, and faint", () => {
    const f = flightAt(0);
    expect(f.tx).toBeLessThan(-20);
    expect(f.tz).toBeLessThan(-500);
    expect(f.ry).toBeGreaterThan(20);
    expect(f.opacity).toBeGreaterThan(0);
    expect(f.opacity).toBeLessThan(0.5);
    expect(f.chrome).toBe(1);
    expect(f.docked).toBe(false);
  });

  it("docks at ENTRY_END and never moves again — there is no fly-out", () => {
    for (let p = ENTRY_END; p <= 1.0001; p += 0.01) {
      expect(flightAt(p), `p=${p.toFixed(2)} should be docked`).toEqual({
        tx: 0,
        tz: 0,
        rx: 0,
        ry: 0,
        opacity: 1,
        chrome: 0,
        docked: true,
      });
    }
  });

  it("is still docked at the very end of the runway", () => {
    expect(flightAt(1).docked).toBe(true);
    expect(flightAt(1).opacity).toBe(1);
  });

  it("hands back a frozen docked frame, so a stray write can't poison later frames", () => {
    // The docked band returns one shared constant rather than allocating per
    // scroll frame. That's only safe while it stays immutable.
    const f = flightAt(DOCK_P) as { tx: number };
    expect(Object.isFrozen(f)).toBe(true);
    expect(() => { f.tx = 999; }).toThrow();
    expect(flightAt(DOCK_P).tx).toBe(0);
  });

  it("moves monotonically left-to-right through the whole runway", () => {
    let prev = -Infinity;
    for (let p = 0; p <= 1.0001; p += 0.02) {
      const { tx } = flightAt(p);
      expect(tx, `tx regressed at p=${p.toFixed(2)}`).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = tx;
    }
  });

  it("has no jumps — consecutive samples stay close together", () => {
    // Thresholds are ~10% of each value's full travel. The eased curve is
    // steepest right at p=0, so a real seam (the entry not meeting the docked
    // band) shows up as a step several times larger than anything legitimate.
    let prev = flightAt(0);
    for (let p = 0.005; p <= 1.0001; p += 0.005) {
      const f = flightAt(p);
      expect(Math.abs(f.tx - prev.tx), `tx jumped at p=${p.toFixed(3)}`).toBeLessThan(4);
      expect(Math.abs(f.tz - prev.tz), `tz jumped at p=${p.toFixed(3)}`).toBeLessThan(125);
      expect(Math.abs(f.chrome - prev.chrome), `chrome jumped at p=${p.toFixed(3)}`).toBeLessThan(0.15);
      prev = f;
    }
  });

  it("clamps out-of-range progress instead of extrapolating", () => {
    expect(flightAt(-3)).toEqual(flightAt(0));
    expect(flightAt(9)).toEqual(flightAt(1));
  });
});

describe("progressFor", () => {
  const VIEWPORT = 800;
  const RUNWAY = VIEWPORT * 2.4;

  it("is 0 before the runway sticks and 1 once it's fully travelled", () => {
    expect(progressFor({ top: 0, height: RUNWAY }, VIEWPORT)).toBe(0);
    expect(progressFor({ top: -(RUNWAY - VIEWPORT), height: RUNWAY }, VIEWPORT)).toBe(1);
  });

  it("clamps rather than running past either end", () => {
    expect(progressFor({ top: 500, height: RUNWAY }, VIEWPORT)).toBe(0);
    expect(progressFor({ top: -9999, height: RUNWAY }, VIEWPORT)).toBe(1);
  });

  it("parks at the dock when there's no runway to travel (jsdom, huge viewports)", () => {
    expect(progressFor({ top: 0, height: 0 }, VIEWPORT)).toBe(DOCK_P);
    expect(flightAt(progressFor({ top: 0, height: 0 }, VIEWPORT)).docked).toBe(true);
  });
});

describe("dock marker", () => {
  it("lands inside the docked band, so starting the demo never strands it mid-flight", () => {
    // scrollIntoView({block:"start"}) puts the marker at the viewport top, i.e.
    // rect.top === -DOCK_MARKER_TOP_SVH once expressed in px.
    const viewport = 800;
    const height = (RUNWAY_SVH / 100) * viewport;
    const top = -(DOCK_MARKER_TOP_SVH / 100) * viewport;

    const p = progressFor({ top, height }, viewport);
    expect(p).toBeCloseTo(DOCK_P, 5);
    expect(flightAt(p).docked).toBe(true);
  });

  it("still docks when the visual viewport is taller than 100svh (mobile URL bar)", () => {
    const svh = 800;
    const height = (RUNWAY_SVH / 100) * svh;
    const top = -(DOCK_MARKER_TOP_SVH / 100) * svh;

    // Address bar collapsed: innerHeight overshoots svh by ~12%.
    const p = progressFor({ top, height }, svh * 1.12);
    expect(flightAt(p).docked).toBe(true);
  });
});

describe("transformFor", () => {
  it("drops the transform entirely when docked, so text renders crisp", () => {
    expect(transformFor(flightAt(DOCK_P))).toBe("none");
  });

  it("emits a 3D transform mid-flight", () => {
    const t = transformFor(flightAt(0.05));
    expect(t).toMatch(/^translate3d\(-?[\d.]+%, 0, -?[\d.]+px\) rotateX\(.*deg\) rotateY\(.*deg\)$/);
  });
});
