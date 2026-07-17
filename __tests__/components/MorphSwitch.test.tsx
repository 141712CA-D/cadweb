import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import MorphSwitch from "@/app/components/MorphSwitch";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("MorphSwitch", () => {
  it("renders its children when idle", () => {
    render(
      <MorphSwitch activeKey="individual">
        <p>Individual form</p>
      </MorphSwitch>
    );
    expect(screen.getByText("Individual form")).toBeInTheDocument();
  });

  it("shows a frozen snapshot of the old content during the exit phase", () => {
    const { rerender } = render(
      <MorphSwitch activeKey="individual" duration={320}>
        <p>Individual form</p>
      </MorphSwitch>
    );
    rerender(
      <MorphSwitch activeKey="team" duration={320}>
        <p>Team form</p>
      </MorphSwitch>
    );
    // Exit phase (40% of duration = 128ms): old content still visible, new not yet.
    expect(screen.getByText("Individual form")).toBeInTheDocument();
    expect(screen.queryByText("Team form")).not.toBeInTheDocument();
  });

  it("swaps to the live incoming content after the exit phase completes", () => {
    const { rerender } = render(
      <MorphSwitch activeKey="individual" duration={320}>
        <p>Individual form</p>
      </MorphSwitch>
    );
    rerender(
      <MorphSwitch activeKey="team" duration={320}>
        <p>Team form</p>
      </MorphSwitch>
    );
    act(() => {
      vi.advanceTimersByTime(130); // past the 128ms out phase
    });
    expect(screen.getByText("Team form")).toBeInTheDocument();
    expect(screen.queryByText("Individual form")).not.toBeInTheDocument();
  });

  it("renders live children updates immediately once settled (no stale snapshot)", () => {
    const { rerender } = render(
      <MorphSwitch activeKey="individual">
        <p>count: 0</p>
      </MorphSwitch>
    );
    // Same key — content updates must pass straight through.
    rerender(
      <MorphSwitch activeKey="individual">
        <p>count: 1</p>
      </MorphSwitch>
    );
    expect(screen.getByText("count: 1")).toBeInTheDocument();
  });
});
