import { apiUrl } from "@/lib/api";

// Server-side proxy for the hidden /startup-school page. The startup-school endpoint is gated by
// JWT_STARTUP_SCHOOL_TOKEN, which is a SERVER-ONLY env var (no NEXT_PUBLIC_ prefix) so it can't be
// read from the browser. The client form POSTs here (same-origin), and this route injects the
// token as a Bearer header and forwards to the backend POST /api/waitlist/startup-school. The
// backend forces Reason/Usage = "Startup School" regardless of the body.
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const token = process.env.JWT_STARTUP_SCHOOL_TOKEN;
  if (!token) {
    return Response.json(
      { success: false, error: "JWT_STARTUP_SCHOOL_TOKEN not configured" },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: "invalid_body" }, { status: 400 });
  }

  // Preserve the real client IP so the backend's per-IP rate limiting sees the visitor,
  // not this Vercel function.
  const forwardedFor =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "";

  try {
    const res = await fetch(apiUrl("/api/waitlist/startup-school"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(forwardedFor ? { "X-Forwarded-For": forwardedFor } : {}),
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return Response.json(data, { status: res.status });
  } catch (err) {
    console.error("startup-school proxy failed:", err);
    return Response.json({ success: false, error: "backend_unreachable" }, { status: 502 });
  }
}
