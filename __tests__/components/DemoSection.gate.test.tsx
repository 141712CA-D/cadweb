import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import DemoSection from "@/app/components/DemoSection";

// The gated run is the Pull-from-Onshape → Home → Intent-graph script. It ends
// at max(APP_SCRIPT delays, HISTORY_EVENTS t) + 200ms unlock.
const FULL_RUN_MS = 12000;

const PULLING_HEADING = "Pulling from Onshape";
const GRAPH_META = "27 nodes · 28 edges";
const DONE_STATUS = "Demo complete — scroll or swipe to return to the site";

beforeEach(() => {
  sessionStorage.clear();
  // Skip the async cursor-hint sequence so tests only exercise the demo run.
  sessionStorage.setItem("cursorHintPlayed", "true");
  vi.useFakeTimers();
  document.body.style.overflow = "";
});

afterEach(() => {
  vi.useRealTimers();
  sessionStorage.clear();
});

describe("DemoSection start gate", () => {
  it("never auto-plays or locks scroll before the start button is clicked", () => {
    render(<DemoSection />);

    expect(screen.getByRole("button", { name: /start mock application/i })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(FULL_RUN_MS);
    });

    // No pull started, no scroll lock taken.
    expect(screen.queryByText(PULLING_HEADING)).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
    expect(sessionStorage.getItem("demoAnimPlayed")).toBeNull();
  });

  it("locks scroll on start, plays the script, and unlocks when the run completes", () => {
    render(<DemoSection />);

    fireEvent.click(screen.getByRole("button", { name: /start mock application/i }));

    // Gate overlay is gone and the lock engages synchronously with the click.
    expect(
      screen.queryByRole("button", { name: /start mock application/i })
    ).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");

    // The pulling screen appears at 300ms.
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.getByText(PULLING_HEADING)).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");

    // Run to completion: intent graph shown, scroll released, replay suppressed.
    act(() => {
      vi.advanceTimersByTime(FULL_RUN_MS);
    });
    expect(screen.getByText(GRAPH_META)).toBeInTheDocument();
    expect(screen.getByText(DONE_STATUS)).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
    expect(sessionStorage.getItem("demoAnimPlayed")).toBe("true");
  });

  it("streams the history feed during the run and opens it from the sidebar", () => {
    render(<DemoSection />);

    fireEvent.click(screen.getByRole("button", { name: /start mock application/i }));
    act(() => {
      vi.advanceTimersByTime(FULL_RUN_MS);
    });

    // Sidebar renders twice (desktop aside + mobile shelf) — either works.
    fireEvent.click(screen.getAllByRole("button", { name: /history/i })[0]);
    expect(screen.getByText("Pull from Onshape started")).toBeInTheDocument();
    expect(screen.getByText("Intent graph ready · 27 nodes · 28 edges")).toBeInTheDocument();
  });

  it("skips the gate and fast-forwards the run when it already played this session", () => {
    sessionStorage.setItem("demoAnimPlayed", "true");
    render(<DemoSection />);

    expect(
      screen.queryByRole("button", { name: /start mock application/i })
    ).not.toBeInTheDocument();
    expect(screen.getByText(GRAPH_META)).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
  });
});
