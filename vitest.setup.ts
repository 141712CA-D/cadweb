import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});

// jsdom doesn't implement these browser APIs used by MorphSwitch / DemoSection.
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= MockResizeObserver as unknown as typeof ResizeObserver;

class MockIntersectionObserver {
  root = null;
  rootMargin = "";
  thresholds = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
globalThis.IntersectionObserver ??=
  MockIntersectionObserver as unknown as typeof IntersectionObserver;

Element.prototype.scrollTo ??= () => {};
Element.prototype.scrollIntoView ??= () => {};