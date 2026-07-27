import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import DemoSection from "@/app/components/DemoSection";

// The gated (primary) run is the Inter-CAD transfer. It ends at
// max(TRANSFER_SCRIPT delays, TRANSFER_LOG_LINES t) + 200ms unlock.
const FULL_RUN_MS = 12000;

const FIRST_TRANSFER_MSG = "transfer my Daily Mug model from Fusion360 to Onshape";
const FIRST_GEN_MSG = "make in a new part studio a mug for my daily coffee";

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
    expect(screen.queryByText(FIRST_TRANSFER_MSG)).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
    expect(sessionStorage.getItem("demoAnimPlayed")).toBeNull();
  });

  it("locks scroll on start, plays the transfer script, and unlocks when the run completes", () => {
    render(<DemoSection />);

    fireEvent.click(screen.getByRole("button", { name: /start mock application/i }));

    // Gate overlay is gone and the lock engages synchronously with the click.
    expect(
      screen.queryByRole("button", { name: /start mock application/i })
    ).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");

    // First scripted transfer message appears at 400ms.
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.getByText(FIRST_TRANSFER_MSG)).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");

    // Run to completion: result card shown, scroll released, replay suppressed.
    act(() => {
      vi.advanceTimersByTime(FULL_RUN_MS);
    });
    expect(screen.getByText("✓ transferred")).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
    expect(sessionStorage.getItem("demoAnimPlayed")).toBe("true");
  });

  it("never plays the text-to-CAD run as part of the gated demo", () => {
    render(<DemoSection />);

    fireEvent.click(screen.getByRole("button", { name: /start mock application/i }));
    act(() => {
      vi.advanceTimersByTime(FULL_RUN_MS);
    });

    // The second demo is user-initiated only — the gate must not trigger it.
    expect(screen.queryByText(FIRST_GEN_MSG)).not.toBeInTheDocument();
    expect(screen.queryByText("✓ built")).not.toBeInTheDocument();
  });

  it("skips the gate and fast-forwards the transfer when it already played this session", () => {
    sessionStorage.setItem("demoAnimPlayed", "true");
    render(<DemoSection />);

    expect(
      screen.queryByRole("button", { name: /start mock application/i })
    ).not.toBeInTheDocument();
    expect(screen.getByText("✓ transferred")).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
  });
});
