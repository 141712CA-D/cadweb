import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { consumeExpired } from "@/lib/consumeExpired";
import { apiUrl } from "@/lib/api";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("consumeExpired", () => {
  it("POSTs to the waitlist consume-expired endpoint with keepalive", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));
    await consumeExpired("waitlist");
    expect(fetchMock).toHaveBeenCalledWith(apiUrl("/api/waitlist/consume-expired"), {
      method: "POST",
      keepalive: true,
    });
  });

  it("POSTs to the contact consume-expired endpoint", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));
    await consumeExpired("contact");
    expect(fetchMock).toHaveBeenCalledWith(apiUrl("/api/contact/consume-expired"), {
      method: "POST",
      keepalive: true,
    });
  });

  it("swallows network errors instead of throwing (fire-and-forget)", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockRejectedValue(new Error("network down"));
    await expect(consumeExpired("waitlist")).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalled();
  });
});
