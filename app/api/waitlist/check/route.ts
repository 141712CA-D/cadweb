import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Debounced email status check called while the user types.
// Returns: available | registered | returning | invalid
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.toLowerCase().trim();
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ status: "invalid", canRegister: false });
  }
  const rows = await sql`SELECT deleted FROM waitlist_entries WHERE email = ${email}`;
  if (rows.length === 0) return NextResponse.json({ status: "available", canRegister: true });
  if (rows[0].deleted) return NextResponse.json({ status: "returning", canRegister: true });
  return NextResponse.json({ status: "registered", canRegister: false });
}
