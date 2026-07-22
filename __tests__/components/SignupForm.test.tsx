import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { forwardRef, useImperativeHandle } from "react";
import SignupForm from "@/app/components/SignupForm";

// The Turnstile widget needs Cloudflare network access — replace it with a
// button that hands the form a token, the same contract the real widget has.
vi.mock("@marsidev/react-turnstile", () => ({
  Turnstile: forwardRef(function MockTurnstile(
    { onSuccess }: { onSuccess?: (token: string) => void },
    ref
  ) {
    useImperativeHandle(ref, () => ({ reset: () => {} }));
    return (
      <button type="button" onClick={() => onSuccess?.("test-token")}>
        solve captcha
      </button>
    );
  }),
}));

const fetchMock = vi.fn();

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/api/waitlist/check-cache")) {
      return jsonResponse({ canRegister: true, status: "new" });
    }
    if (url.includes("/api/waitlist/request")) {
      return jsonResponse({ success: true });
    }
    throw new Error(`unexpected fetch: ${url}`);
  });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function fillIndividualForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText("Your full name"), "Ada Lovelace");
  await user.type(screen.getByPlaceholderText("you@example.com"), "ada@example.com");
  await user.selectOptions(screen.getByRole("combobox", { name: "Role" }), "Hobbyist");
  await user.type(
    screen.getByPlaceholderText("Tell us about your use case..."),
    "CAD from prompts"
  );
}

describe("SignupForm", () => {
  it("renders the individual tab by default with submit disabled", () => {
    render(<SignupForm isModal />);
    expect(screen.getByPlaceholderText("Your full name")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /request access/i })).toBeDisabled();
  });

  it("requires a school for Student and Instructor roles", async () => {
    const user = userEvent.setup();
    render(<SignupForm isModal />);

    await user.selectOptions(screen.getByRole("combobox", { name: "Role" }), "Student");
    expect(screen.getByPlaceholderText("Where do you attend?")).toBeInTheDocument();

    await user.selectOptions(screen.getByRole("combobox", { name: "Role" }), "Instructor");
    expect(screen.getByPlaceholderText("Where do you teach?")).toBeInTheDocument();

    await user.selectOptions(screen.getByRole("combobox", { name: "Role" }), "Hobbyist");
    expect(screen.queryByPlaceholderText("Where do you attend?")).not.toBeInTheDocument();
  });

  it("keeps submit disabled for an invalid email even with captcha solved", async () => {
    const user = userEvent.setup();
    render(<SignupForm isModal />);

    await user.type(screen.getByPlaceholderText("Your full name"), "Ada Lovelace");
    await user.type(screen.getByPlaceholderText("you@example.com"), "not-an-email");
    await user.selectOptions(screen.getByRole("combobox", { name: "Role" }), "Hobbyist");
    await user.type(
      screen.getByPlaceholderText("Tell us about your use case..."),
      "CAD from prompts"
    );
    await user.click(screen.getByRole("button", { name: /solve captcha/i }));

    expect(screen.getByRole("button", { name: /request access/i })).toBeDisabled();
  });

  it("keeps submit disabled until the captcha is solved", async () => {
    const user = userEvent.setup();
    render(<SignupForm isModal />);

    await fillIndividualForm(user);
    expect(screen.getByRole("button", { name: /request access/i })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /solve captcha/i }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /request access/i })).toBeEnabled()
    );
  });

  it("submits the waitlist request and advances to the verify-code step", async () => {
    const user = userEvent.setup();
    render(<SignupForm isModal />);

    await fillIndividualForm(user);
    await user.click(screen.getByRole("button", { name: /solve captcha/i }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /request access/i })).toBeEnabled()
    );
    await user.click(screen.getByRole("button", { name: /request access/i }));

    expect(await screen.findByText("Check your email.")).toBeInTheDocument();

    const requestCall = fetchMock.mock.calls.find(([url]) =>
      String(url).includes("/api/waitlist/request")
    );
    expect(requestCall).toBeDefined();
    const body = JSON.parse((requestCall![1] as RequestInit).body as string);
    expect(body).toMatchObject({
      type: "individual",
      name: "Ada Lovelace",
      email: "ada@example.com",
      role: "Hobbyist",
      captchaToken: "test-token",
    });
  });

  it("blocks submission for an already-registered email", async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/waitlist/check-cache")) {
        return jsonResponse(
          { success: false, error: "already_registered", token: "jwt-from-cache" },
          409
        );
      }
      throw new Error(`unexpected fetch: ${url}`);
    });

    const user = userEvent.setup();
    render(<SignupForm isModal />);

    await fillIndividualForm(user);
    await user.click(screen.getByRole("button", { name: /solve captcha/i }));

    expect(await screen.findByText("Already registered")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /remove\?/i })).toHaveAttribute(
      "href",
      expect.stringContaining("jwt-from-cache")
    );
    await user.click(screen.getByRole("link", { name: /remove\?/i }));
    expect(await screen.findByRole("dialog")).toHaveTextContent("Are you sure?");
    expect(screen.getByRole("button", { name: /request access/i })).toBeDisabled();
  });

  it("shows the unsubscribe success screen when a duplicate token is used from submit", async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/api/waitlist/check-cache")) {
        return jsonResponse({ canRegister: true, status: "new" });
      }
      if (url.includes("/api/waitlist/request")) {
        return jsonResponse(
          { success: false, error: "already_registered", token: "jwt-from-submit" },
          409
        );
      }
      if (url.includes("/waitlist/unsubscribe")) {
        expect(init?.method).toBe("GET");
        return jsonResponse({ success: true });
      }
      throw new Error(`unexpected fetch: ${url}`);
    });

    const user = userEvent.setup();
    render(<SignupForm isModal />);

    await fillIndividualForm(user);
    await user.click(screen.getByRole("button", { name: /solve captcha/i }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /request access/i })).toBeEnabled()
    );
    await user.click(screen.getByRole("button", { name: /request access/i }));

    expect(await screen.findByRole("heading", { name: /already registered/i })).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: /remove\?/i }));
    expect(await screen.findByRole("dialog")).toHaveTextContent("Are you sure?");
    await user.click(screen.getByRole("button", { name: /^remove$/i }));

    expect(await screen.findByText("You're unsubscribed.")).toBeInTheDocument();
  });

  it("switches to the team tab and shows team fields", async () => {
    const user = userEvent.setup();
    render(<SignupForm isModal />);

    await user.click(screen.getByRole("button", { name: /team \/ org/i }));

    // The MorphSwitch exit animation must finish before team fields mount.
    expect(
      await screen.findByPlaceholderText("Company or institution name")
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("you@company.com")).toBeInTheDocument();
  });
});
