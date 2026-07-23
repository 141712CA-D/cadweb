import { apiUrl } from "@/lib/api";

// Vercel Cron runs this every Sunday at 00:00 UTC. It authenticates the cron caller via
// CRON_SECRET, then forwards to the C# backend's guarded endpoint
// (POST /api/admin/clear-rate-limiting) with X-Admin-Secret to purge expired rate-limit data.
// Schedule lives in vercel.json. Crons run on production only, not preview.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const adminSecret = process.env.ADMIN_SYNC_SECRET;
  if (!adminSecret) {
    return Response.json(
      { success: false, error: "ADMIN_SYNC_SECRET not configured" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(apiUrl("/api/admin/clear-rate-limiting"), {
      method: "POST",
      headers: { "X-Admin-Secret": adminSecret },
    });
    const data = await res.json().catch(() => ({}));
    return Response.json(
      { success: res.ok, backendStatus: res.status, ...data },
      { status: res.ok ? 200 : 502 }
    );
  } catch (err) {
    console.error("Cron clear-rate-limiting failed:", err);
    return Response.json({ success: false, error: "backend_unreachable" }, { status: 502 });
  }
}
