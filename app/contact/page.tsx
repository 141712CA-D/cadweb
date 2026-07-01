"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Turnstile } from "@marsidev/react-turnstile";
import type { TurnstileInstance } from "@marsidev/react-turnstile";

type FormType = "individual" | "team";
type Status = "idle" | "loading" | "verify" | "success" | "cooldown" | "error";

const ROLES = ["Student", "Instructor", "Freelancer", "Hobbyist", "Other"];

const inputClass = (error?: string) =>
  `w-full bg-white border ${error ? "border-red-400" : "border-slate-200"} rounded-xl px-4 py-3 text-sm text-slate-900 font-sans placeholder:text-slate-300 focus:outline-none focus:border-blue-400 focus:bg-white transition-all duration-200`;

const labelClass = "block text-xs text-slate-500 font-medium tracking-wide mb-2 uppercase";
const errorClass = "text-xs text-red-500 mt-1.5";

const selectStyle = (hasValue: boolean) => ({
  color: hasValue ? "rgb(15,23,42)" : "rgb(203,213,225)",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgb(100,116,139)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat" as const,
  backgroundPosition: "right 14px center",
});

export default function ContactPage() {
  const [type, setType] = useState<FormType>("individual");
  const [status, setStatus] = useState<Status>("idle");
  const [cooldownMins, setCooldownMins] = useState(0);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const turnstileRef = useRef<TurnstileInstance>(null);

  // Email-verification step state
  const [code, setCode] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => { document.body.style.overflow = ""; }, []);

  // Individual fields
  const [name, setName]             = useState("");
  const [email, setEmail]           = useState("");
  const [role, setRole]             = useState("");
  const [university, setUniversity] = useState("");
  const [subject, setSubject]       = useState("");
  const [message, setMessage]       = useState("");

  // Team fields
  const [teamRep, setTeamRep]       = useState("");
  const [teamEmail, setTeamEmail]   = useState("");
  const [teamOrg, setTeamOrg]       = useState("");
  const [teamRole, setTeamRole]     = useState("");
  const [teamSubject, setTeamSubject] = useState("");
  const [teamMessage, setTeamMessage] = useState("");

  function clearError(field: string) {
    setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (type === "individual") {
      if (!name.trim())    e.name    = "Name is required.";
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Please enter a valid email address.";
      if (!role)           e.role    = "Please select a role.";
      if (role === "Student" && !university.trim()) e.university = "University is required for students.";
      if (!subject.trim()) e.subject = "Subject is required.";
      if (!message.trim()) e.message = "Please enter a message.";
    } else {
      if (!teamRep.trim())     e.teamRep     = "Name is required.";
      if (!teamEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(teamEmail)) e.teamEmail = "Please enter a valid email address.";
      if (!teamOrg.trim())     e.teamOrg     = "Organization is required.";
      if (!teamRole.trim())    e.teamRole    = "Role is required.";
      if (!teamSubject.trim()) e.teamSubject = "Subject is required.";
      if (!teamMessage.trim()) e.teamMessage = "Please enter a message.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    if (!captchaToken) {
      setErrors({ captcha: "Please complete the verification." });
      return;
    }
    setStatus("loading");

    const payload =
      type === "individual"
        ? { type, name, email, role, university, subject, message }
        : { type, repName: teamRep, email: teamEmail, org: teamOrg, role: teamRole, subject: teamSubject, message: teamMessage };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, captchaToken }),
      });
      if (res.status === 429) {
        const data = await res.json();
        setCooldownMins(Math.ceil((data.retryAfter ?? 3600) / 60));
        setStatus("cooldown");
        turnstileRef.current?.reset();
        setCaptchaToken(null);
        return;
      }
      if (!res.ok) {
        turnstileRef.current?.reset();
        setCaptchaToken(null);
        setStatus("error");
        return;
      }
      // Step 1 succeeded — a code was emailed. Move to the verification screen.
      setPendingEmail(type === "individual" ? email : teamEmail);
      setCode("");
      setVerifyError("");
      setStatus("verify");
    } catch {
      setStatus("error");
      turnstileRef.current?.reset();
      setCaptchaToken(null);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(code.trim())) {
      setVerifyError("Enter the 6-digit code from your email.");
      return;
    }
    setVerifying(true);
    setVerifyError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "verify", email: pendingEmail, code: code.trim() }),
      });
      if (res.ok) {
        setStatus("success");
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (res.status === 410 || data.error === "expired") {
        setVerifyError("That code expired. Start over to get a new one.");
      } else if (res.status === 429 || data.error === "too_many_attempts") {
        setVerifyError("Too many attempts. Start over to get a new code.");
      } else {
        setVerifyError("Incorrect code. Please try again.");
      }
    } catch {
      setVerifyError("Something went wrong. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  function startOver() {
    setStatus("idle");
    setCode("");
    setVerifyError("");
    turnstileRef.current?.reset();
    setCaptchaToken(null);
  }

  return (
    <>
    <div className="relative min-h-screen bg-[#F5F0E8] flex flex-col items-center justify-center px-6 py-20 overflow-hidden">

      <div className="grid-bg absolute inset-0 pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="orb-1 absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(199,226,255,0.5) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div className="orb-2 absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(199,226,255,0.35) 0%, transparent 70%)", filter: "blur(40px)" }} />
      </div>

      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 sm:p-10 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Parametra" style={{ width: 32, height: 32, display: "block", flexShrink: 0, filter: "brightness(0)" }} />
            <span className="text-slate-900 font-semibold text-base tracking-tight whitespace-nowrap">
              Parametra
            </span>
          </Link>
          <Link href="/" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">← Back</Link>
        </div>

        {status === "cooldown" ? (
          <div className="flex flex-col items-center text-center py-8 gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Slow down.</h2>
            <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
              You already sent a message recently. Try again in about {cooldownMins} minute{cooldownMins !== 1 ? "s" : ""}.
            </p>
            <button
              onClick={() => setStatus("idle")}
              className="mt-4 text-xs text-blue-600 hover:text-blue-700 transition-colors"
            >
              ← Go back
            </button>
          </div>
        ) : status === "verify" ? (
          <div className="flex flex-col items-center text-center py-4 gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Check your email.</h2>
            <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
              We sent a 6-digit code to <span className="text-slate-900 font-medium">{pendingEmail}</span>. Enter it below to send your message.
            </p>
            <form onSubmit={handleVerify} noValidate className="w-full max-w-xs flex flex-col gap-3 mt-2">
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setVerifyError(""); }}
                className={`w-full bg-white border ${verifyError ? "border-red-400" : "border-slate-200"} rounded-xl px-4 py-3 text-center text-2xl tracking-[0.4em] font-mono text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-blue-400 transition-all duration-200`}
              />
              {verifyError && <p className={errorClass}>{verifyError}</p>}
              <button
                type="submit"
                disabled={verifying || code.length !== 6}
                className="w-full py-3.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifying ? "Verifying..." : "Verify & send"}
              </button>
            </form>
            <button onClick={startOver} className="mt-2 text-xs text-blue-600 hover:text-blue-700 transition-colors">
              Didn&apos;t get it? Start over
            </button>
          </div>
        ) : status === "success" ? (
          <div className="flex flex-col items-center text-center py-8 gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Message received.</h2>
            <p className="text-sm text-slate-500 max-w-xs leading-relaxed">We&apos;ll get back to you as soon as we can.</p>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">If this is your first time receiving an email from {process.env.NEXT_PUBLIC_MAIL_FROM_EMAIL ?? "no-reply@parametra.ai"}, please unmark us as spam if applicable.</p>
            <button
              onClick={() => { sessionStorage.removeItem("introPlayed"); window.location.href = "/"; }}
              className="mt-4 text-xs text-blue-600 hover:text-blue-700 transition-colors"
            >
              ← Back to home
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Get in touch</h1>
            <p className="text-sm text-slate-500 mb-8">Have a question or want to learn more? Drop us a message.</p>

            <div className="flex gap-2 mb-8 p-1 rounded-xl bg-slate-100 border border-slate-200">
              {(["individual", "team"] as FormType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setType(t); setErrors({}); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium tracking-wide transition-all duration-200 ${
                    type === t
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {t === "individual" ? "Individual" : "Team / Organization"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
              {type === "individual" ? (
                <>
                  <div>
                    <label className={labelClass}>Name</label>
                    <input className={inputClass(errors.name)} placeholder="Your full name" value={name} maxLength={80}
                      onChange={(e) => { setName(e.target.value); clearError("name"); }} />
                    {errors.name && <p className={errorClass}>{errors.name}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Email</label>
                    <input type="email" className={inputClass(errors.email)} placeholder="you@example.com" value={email} maxLength={254}
                      onChange={(e) => { setEmail(e.target.value); clearError("email"); }} />
                    {errors.email && <p className={errorClass}>{errors.email}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Role</label>
                    <select className={inputClass(errors.role) + " cursor-pointer appearance-none pr-10"} value={role}
                      style={selectStyle(!!role)}
                      onChange={(e) => { setRole(e.target.value); setUniversity(""); clearError("role"); }}>
                      <option value="" disabled style={{ background: "#F5F0E8" }}>Select your role</option>
                      {ROLES.map((r) => <option key={r} value={r} style={{ background: "#F5F0E8" }}>{r}</option>)}
                    </select>
                    {errors.role && <p className={errorClass}>{errors.role}</p>}
                  </div>
                  {role === "Student" && (
                    <div>
                      <label className={labelClass}>University</label>
                      <input className={inputClass(errors.university)} placeholder="Your university or institution" value={university} maxLength={120}
                        onChange={(e) => { setUniversity(e.target.value); clearError("university"); }} />
                      {errors.university && <p className={errorClass}>{errors.university}</p>}
                    </div>
                  )}
                  <div>
                    <label className={labelClass}>Subject</label>
                    <input className={inputClass(errors.subject)} placeholder="What's this about?" value={subject} maxLength={120}
                      onChange={(e) => { setSubject(e.target.value); clearError("subject"); }} />
                    {errors.subject && <p className={errorClass}>{errors.subject}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Message</label>
                    <textarea className={inputClass(errors.message) + " resize-none"} rows={5} placeholder="What's on your mind?" value={message} maxLength={2000}
                      onChange={(e) => { setMessage(e.target.value); clearError("message"); }} />
                    <div className="flex justify-between items-center mt-1">
                      {errors.message ? <p className={errorClass}>{errors.message}</p> : <span />}
                      <span className={`text-xs ${message.length >= 2000 ? "text-red-500" : message.length > 1600 ? "text-amber-500" : "text-slate-300"}`}>{message.length} / 2000</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className={labelClass}>Rep Name</label>
                    <input className={inputClass(errors.teamRep)} placeholder="Your full name" value={teamRep} maxLength={80}
                      onChange={(e) => { setTeamRep(e.target.value); clearError("teamRep"); }} />
                    {errors.teamRep && <p className={errorClass}>{errors.teamRep}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Email</label>
                    <input type="email" className={inputClass(errors.teamEmail)} placeholder="you@company.com" value={teamEmail} maxLength={254}
                      onChange={(e) => { setTeamEmail(e.target.value); clearError("teamEmail"); }} />
                    {errors.teamEmail && <p className={errorClass}>{errors.teamEmail}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Organization</label>
                    <input className={inputClass(errors.teamOrg)} placeholder="Company or institution name" value={teamOrg} maxLength={120}
                      onChange={(e) => { setTeamOrg(e.target.value); clearError("teamOrg"); }} />
                    {errors.teamOrg && <p className={errorClass}>{errors.teamOrg}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Your Role</label>
                    <input className={inputClass(errors.teamRole)} placeholder="e.g. Engineering Lead, CTO, Department Head" value={teamRole} maxLength={80}
                      onChange={(e) => { setTeamRole(e.target.value); clearError("teamRole"); }} />
                    {errors.teamRole && <p className={errorClass}>{errors.teamRole}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Subject</label>
                    <input className={inputClass(errors.teamSubject)} placeholder="What's this about?" value={teamSubject} maxLength={120}
                      onChange={(e) => { setTeamSubject(e.target.value); clearError("teamSubject"); }} />
                    {errors.teamSubject && <p className={errorClass}>{errors.teamSubject}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Message</label>
                    <textarea className={inputClass(errors.teamMessage) + " resize-none"} rows={5} placeholder="What's on your mind?" value={teamMessage} maxLength={2000}
                      onChange={(e) => { setTeamMessage(e.target.value); clearError("teamMessage"); }} />
                    <div className="flex justify-between items-center mt-1">
                      {errors.teamMessage ? <p className={errorClass}>{errors.teamMessage}</p> : <span />}
                      <span className={`text-xs ${teamMessage.length >= 2000 ? "text-red-500" : teamMessage.length > 1600 ? "text-amber-500" : "text-slate-300"}`}>{teamMessage.length} / 2000</span>
                    </div>
                  </div>
                </>
              )}

              <Turnstile
                ref={turnstileRef}
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                onSuccess={(token) => { setCaptchaToken(token); clearError("captcha"); }}
                onExpire={() => setCaptchaToken(null)}
                options={{ theme: "light" }}
              />
              {errors.captcha && <p className={errorClass}>{errors.captcha}</p>}

              {status === "error" && (
                <p className={errorClass}>Something went wrong. Please try again.</p>
              )}

              <button
                type="submit"
                disabled={status === "loading" || !captchaToken}
                className="mt-2 w-full py-3.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === "loading" ? "Sending..." : "Send message"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
    <footer className="bg-[#F5F0E8] border-t border-slate-300 py-6 px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-slate-700">© {new Date().getFullYear()} Parametra. All rights reserved.</p>
        <div className="grid grid-cols-3 gap-x-6 gap-y-3 sm:flex sm:items-center sm:gap-6">
          <Link href="/how-it-works" className="text-xs text-slate-800 hover:text-slate-900 transition-colors">How It Works</Link>
          <Link href="/about" className="text-xs text-slate-800 hover:text-slate-900 transition-colors">About</Link>
          <Link href="/signup" className="text-xs text-slate-800 hover:text-slate-900 transition-colors">Join Waitlist</Link>
          <Link href="/terms" className="text-xs text-slate-800 hover:text-slate-900 transition-colors">Terms</Link>
          <Link href="/privacy-policy" className="text-xs text-slate-800 hover:text-slate-900 transition-colors">Privacy</Link>
        </div>
      </div>
    </footer>
    </>
  );
}
