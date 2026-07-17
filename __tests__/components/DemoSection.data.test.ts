import { describe, expect, it } from "vitest";
import {
  MESSAGES,
  FEATURES,
  VAR_GROUPS,
  SCRIPT,
  LOG_LINES,
  TRANSFER_MESSAGES,
  TRANSFER_SCRIPT,
} from "@/app/components/DemoSection";

// The demo is data-driven: the SCRIPT/LOG_LINES timelines reference MESSAGES
// and FEATURES by id. These invariants catch silent breakage when the demo
// script is edited (a typo'd id would simply never appear on screen).

describe("DemoSection script data", () => {
  it("has unique message ids", () => {
    const ids = MESSAGES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only shows message ids that exist", () => {
    const known = new Set(MESSAGES.map((m) => m.id));
    for (const step of SCRIPT) {
      for (const id of step.show ?? []) {
        expect(known, `SCRIPT references unknown message id "${id}"`).toContain(id);
      }
    }
  });

  it("shows every message exactly once across the script", () => {
    const shown = SCRIPT.flatMap((s) => s.show ?? []);
    expect(shown.sort()).toEqual(MESSAGES.map((m) => m.id).sort());
  });

  it("only reveals feature ids that exist, and reveals all of them", () => {
    const revealed = SCRIPT.flatMap((s) => s.features ?? []);
    expect(revealed.sort()).toEqual(FEATURES.map((f) => f.id).sort());
  });

  it("runs steps in chronological order", () => {
    for (let i = 1; i < SCRIPT.length; i++) {
      expect(SCRIPT[i].delay).toBeGreaterThan(SCRIPT[i - 1].delay);
    }
  });

  it("ends by showing the result card", () => {
    expect(SCRIPT[SCRIPT.length - 1].show).toContain("result");
  });

  it("emits log lines in chronological order", () => {
    for (let i = 1; i < LOG_LINES.length; i++) {
      expect(LOG_LINES[i].t).toBeGreaterThanOrEqual(LOG_LINES[i - 1].t);
    }
  });

  it("matches the on-screen copy: 12 features and 9 live variables", () => {
    // The result card / status bar copy hardcodes these counts.
    expect(FEATURES.length).toBe(12);
    expect(VAR_GROUPS.flatMap((g) => g.vars).length).toBe(9);
  });
});

describe("DemoSection transfer script data", () => {
  it("only shows transfer message ids that exist", () => {
    const known = new Set(TRANSFER_MESSAGES.map((m) => m.id));
    for (const step of TRANSFER_SCRIPT) {
      for (const id of step.show ?? []) {
        expect(known, `TRANSFER_SCRIPT references unknown id "${id}"`).toContain(id);
      }
    }
  });

  it("shows every transfer message across the script", () => {
    const shown = new Set(TRANSFER_SCRIPT.flatMap((s) => s.show ?? []));
    for (const m of TRANSFER_MESSAGES) {
      expect(shown, `transfer message "${m.id}" is never shown`).toContain(m.id);
    }
  });

  it("never reveals more status lines than the status message has", () => {
    const status = TRANSFER_MESSAGES.find((m) => m.type === "status");
    expect(status).toBeDefined();
    const max = status!.lines!.length;
    for (const step of TRANSFER_SCRIPT) {
      if (step.statusLines !== undefined) {
        expect(step.statusLines).toBeLessThanOrEqual(max);
      }
    }
    // The last statusLines step should complete the list.
    const counts = TRANSFER_SCRIPT.filter((s) => s.statusLines !== undefined).map(
      (s) => s.statusLines!
    );
    expect(Math.max(...counts)).toBe(max);
  });

  it("runs transfer steps in chronological order", () => {
    for (let i = 1; i < TRANSFER_SCRIPT.length; i++) {
      expect(TRANSFER_SCRIPT[i].delay).toBeGreaterThan(TRANSFER_SCRIPT[i - 1].delay);
    }
  });
});
