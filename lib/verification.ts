import { randomInt } from "crypto";
import type { Resend } from "resend";
import { sql } from "@/lib/db";

// ── Sender configuration ──────────────────────────────────────────────
// Address the site sends FROM and the internal inbox it notifies. Driven by
// env so the switch to founders@parametra.ai is a one-line env change once the
// parametra.ai domain is verified in Resend — no code edit, no redeploy of logic.
// Defaults keep us on the already-verified projcaden.dev domain until then.
export const SENDER_EMAIL = process.env.MAIL_FROM_EMAIL ?? "developers@projcaden.dev";
export const MAIL_FROM = `Parametra.ai <${SENDER_EMAIL}>`;
export const INTERNAL_TO = process.env.MAIL_TO_EMAIL ?? "developers@projcaden.dev";

// ── Verification settings ─────────────────────────────────────────────
const CODE_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;

export type VerificationPurpose = "waitlist" | "contact";

export type VerifyResult =
  | { ok: true; payload: Record<string, unknown> }
  | { ok: false; reason: "not_found" | "expired" | "too_many_attempts" | "mismatch" };

/** Cryptographically-strong 6-digit code (NOT Math.random — that's predictable). */
export function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/**
 * Store (or replace) a pending verification for this email + purpose and return
 * the code. The full form `payload` is held server-side so the confirm step only
 * needs to send back { email, code } — the client can't tamper with the data
 * between requesting and confirming.
 */
export async function createVerification(
  email: string,
  purpose: VerificationPurpose,
  payload: Record<string, unknown>
): Promise<string> {
  const code = generateCode();
  const json = JSON.stringify(payload);
  await sql`
    INSERT INTO pending_verifications (email, purpose, code, payload, attempts, expires_at, created_at)
    VALUES (${email}, ${purpose}, ${code}, ${json}::jsonb, 0, NOW() + ${CODE_TTL_MINUTES} * INTERVAL '1 minute', NOW())
    ON CONFLICT (email, purpose) DO UPDATE SET
      code       = ${code},
      payload    = ${json}::jsonb,
      attempts   = 0,
      expires_at = NOW() + ${CODE_TTL_MINUTES} * INTERVAL '1 minute',
      created_at = NOW()
  `;
  return code;
}

/**
 * Check a submitted code against server state. This is the server-side gate:
 * the privileged action (joining the waitlist / sending a message) only runs
 * if this returns ok. A wrong code burns one of the limited attempts; expiry,
 * exhausted attempts, and success all consume (delete) the row.
 */
export async function verifyCode(
  email: string,
  purpose: VerificationPurpose,
  code: string
): Promise<VerifyResult> {
  const rows = await sql`
    SELECT code, payload, attempts, (expires_at < NOW()) AS expired
    FROM pending_verifications
    WHERE email = ${email} AND purpose = ${purpose}
  `;

  if (rows.length === 0) return { ok: false, reason: "not_found" };
  const row = rows[0] as { code: string; payload: Record<string, unknown>; attempts: number; expired: boolean };

  if (row.expired) {
    await sql`DELETE FROM pending_verifications WHERE email = ${email} AND purpose = ${purpose}`;
    return { ok: false, reason: "expired" };
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    await sql`DELETE FROM pending_verifications WHERE email = ${email} AND purpose = ${purpose}`;
    return { ok: false, reason: "too_many_attempts" };
  }
  if (row.code !== code) {
    await sql`UPDATE pending_verifications SET attempts = attempts + 1 WHERE email = ${email} AND purpose = ${purpose}`;
    return { ok: false, reason: "mismatch" };
  }

  // Correct — consume the row so the code can't be reused.
  await sql`DELETE FROM pending_verifications WHERE email = ${email} AND purpose = ${purpose}`;
  return { ok: true, payload: row.payload };
}

/** Email the verification code to the address being verified. */
export async function sendVerificationEmail(
  resend: Resend,
  email: string,
  code: string,
  purpose: VerificationPurpose
): Promise<void> {
  const action =
    purpose === "waitlist"
      ? "confirm your email and join the Parametra.ai waitlist"
      : "confirm your email so we can deliver your message";

  const html = `
    <div style="font-family: monospace; background: #000; color: #e2e8f0; padding: 32px; border-radius: 12px; border: 1px solid rgba(37,99,235,0.3);">
      <h2 style="color: #38bdf8; margin: 0 0 16px;">Verify your email</h2>
      <p style="color: #cbd5e1; line-height: 1.7; margin: 0 0 24px;">
        Enter this code to ${action}. It expires in ${CODE_TTL_MINUTES} minutes.
      </p>
      <div style="text-align: center; margin: 0 0 24px;">
        <span style="display: inline-block; font-size: 32px; letter-spacing: 0.4em; color: #f1f5f9; font-weight: 700; padding: 16px 24px; border: 1px solid rgba(37,99,235,0.3); border-radius: 8px;">${code}</span>
      </div>
      <p style="color: #64748b; font-size: 12px; line-height: 1.6; margin: 0;">
        If you didn't request this, you can safely ignore this email — no one is added without entering the code.
      </p>
      <p style="color: #64748b; font-size: 12px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px; margin-top: 16px; line-height: 1.6;">
        If this is your first time receiving an email from <strong style="color: #94a3b8;">${SENDER_EMAIL}</strong>, please check your spam folder and unmark us as spam if applicable.
      </p>
    </div>
  `;

  await resend.emails.send({
    from: MAIL_FROM,
    to: email,
    subject: `Your Parametra verification code: ${code}`,
    html,
  });
}
