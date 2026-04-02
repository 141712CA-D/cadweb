import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { sql } from "@/lib/db";

const IP_LIMIT    = 5;
const IP_WINDOW   = 600;   // 10 minutes in seconds
const EMAIL_LIMIT = 2;
const EMAIL_WINDOW = 1800; // 30 minutes in seconds

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

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const body = await req.json();
  const { type, captchaToken, subject, message } = body;

  if (!captchaToken || !(await verifyTurnstile(captchaToken))) {
    return NextResponse.json({ success: false, error: "Invalid captcha" }, { status: 400 });
  }

  if (type === "individual") {
    const { name, email, role, university } = body;
    if (missing(name, email, role, subject, message) || !EMAIL_RE.test(email))
      return NextResponse.json({ success: false, error: "Missing or invalid fields" }, { status: 400 });
    if (typeof name === "string" && name.length > 80) return NextResponse.json({ success: false, error: "Name too long" }, { status: 400 });
    if (typeof email === "string" && email.length > 254) return NextResponse.json({ success: false, error: "Email too long" }, { status: 400 });
    if (typeof university === "string" && university.length > 120) return NextResponse.json({ success: false, error: "University name too long" }, { status: 400 });
    if (typeof subject === "string" && subject.length > 120) return NextResponse.json({ success: false, error: "Subject too long" }, { status: 400 });
    if (typeof message === "string" && message.length > 2000) return NextResponse.json({ success: false, error: "Message too long" }, { status: 400 });
    if (role === "Student" && missing(university))
      return NextResponse.json({ success: false, error: "University required for students" }, { status: 400 });
  } else if (type === "team") {
    const { repName, email, org, role } = body;
    if (missing(repName, email, org, role, subject, message) || !EMAIL_RE.test(email))
      return NextResponse.json({ success: false, error: "Missing or invalid fields" }, { status: 400 });
    if (typeof repName === "string" && repName.length > 80) return NextResponse.json({ success: false, error: "Name too long" }, { status: 400 });
    if (typeof email === "string" && email.length > 254) return NextResponse.json({ success: false, error: "Email too long" }, { status: 400 });
    if (typeof org === "string" && org.length > 120) return NextResponse.json({ success: false, error: "Organization name too long" }, { status: 400 });
    if (typeof role === "string" && role.length > 80) return NextResponse.json({ success: false, error: "Role too long" }, { status: 400 });
    if (typeof subject === "string" && subject.length > 120) return NextResponse.json({ success: false, error: "Subject too long" }, { status: 400 });
    if (typeof message === "string" && message.length > 2000) return NextResponse.json({ success: false, error: "Message too long" }, { status: 400 });
  } else {
    return NextResponse.json({ success: false, error: "Invalid type" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim()
    ?? req.headers.get("x-real-ip")
    ?? "unknown";
  const submitterEmail = (body.email as string).toLowerCase();

  // IP: 5 sends per 10-minute window
  const ipRow = await sql`
    SELECT count, EXTRACT(EPOCH FROM (NOW() - window_start))::int AS elapsed
    FROM contact_rate_limits WHERE key = ${ip} AND kind = 'ip'
  `;
  if (ipRow.length > 0 && ipRow[0].elapsed < IP_WINDOW && ipRow[0].count >= IP_LIMIT) {
    return NextResponse.json(
      { success: false, error: "rate_limited", retryAfter: IP_WINDOW - ipRow[0].elapsed },
      { status: 429 }
    );
  }

  // Email: 2 sends per 30-minute window
  const emailRow = await sql`
    SELECT count, EXTRACT(EPOCH FROM (NOW() - window_start))::int AS elapsed
    FROM contact_rate_limits WHERE key = ${submitterEmail} AND kind = 'email'
  `;
  if (emailRow.length > 0 && emailRow[0].elapsed < EMAIL_WINDOW && emailRow[0].count >= EMAIL_LIMIT) {
    return NextResponse.json(
      { success: false, error: "rate_limited", retryAfter: EMAIL_WINDOW - emailRow[0].elapsed },
      { status: 429 }
    );
  }

  let emailSubject: string;
  let html: string;

  if (type === "team") {
    const { repName, email, org, role } = body;
    emailSubject = `[CADen Contact — Team] ${subject} — ${repName} (${org})`;
    html = `
      <div style="font-family: monospace; background: #000; color: #e2e8f0; padding: 32px; border-radius: 12px; border: 1px solid rgba(37,99,235,0.3);">
        <h2 style="color: #38bdf8; margin: 0 0 8px;">New Team Contact Message</h2>
        <p style="color: #64748b; margin: 0 0 24px; font-size: 13px;">Team / Organization inquiry</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="color: #94a3b8; padding: 8px 0; width: 140px;">Rep Name</td><td style="color: #f1f5f9;">${esc(repName)}</td></tr>
          <tr><td style="color: #94a3b8; padding: 8px 0;">Email</td><td style="color: #38bdf8;"><a href="mailto:${esc(email)}" style="color: #38bdf8;">${esc(email)}</a></td></tr>
          <tr><td style="color: #94a3b8; padding: 8px 0;">Organization</td><td style="color: #f1f5f9;">${esc(org)}</td></tr>
          <tr><td style="color: #94a3b8; padding: 8px 0;">Role</td><td style="color: #f1f5f9;">${esc(role)}</td></tr>
          <tr><td style="color: #94a3b8; padding: 8px 0;">Subject</td><td style="color: #f1f5f9;">${esc(subject)}</td></tr>
          <tr><td style="color: #94a3b8; padding: 8px 0; vertical-align: top;">Message</td><td style="color: #f1f5f9; line-height: 1.6;">${esc(message)}</td></tr>
        </table>
      </div>
    `;
  } else {
    const { name, email, role, university } = body;
    emailSubject = `[CADen Contact] ${subject} — ${name}`;
    html = `
      <div style="font-family: monospace; background: #000; color: #e2e8f0; padding: 32px; border-radius: 12px; border: 1px solid rgba(37,99,235,0.3);">
        <h2 style="color: #38bdf8; margin: 0 0 24px;">New Contact Message</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="color: #94a3b8; padding: 8px 0; width: 140px;">Name</td><td style="color: #f1f5f9;">${esc(name)}</td></tr>
          <tr><td style="color: #94a3b8; padding: 8px 0;">Email</td><td style="color: #38bdf8;"><a href="mailto:${esc(email)}" style="color: #38bdf8;">${esc(email)}</a></td></tr>
          <tr><td style="color: #94a3b8; padding: 8px 0;">Role</td><td style="color: #f1f5f9;">${esc(role)}</td></tr>
          ${university ? `<tr><td style="color: #94a3b8; padding: 8px 0;">University</td><td style="color: #f1f5f9;">${esc(university)}</td></tr>` : ""}
          <tr><td style="color: #94a3b8; padding: 8px 0;">Subject</td><td style="color: #f1f5f9;">${esc(subject)}</td></tr>
          <tr><td style="color: #94a3b8; padding: 8px 0; vertical-align: top;">Message</td><td style="color: #f1f5f9; line-height: 1.6;">${esc(message)}</td></tr>
        </table>
      </div>
    `;
  }

  const userEmail = type === "individual" ? body.email : body.email;
  const userName = type === "individual" ? body.name : body.repName;
  const userConfirmHtml = `
    <div style="font-family: monospace; background: #000; color: #e2e8f0; padding: 32px; border-radius: 12px; border: 1px solid rgba(37,99,235,0.3);">
      <h2 style="color: #38bdf8; margin: 0 0 16px;">Message received, ${esc(userName)}.</h2>
      <p style="color: #cbd5e1; line-height: 1.7; margin: 0 0 24px;">
        We&apos;ve received your message and will get back to you as soon as possible. Your message is currently <strong style="color: #38bdf8;">pending reply</strong>.
      </p>
      <div style="border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <p style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 8px;">Your message</p>
        <p style="color: #94a3b8; line-height: 1.6; margin: 0; white-space: pre-wrap;">${esc(body.message ?? body.teamMessage)}</p>
      </div>
      <p style="color: #64748b; font-size: 12px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px; line-height: 1.6;">
        If this is your first time receiving an email from <strong style="color: #94a3b8;">developers@projcaden.dev</strong>, please check your spam folder and unmark us as spam if applicable — we&apos;d hate for our reply to end up there.
      </p>
    </div>
  `;

  try {
    await Promise.all([
      resend.emails.send({
        from: "Project CADen <developers@projcaden.dev>",
        to: "developers@projcaden.dev",
        subject: emailSubject,
        html,
      }),
      resend.emails.send({
        from: "Project CADen <developers@projcaden.dev>",
        to: userEmail,
        subject: `Re: ${body.subject ?? body.teamSubject}`,
        html: userConfirmHtml,
      }),
      sql`
        INSERT INTO contact_rate_limits (key, kind, window_start, count)
        VALUES (${ip}, 'ip', NOW(), 1)
        ON CONFLICT (key, kind) DO UPDATE SET
          count        = CASE WHEN contact_rate_limits.window_start < NOW() - INTERVAL '10 minutes' THEN 1 ELSE contact_rate_limits.count + 1 END,
          window_start = CASE WHEN contact_rate_limits.window_start < NOW() - INTERVAL '10 minutes' THEN NOW() ELSE contact_rate_limits.window_start END
      `,
      sql`
        INSERT INTO contact_rate_limits (key, kind, window_start, count)
        VALUES (${submitterEmail}, 'email', NOW(), 1)
        ON CONFLICT (key, kind) DO UPDATE SET
          count        = CASE WHEN contact_rate_limits.window_start < NOW() - INTERVAL '30 minutes' THEN 1 ELSE contact_rate_limits.count + 1 END,
          window_start = CASE WHEN contact_rate_limits.window_start < NOW() - INTERVAL '30 minutes' THEN NOW() ELSE contact_rate_limits.window_start END
      `,
    ]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact email error:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
