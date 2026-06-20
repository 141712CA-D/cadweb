import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { google } from "googleapis";
import { sql } from "@/lib/db";
import { syncWaitlist } from "@/lib/sync-waitlist";
import {
  createVerification,
  verifyCode,
  sendVerificationEmail,
  MAIL_FROM,
  INTERNAL_TO,
  SENDER_EMAIL,
} from "@/lib/verification";

const resend = new Resend(process.env.RESEND_API_KEY);

async function appendToSheet(row: (string | undefined)[]) {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Sheet1!A:H",
    valueInputOption: "RAW",
    requestBody: {
      values: [row],
    },
  });
}

async function verifyTurnstile(token: string) {
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret: process.env.TURNSTILE_SECRET_KEY, response: token }),
  });
  const data = await res.json();
  return data.success === true;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function missing(...vals: unknown[]) {
  return vals.some((v) => !v || (typeof v === "string" && !v.trim()));
}

function esc(str: string | undefined | null): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/** Validate the form submission. Returns an error message, or null if valid. */
function validateBody(body: Record<string, unknown>): string | null {
  const { type } = body;
  if (type === "individual") {
    const { name, email, role, university, reason } = body as Record<string, string>;
    if (missing(name, email, role, reason) || !EMAIL_RE.test(email)) return "Missing or invalid fields";
    if (typeof name === "string" && name.length > 80) return "Name too long";
    if (typeof email === "string" && email.length > 254) return "Email too long";
    if (typeof university === "string" && university.length > 120) return "School name too long";
    if (typeof reason === "string" && reason.length > 1000) return "Reason too long";
    if (role === "Student" && missing(university)) return "School required for students";
    if (role === "Instructor" && missing(university)) return "Institution required for instructors";
    if (!["Student", "Instructor", "Freelancer", "Hobbyist"].includes(role)) return "Invalid role";
  } else if (type === "team") {
    const { repName, email, org, role, usage } = body as Record<string, string>;
    if (missing(repName, email, org, role, usage) || !EMAIL_RE.test(email)) return "Missing or invalid fields";
    if (typeof repName === "string" && repName.length > 80) return "Name too long";
    if (typeof email === "string" && email.length > 254) return "Email too long";
    if (typeof org === "string" && org.length > 120) return "Organization name too long";
    if (typeof role === "string" && role.length > 80) return "Role too long";
    if (typeof usage === "string" && usage.length > 1000) return "Usage description too long";
  } else {
    return "Invalid type";
  }
  return null;
}

/**
 * STEP 1 — request a verification code.
 * Runs captcha + validation + dedup, then stores the submission server-side and
 * emails a code. Nothing is written to the waitlist yet.
 */
async function handleRequest(body: Record<string, unknown>) {
  const { captchaToken } = body as { captchaToken?: string };
  if (!captchaToken || !(await verifyTurnstile(captchaToken))) {
    return NextResponse.json({ success: false, error: "Invalid captcha" }, { status: 400 });
  }

  const validationError = validateBody(body);
  if (validationError) {
    return NextResponse.json({ success: false, error: validationError }, { status: 400 });
  }

  // Rebase DB from sheet first so manual deletions are reflected before checking
  await syncWaitlist();

  const userEmail = (body.email as string).toLowerCase();
  const existing = await sql`SELECT id, deleted FROM waitlist_entries WHERE email = ${userEmail}`;
  if (existing.length > 0 && !existing[0].deleted) {
    return NextResponse.json({ success: false, error: "already_registered" }, { status: 409 });
  }

  // Stash the submission server-side (minus transport-only fields) and email the code.
  const { captchaToken: _drop, step: _step, ...payload } = body as Record<string, unknown>;
  void _drop;
  void _step;

  try {
    const code = await createVerification(userEmail, "waitlist", payload);
    await sendVerificationEmail(resend, userEmail, code, "waitlist");
    return NextResponse.json({ success: true, pending: true });
  } catch (err) {
    console.error("Waitlist verification request error:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

/**
 * STEP 2 — confirm the code, then complete the signup.
 * The code is checked against server state (server-side gate); only on a match
 * do we send the real emails and write to the sheet/DB.
 */
async function handleVerify(body: Record<string, unknown>) {
  const email = typeof body.email === "string" ? body.email.toLowerCase() : "";
  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!email || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ success: false, error: "invalid_code" }, { status: 400 });
  }

  const result = await verifyCode(email, "waitlist", code);
  if (!result.ok) {
    const statusByReason: Record<string, number> = {
      not_found: 400,
      expired: 410,
      too_many_attempts: 429,
      mismatch: 400,
    };
    return NextResponse.json(
      { success: false, error: result.reason },
      { status: statusByReason[result.reason] ?? 400 }
    );
  }

  const payload = result.payload;
  const type = payload.type as string;
  const userEmail = email;

  // Re-check against the live list in case state changed since the code was issued.
  await syncWaitlist();
  const existing = await sql`SELECT id, deleted FROM waitlist_entries WHERE email = ${userEmail}`;
  if (existing.length > 0 && !existing[0].deleted) {
    return NextResponse.json({ success: false, error: "already_registered" }, { status: 409 });
  }
  const isReturning = existing.length > 0 && existing[0].deleted;

  let subject: string;
  let html: string;
  let sheetRow: (string | undefined)[];
  let dbInsert: Promise<unknown>;
  const timestamp = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });

  if (type === "individual") {
    const { name, email: rawEmail, role, university, reason } = payload as Record<string, string>;
    subject = `[Parametra Waitlist] Individual — ${name}`;
    sheetRow = [timestamp, "Individual", name, rawEmail, role, university ?? "", reason, ""];
    html = `
      <div style="font-family: monospace; background: #000; color: #e2e8f0; padding: 32px; border-radius: 12px; border: 1px solid rgba(37,99,235,0.3);">
        <h2 style="color: #38bdf8; margin: 0 0 24px;">New Individual Waitlist Signup</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="color: #94a3b8; padding: 8px 0; width: 140px;">Name</td><td style="color: #f1f5f9;">${esc(name)}</td></tr>
          <tr><td style="color: #94a3b8; padding: 8px 0;">Email</td><td style="color: #38bdf8;"><a href="mailto:${esc(rawEmail)}" style="color: #38bdf8;">${esc(rawEmail)}</a></td></tr>
          <tr><td style="color: #94a3b8; padding: 8px 0;">Role</td><td style="color: #f1f5f9;">${esc(role)}</td></tr>
          ${university ? `<tr><td style="color: #94a3b8; padding: 8px 0;">University</td><td style="color: #f1f5f9;">${esc(university)}</td></tr>` : ""}
          <tr><td style="color: #94a3b8; padding: 8px 0; vertical-align: top;">Why Parametra</td><td style="color: #f1f5f9; line-height: 1.6;">${esc(reason)}</td></tr>
        </table>
      </div>
    `;
    dbInsert = sql`
      INSERT INTO waitlist_entries (type, name, email, role, university, reason, organization, signed_up_at, deleted, deleted_at)
      VALUES ('individual', ${name}, ${userEmail}, ${role}, ${university ?? null}, ${reason}, null, NOW(), FALSE, NULL)
      ON CONFLICT (email) DO UPDATE SET
        type = 'individual', name = ${name}, role = ${role},
        university = ${university ?? null}, reason = ${reason}, organization = NULL,
        signed_up_at = NOW(), deleted = FALSE, deleted_at = NULL
    `;
  } else {
    const { repName, email: rawEmail, org, role, usage } = payload as Record<string, string>;
    subject = `[Parametra Waitlist] Team — ${org}`;
    sheetRow = [timestamp, "Team", repName, rawEmail, role, "", usage, org];
    html = `
      <div style="font-family: monospace; background: #000; color: #e2e8f0; padding: 32px; border-radius: 12px; border: 1px solid rgba(37,99,235,0.3);">
        <h2 style="color: #38bdf8; margin: 0 0 24px;">New Team / Organization Waitlist Signup</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="color: #94a3b8; padding: 8px 0; width: 140px;">Rep Name</td><td style="color: #f1f5f9;">${esc(repName)}</td></tr>
          <tr><td style="color: #94a3b8; padding: 8px 0;">Email</td><td style="color: #38bdf8;"><a href="mailto:${esc(rawEmail)}" style="color: #38bdf8;">${esc(rawEmail)}</a></td></tr>
          <tr><td style="color: #94a3b8; padding: 8px 0;">Organization</td><td style="color: #f1f5f9;">${esc(org)}</td></tr>
          <tr><td style="color: #94a3b8; padding: 8px 0;">Role</td><td style="color: #f1f5f9;">${esc(role)}</td></tr>
          <tr><td style="color: #94a3b8; padding: 8px 0; vertical-align: top;">Intended Usage</td><td style="color: #f1f5f9; line-height: 1.6;">${esc(usage)}</td></tr>
        </table>
      </div>
    `;
    dbInsert = sql`
      INSERT INTO waitlist_entries (type, name, email, role, university, reason, organization, signed_up_at, deleted, deleted_at)
      VALUES ('team', ${repName}, ${userEmail}, ${role}, null, ${usage}, ${org}, NOW(), FALSE, NULL)
      ON CONFLICT (email) DO UPDATE SET
        type = 'team', name = ${repName}, role = ${role},
        university = NULL, reason = ${usage}, organization = ${org},
        signed_up_at = NOW(), deleted = FALSE, deleted_at = NULL
    `;
  }

  const userName = (type === "individual" ? payload.name : payload.repName) as string;
  const userConfirmHtml = isReturning ? `
    <div style="font-family: monospace; background: #000; color: #e2e8f0; padding: 32px; border-radius: 12px; border: 1px solid rgba(37,99,235,0.3);">
      <h2 style="color: #38bdf8; margin: 0 0 16px;">Welcome back, ${userName}.</h2>
      <p style="color: #cbd5e1; line-height: 1.7; margin: 0 0 16px;">
        Good to see you again. You're back on the Parametra.ai waitlist — we'll notify you as soon as public testing becomes available.
      </p>
      <p style="color: #cbd5e1; line-height: 1.7; margin: 0 0 24px;">
        Big things are coming. Stay tuned.
      </p>
      <p style="color: #64748b; font-size: 12px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px; line-height: 1.6;">
        If this email landed in spam, please unmark us as spam — we'd hate for you to miss the launch.
      </p>
    </div>
  ` : `
    <div style="font-family: monospace; background: #000; color: #e2e8f0; padding: 32px; border-radius: 12px; border: 1px solid rgba(37,99,235,0.3);">
      <h2 style="color: #38bdf8; margin: 0 0 16px;">You're on the list, ${userName}.</h2>
      <p style="color: #cbd5e1; line-height: 1.7; margin: 0 0 16px;">
        Thank you for signing up for the Parametra.ai waitlist. We're working hard to bring AI-powered multi-agent CAD design to Onshape, and we'll notify you as soon as public testing becomes available.
      </p>
      <p style="color: #cbd5e1; line-height: 1.7; margin: 0 0 24px;">
        Big things are coming. Stay tuned.
      </p>
      <p style="color: #64748b; font-size: 12px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px; line-height: 1.6;">
        If this is your first time receiving an email from <strong style="color: #94a3b8;">${SENDER_EMAIL}</strong>, please check your spam folder and unmark us as spam if applicable — we'd hate for you to miss the launch.
      </p>
    </div>
  `;

  try {
    await Promise.all([
      resend.emails.send({
        from: MAIL_FROM,
        to: INTERNAL_TO,
        subject,
        html,
      }),
      resend.emails.send({
        from: MAIL_FROM,
        to: userEmail,
        subject: isReturning ? "Welcome back to the Parametra waitlist" : "You're on the Parametra waitlist",
        html: userConfirmHtml,
      }),
      appendToSheet(sheetRow),
      dbInsert,
    ]);

    // Rebase again after signup to reflect the new entry in DB
    await syncWaitlist();

    return NextResponse.json({ success: true, returning: isReturning });
  } catch (err: unknown) {
    // Unique constraint violation — same email raced through simultaneously
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "23505") {
      return NextResponse.json({ success: false, error: "already_registered" }, { status: 409 });
    }
    console.error("Waitlist error:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body?.step === "verify") {
    return handleVerify(body);
  }
  return handleRequest(body);
}
