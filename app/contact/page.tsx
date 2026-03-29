"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Turnstile } from "@marsidev/react-turnstile";
import type { TurnstileInstance } from "@marsidev/react-turnstile";

type FormType = "individual" | "team";
type Status = "idle" | "loading" | "success" | "error";

const ROLES = ["Student", "Instructor", "Project Manager", "Hobbyist", "Other"];

const inputClass = (error?: string) =>
  `w-full bg-white/[0.03] border ${error ? "border-red-500/60" : "border-white/10"} rounded-xl px-4 py-3 text-sm text-white font-sans placeholder:text-white/25 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all duration-200`;

const labelClass = "block text-xs text-white/40 font-medium tracking-wide mb-2 uppercase";
const errorClass = "text-xs text-red-400/80 mt-1.5";

const selectStyle = (hasValue: boolean) => ({
  color: hasValue ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.25)",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.3)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat" as const,
  backgroundPosition: "right 14px center",
});

export default function ContactPage() {
  const [type, setType] = useState<FormType>("individual");
  const [status, setStatus] = useState<Status>("idle");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const turnstileRef = useRef<TurnstileInstance>(null);

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
      if (!res.ok) {
        turnstileRef.current?.reset();
        setCaptchaToken(null);
      }
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
      turnstileRef.current?.reset();
      setCaptchaToken(null);
    }
  }

  return (
    <div className="relative min-h-screen bg-black flex flex-col items-center justify-center px-6 py-20 overflow-hidden">

      <div className="grid-bg absolute inset-0 pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="orb-1 absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div className="orb-2 absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%)", filter: "blur(40px)" }} />
      </div>

      <div
        className="relative z-10 w-full max-w-lg rounded-2xl border border-white/10 p-8 sm:p-10"
        style={{ background: "linear-gradient(145deg, rgba(37,99,235,0.06) 0%, rgba(0,0,0,0.8) 100%)", backdropFilter: "blur(20px)" }}
      >
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo copy.png" alt="Project CADen" width={28} height={28} style={{ width: 28, height: "auto" }} />
            <span className="text-white/60 text-sm font-medium">
              Project <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-sky-400">CADen</span>
            </span>
          </Link>
          <Link href="/" className="text-xs text-white/25 hover:text-white/50 transition-colors">← Back</Link>
        </div>

        {status === "success" ? (
          <div className="flex flex-col items-center text-center py-8 gap-4">
            <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white">Message received.</h2>
            <p className="text-sm text-white/40 max-w-xs leading-relaxed">We&apos;ll get back to you as soon as we can.</p>
            <button
              onClick={() => { sessionStorage.removeItem("introPlayed"); window.location.href = "/"; }}
              className="mt-4 text-xs text-blue-400/70 hover:text-blue-400 transition-colors"
            >
              ← Back to home
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-white mb-1">Get in touch</h1>
            <p className="text-sm text-white/30 mb-8">Have a question or want to learn more? We&apos;d love to hear from you.</p>

            <div className="flex gap-2 mb-8 p-1 rounded-xl bg-white/[0.03] border border-white/8">
              {(["individual", "team"] as FormType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setType(t); setErrors({}); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium tracking-wide transition-all duration-200 ${
                    type === t
                      ? "bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-600/20"
                      : "text-white/35 hover:text-white/60"
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
                    <input className={inputClass(errors.name)} placeholder="Your full name" value={name}
                      onChange={(e) => { setName(e.target.value); clearError("name"); }} />
                    {errors.name && <p className={errorClass}>{errors.name}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Email</label>
                    <input type="email" className={inputClass(errors.email)} placeholder="you@example.com" value={email}
                      onChange={(e) => { setEmail(e.target.value); clearError("email"); }} />
                    {errors.email && <p className={errorClass}>{errors.email}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Role</label>
                    <select className={inputClass(errors.role) + " cursor-pointer appearance-none pr-10"} value={role}
                      style={selectStyle(!!role)}
                      onChange={(e) => { setRole(e.target.value); setUniversity(""); clearError("role"); }}>
                      <option value="" disabled style={{ background: "#000" }}>Select your role</option>
                      {ROLES.map((r) => <option key={r} value={r} style={{ background: "#000" }}>{r}</option>)}
                    </select>
                    {errors.role && <p className={errorClass}>{errors.role}</p>}
                  </div>
                  {role === "Student" && (
                    <div>
                      <label className={labelClass}>University</label>
                      <input className={inputClass(errors.university)} placeholder="Your university or institution" value={university}
                        onChange={(e) => { setUniversity(e.target.value); clearError("university"); }} />
                      {errors.university && <p className={errorClass}>{errors.university}</p>}
                    </div>
                  )}
                  <div>
                    <label className={labelClass}>Subject</label>
                    <input className={inputClass(errors.subject)} placeholder="What's this about?" value={subject}
                      onChange={(e) => { setSubject(e.target.value); clearError("subject"); }} />
                    {errors.subject && <p className={errorClass}>{errors.subject}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Message</label>
                    <textarea className={inputClass(errors.message) + " resize-none"} rows={5} placeholder="What's on your mind?" value={message}
                      onChange={(e) => { setMessage(e.target.value); clearError("message"); }} />
                    {errors.message && <p className={errorClass}>{errors.message}</p>}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className={labelClass}>Rep Name</label>
                    <input className={inputClass(errors.teamRep)} placeholder="Your full name" value={teamRep}
                      onChange={(e) => { setTeamRep(e.target.value); clearError("teamRep"); }} />
                    {errors.teamRep && <p className={errorClass}>{errors.teamRep}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Email</label>
                    <input type="email" className={inputClass(errors.teamEmail)} placeholder="you@company.com" value={teamEmail}
                      onChange={(e) => { setTeamEmail(e.target.value); clearError("teamEmail"); }} />
                    {errors.teamEmail && <p className={errorClass}>{errors.teamEmail}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Organization</label>
                    <input className={inputClass(errors.teamOrg)} placeholder="Company or institution name" value={teamOrg}
                      onChange={(e) => { setTeamOrg(e.target.value); clearError("teamOrg"); }} />
                    {errors.teamOrg && <p className={errorClass}>{errors.teamOrg}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Your Role</label>
                    <input className={inputClass(errors.teamRole)} placeholder="e.g. Engineering Lead, CTO, Department Head" value={teamRole}
                      onChange={(e) => { setTeamRole(e.target.value); clearError("teamRole"); }} />
                    {errors.teamRole && <p className={errorClass}>{errors.teamRole}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Subject</label>
                    <input className={inputClass(errors.teamSubject)} placeholder="What's this about?" value={teamSubject}
                      onChange={(e) => { setTeamSubject(e.target.value); clearError("teamSubject"); }} />
                    {errors.teamSubject && <p className={errorClass}>{errors.teamSubject}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Message</label>
                    <textarea className={inputClass(errors.teamMessage) + " resize-none"} rows={5} placeholder="What's on your mind?" value={teamMessage}
                      onChange={(e) => { setTeamMessage(e.target.value); clearError("teamMessage"); }} />
                    {errors.teamMessage && <p className={errorClass}>{errors.teamMessage}</p>}
                  </div>
                </>
              )}

              <Turnstile
                ref={turnstileRef}
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                onSuccess={(token) => { setCaptchaToken(token); clearError("captcha"); }}
                onExpire={() => setCaptchaToken(null)}
                options={{ theme: "dark" }}
              />
              {errors.captcha && <p className={errorClass}>{errors.captcha}</p>}

              {status === "error" && (
                <p className={errorClass}>Something went wrong. Please try again.</p>
              )}

              <button
                type="submit"
                disabled={status === "loading" || !captchaToken}
                className="mt-2 w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-400 text-white text-sm font-semibold hover:opacity-90 transition-opacity duration-200 disabled:opacity-50 disabled:cursor-not-allowed glow-button"
              >
                {status === "loading" ? "Sending..." : "Send message"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
