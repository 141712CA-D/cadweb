import { NextResponse } from "next/server";
import { syncWaitlist } from "@/lib/sync-waitlist";
import { sql } from "@/lib/db";
import { createHash } from "crypto";

function sha256(email: string) {
  return createHash("sha256").update(email).digest("hex");
}

// Called when the signup form mounts.
// Syncs the DB from the sheet, then returns SHA-256 hashes of all emails so the
// client can do O(1) membership checks locally without exposing plaintext addresses.
export async function GET() {
  try {
    await syncWaitlist();
    const rows = await sql`SELECT email, deleted FROM waitlist_entries`;
    const registered: string[] = [];
    const returning: string[] = [];
    for (const row of rows) {
      const h = sha256(row.email as string);
      if (row.deleted) returning.push(h);
      else registered.push(h);
    }
    return NextResponse.json({ ok: true, registered, returning });
  } catch {
    return NextResponse.json({ ok: false, registered: [], returning: [] });
  }
}
