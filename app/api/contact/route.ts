import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

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
    if (role === "Student" && missing(university))
      return NextResponse.json({ success: false, error: "University required for students" }, { status: 400 });
  } else if (type === "team") {
    const { repName, email, org, role } = body;
    if (missing(repName, email, org, role, subject, message) || !EMAIL_RE.test(email))
      return NextResponse.json({ success: false, error: "Missing or invalid fields" }, { status: 400 });
  } else {
    return NextResponse.json({ success: false, error: "Invalid type" }, { status: 400 });
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
          <tr><td style="color: #94a3b8; padding: 8px 0; width: 140px;">Rep Name</td><td style="color: #f1f5f9;">${repName}</td></tr>
          <tr><td style="color: #94a3b8; padding: 8px 0;">Email</td><td style="color: #38bdf8;"><a href="mailto:${email}" style="color: #38bdf8;">${email}</a></td></tr>
          <tr><td style="color: #94a3b8; padding: 8px 0;">Organization</td><td style="color: #f1f5f9;">${org}</td></tr>
          <tr><td style="color: #94a3b8; padding: 8px 0;">Role</td><td style="color: #f1f5f9;">${role}</td></tr>
          <tr><td style="color: #94a3b8; padding: 8px 0;">Subject</td><td style="color: #f1f5f9;">${subject}</td></tr>
          <tr><td style="color: #94a3b8; padding: 8px 0; vertical-align: top;">Message</td><td style="color: #f1f5f9; line-height: 1.6;">${message}</td></tr>
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
          <tr><td style="color: #94a3b8; padding: 8px 0; width: 140px;">Name</td><td style="color: #f1f5f9;">${name}</td></tr>
          <tr><td style="color: #94a3b8; padding: 8px 0;">Email</td><td style="color: #38bdf8;"><a href="mailto:${email}" style="color: #38bdf8;">${email}</a></td></tr>
          <tr><td style="color: #94a3b8; padding: 8px 0;">Role</td><td style="color: #f1f5f9;">${role}</td></tr>
          ${university ? `<tr><td style="color: #94a3b8; padding: 8px 0;">University</td><td style="color: #f1f5f9;">${university}</td></tr>` : ""}
          <tr><td style="color: #94a3b8; padding: 8px 0;">Subject</td><td style="color: #f1f5f9;">${subject}</td></tr>
          <tr><td style="color: #94a3b8; padding: 8px 0; vertical-align: top;">Message</td><td style="color: #f1f5f9; line-height: 1.6;">${message}</td></tr>
        </table>
      </div>
    `;
  }

  try {
    await resend.emails.send({
      from: "Project CADen <developers@projcaden.dev>",
      to: "developers@projcaden.dev",
      subject: emailSubject,
      html,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact email error:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
