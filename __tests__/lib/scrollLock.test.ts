import { beforeEach, describe, expect, it, vi } from "vitest";

// scrollLock keeps its reference count in module state, so each test gets a
// fresh copy of the module via resetModules + dynamic import.
async function loadScrollLock() {
  return await import("@/lib/scrollLock");
}

beforeEach(() => {
  vi.resetModules();
  document.body.style.overflow = "";
});

describe("scrollLock", () => {
  it("hides body overflow on first lock", async () => {
    const { lockScroll } = await loadScrollLock();
    lockScroll();
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("restores body overflow when the last lock is released", async () => {
    const { lockScroll, unlockScroll } = await loadScrollLock();
    lockScroll();
    unlockScroll();
    expect(document.body.style.overflow).toBe("");
  });

  it("keeps scroll locked while any consumer still holds a lock", async () => {
    const { lockScroll, unlockScroll } = await loadScrollLock();
    lockScroll(); // e.g. SignupModal
    lockScroll(); // e.g. DemoSection
    unlockScroll();
    expect(document.body.style.overflow).toBe("hidden");
    unlockScroll();
    expect(document.body.style.overflow).toBe("");
  });

  it("clamps at zero on over-unlock so a later lock still works", async () => {
    const { lockScroll, unlockScroll } = await loadScrollLock();
    unlockScroll(); // stray unlock before any lock
    unlockScroll();
    lockScroll();
    expect(document.body.style.overflow).toBe("hidden");
    unlockScroll();
    expect(document.body.style.overflow).toBe("");
  });
});
