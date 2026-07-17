import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import DemoSection from "@/app/components/DemoSection";

// Full scripted run ends at max(SCRIPT delays, LOG_LINES t) + 200ms unlock.
const FULL_RUN_MS = 15000;

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

    // No conversation started, no scroll lock taken.
    expect(
      screen.queryByText("make in a new part studio a mug for my daily coffee")
    ).not.toBeInTheDocument();
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

    // First scripted message appears at 700ms.
    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(
      screen.getByText("make in a new part studio a mug for my daily coffee")
    ).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");

    // Run to completion: result card shown, scroll released, replay suppressed.
    act(() => {
      vi.advanceTimersByTime(FULL_RUN_MS);
    });
    expect(screen.getByText("✓ built")).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
    expect(sessionStorage.getItem("demoAnimPlayed")).toBe("true");
  });

  it("skips the gate and fast-forwards when the demo already played this session", () => {
    sessionStorage.setItem("demoAnimPlayed", "true");
    render(<DemoSection />);

    expect(
      screen.queryByRole("button", { name: /start mock application/i })
    ).not.toBeInTheDocument();
    expect(screen.getByText("✓ built")).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
  });
});
