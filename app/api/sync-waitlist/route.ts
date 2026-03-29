import { NextRequest, NextResponse } from "next/server";
import { syncWaitlist } from "@/lib/sync-waitlist";

function isAuthorized(req: NextRequest): boolean {
  // Vercel Cron: GET with Authorization: Bearer <CRON_SECRET>
  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) return true;

  // Manual trigger: POST with x-sync-secret header
  if (req.headers.get("x-sync-secret") === process.env.SYNC_SECRET) return true;

  return false;
}

// Vercel Cron calls GET
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await syncWaitlist();
  return NextResponse.json({ success: true, ...result });
}

// Manual trigger calls POST
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await syncWaitlist();
  return NextResponse.json({ success: true, ...result });
}
