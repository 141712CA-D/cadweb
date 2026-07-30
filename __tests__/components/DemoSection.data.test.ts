import { describe, expect, it } from "vitest";
import {
  APP_SCRIPT,
  DOCUMENTS,
  GRAPH_EDGES,
  GRAPH_NODES,
  HISTORY_EVENTS,
  PART_STUDIOS,
  SESSION_CHIPS,
} from "@/app/components/DemoSection";

// The demo is data-driven: APP_SCRIPT reveals DOCUMENTS / PART_STUDIOS /
// SESSION_CHIPS / GRAPH_NODES by count, and GRAPH_EDGES reference nodes by id.
// These invariants catch silent breakage when the script is edited (an
// overshooting count or a typo'd node id would simply never appear on screen).

describe("DemoSection app script data", () => {
  it("runs steps in chronological order", () => {
    for (let i = 1; i < APP_SCRIPT.length; i++) {
      expect(APP_SCRIPT[i].delay).toBeGreaterThan(APP_SCRIPT[i - 1].delay);
    }
  });

  it("ends with the done step", () => {
    expect(APP_SCRIPT[APP_SCRIPT.length - 1].done).toBe(true);
  });

  it("visits every scripted view", () => {
    const views = new Set(APP_SCRIPT.map(s => s.view).filter(Boolean));
    for (const v of ["pulling", "home", "graph"]) {
      expect(views, `script never switches to the "${v}" view`).toContain(v);
    }
  });

  it("reveal counts only ever grow and never overshoot their data", () => {
    const tracks = [
      { key: "docs" as const,    max: DOCUMENTS.length },
      { key: "studios" as const, max: PART_STUDIOS.length },
      { key: "chips" as const,   max: SESSION_CHIPS.length },
      { key: "nodes" as const,   max: GRAPH_NODES.length },
    ];
    for (const { key, max } of tracks) {
      let prev = 0;
      for (const step of APP_SCRIPT) {
        const v = step[key];
        if (v === undefined) continue;
        expect(v, `${key} shrank at delay ${step.delay}`).toBeGreaterThan(prev);
        expect(v, `${key} overshoots its data at delay ${step.delay}`).toBeLessThanOrEqual(max);
        prev = v;
      }
      // The run must finish with everything revealed.
      expect(prev, `${key} never reaches ${max}`).toBe(max);
    }
  });
});

describe("DemoSection intent graph data", () => {
  it("has unique node ids", () => {
    const ids = GRAPH_NODES.map(n => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only connects nodes that exist", () => {
    const known = new Set(GRAPH_NODES.map(n => n.id));
    for (const edge of GRAPH_EDGES) {
      expect(known, `edge references unknown node "${edge.from}"`).toContain(edge.from);
      expect(known, `edge references unknown node "${edge.to}"`).toContain(edge.to);
    }
  });

  it("matches the on-screen copy: 27 nodes · 28 edges", () => {
    // The workflow-panel meta derives from this data, and the final History
    // event hardcodes the same counts.
    expect(GRAPH_NODES.length).toBe(27);
    expect(GRAPH_EDGES.length).toBe(28);
    const finalEvent = HISTORY_EVENTS[HISTORY_EVENTS.length - 1].text;
    expect(finalEvent).toContain(`${GRAPH_NODES.length} nodes`);
    expect(finalEvent).toContain(`${GRAPH_EDGES.length} edges`);
  });
});

describe("DemoSection history feed", () => {
  it("emits events in chronological order", () => {
    for (let i = 1; i < HISTORY_EVENTS.length; i++) {
      expect(HISTORY_EVENTS[i].t).toBeGreaterThanOrEqual(HISTORY_EVENTS[i - 1].t);
    }
  });

  it("keeps every event inside the scripted run's window", () => {
    // An event landing after the run has already unlocked scroll would stream
    // into the History tab while the user is scrolling away.
    const lastStep = APP_SCRIPT[APP_SCRIPT.length - 1].delay;
    expect(Math.max(...HISTORY_EVENTS.map(e => e.t))).toBeLessThanOrEqual(lastStep);
  });
});
