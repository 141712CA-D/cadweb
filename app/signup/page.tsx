"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Turnstile } from "@marsidev/react-turnstile";
import type { TurnstileInstance } from "@marsidev/react-turnstile";

type FormType = "individual" | "team";
type Status = "idle" | "loading" | "success" | "welcome_back" | "duplicate" | "error";

const INDIVIDUAL_ROLES = ["Student", "Instructor", "Freelancer", "Hobbyist"];

const inputClass = (error?: string) =>
  `w-full bg-white border ${error ? "border-red-400" : "border-slate-200"} rounded-xl px-4 py-3 text-sm text-slate-900 font-sans placeholder:text-slate-300 focus:outline-none focus:border-blue-400 focus:bg-white transition-all duration-200`;

const labelClass = "block text-xs text-slate-500 font-medium tracking-wide mb-2 uppercase";
const errorClass = "text-xs text-red-500 mt-1.5";

export default function SignupPage() {
  const [type, setType] = useState<FormType>("individual");
  const [status, setStatus] = useState<Status>("idle");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const turnstileRef = useRef<TurnstileInstance>(null);

  useEffect(() => { document.body.style.overflow = ""; }, []);

  // Individual fields
  const [indName, setIndName]             = useState("");
  const [indEmail, setIndEmail]           = useState("");
  const [indRole, setIndRole]             = useState("");
  const [indUniversity, setIndUniversity] = useState("");
  const [indReason, setIndReason]         = useState("");

  // Team fields
  const [teamRep, setTeamRep]     = useState("");
  const [teamEmail, setTeamEmail] = useState("");
  const [teamOrg, setTeamOrg]     = useState("");
  const [teamRole, setTeamRole]   = useState("");
  const [teamUsage, setTeamUsage] = useState("");

  function clearError(field: string) {
    setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (type === "individual") {
      if (!indName.trim())    e.indName   = "Name is required.";
      if (!indEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(indEmail)) e.indEmail = "Please enter a valid email address.";
      if (!indRole)           e.indRole   = "Please select a role.";
      if (indRole === "Student" && !indUniversity.trim()) e.indUniversity = "Please enter where you attend.";
      if (indRole === "Instructor" && !indUniversity.trim()) e.indUniversity = "Please enter where you teach.";
      if (!indReason.trim())  e.indReason = "Please tell us why you want to use CADen.";
    } else {
      if (!teamRep.trim())    e.teamRep   = "Name is required.";
      if (!teamEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(teamEmail)) e.teamEmail = "Please enter a valid email address.";
      if (!teamOrg.trim())    e.teamOrg   = "Organization is required.";
      if (!teamRole.trim())   e.teamRole  = "Role is required.";
      if (!teamUsage.trim())  e.teamUsage = "Please describe your intended usage.";
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
        ? { type, name: indName, email: indEmail, role: indRole, university: indUniversity, reason: indReason }
        : { type, repName: teamRep, email: teamEmail, org: teamOrg, role: teamRole, usage: teamUsage };

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, captchaToken }),
      });
      if (res.status === 409) {
        setStatus("duplicate");
        return;
      }
      if (!res.ok) {
        turnstileRef.current?.reset();
        setCaptchaToken(null);
        setStatus("error");
        return;
      }
      const data = await res.json();
      setStatus(data.returning ? "welcome_back" : "success");
    } catch {
      setStatus("error");
      turnstileRef.current?.reset();
      setCaptchaToken(null);
    }
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
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex-shrink-0 w-4 h-4 sm:w-7 sm:h-7">
              <Image src="/logo.svg" alt="Parametra" width={56} height={56} className="w-full h-auto" />
            </div>
            <span className="text-slate-500 text-sm font-medium whitespace-nowrap">
              Parametra
            </span>
          </Link>
          <Link href="/" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">← Back</Link>
        </div>

        {status === "welcome_back" ? (
          <div className="flex flex-col items-center text-center py-8 gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Welcome back to the list.</h2>
            <p className="text-sm text-slate-500 max-w-xs leading-relaxed">Good to see you again. You&apos;re back on the waitlist — we&apos;ll be in touch when access opens up.</p>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">If this is your first time receiving an email from developers@projcaden.dev, please unmark us as spam if applicable.</p>
            <button
              onClick={() => { sessionStorage.removeItem("introPlayed"); window.location.href = "/"; }}
              className="mt-4 text-xs text-blue-600 hover:text-blue-700 transition-colors"
            >
              ← Back to home
            </button>
          </div>
        ) : status === "duplicate" ? (
          <div className="flex flex-col items-center text-center py-8 gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Already registered.</h2>
            <p className="text-sm text-slate-500 max-w-xs leading-relaxed">This email is already on the waitlist. We&apos;ll be in touch when access opens up.</p>
            <button
              onClick={() => { sessionStorage.removeItem("introPlayed"); window.location.href = "/"; }}
              className="mt-4 text-xs text-blue-600 hover:text-blue-700 transition-colors"
            >
              ← Back to home
            </button>
          </div>
        ) : status === "success" ? (
          <div className="flex flex-col items-center text-center py-8 gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900">You&apos;re on the list.</h2>
            <p className="text-sm text-slate-500 max-w-xs leading-relaxed">We&apos;ll reach out when access opens up. Big things are coming.</p>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">If this is your first time receiving an email from developers@projcaden.dev, please unmark us as spam if applicable.</p>
            <button
              onClick={() => { sessionStorage.removeItem("introPlayed"); window.location.href = "/"; }}
              className="mt-4 text-xs text-blue-600 hover:text-blue-700 transition-colors"
            >
              ← Back to home
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Join the waitlist</h1>
            <p className="text-sm text-slate-500 mb-8">Tell us who you are and we&apos;ll be in touch.</p>

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
                    <input className={inputClass(errors.indName)} placeholder="Your full name" value={indName} maxLength={80}
                      onChange={(e) => { setIndName(e.target.value); clearError("indName"); }} />
                    {errors.indName && <p className={errorClass}>{errors.indName}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Email</label>
                    <input type="email" className={inputClass(errors.indEmail)} placeholder="you@example.com" value={indEmail} maxLength={254}
                      onChange={(e) => { setIndEmail(e.target.value); clearError("indEmail"); }} />
                    {errors.indEmail && <p className={errorClass}>{errors.indEmail}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Role</label>
                    <select className={inputClass(errors.indRole) + " cursor-pointer appearance-none pr-10"} value={indRole}
                      style={{
                        color: indRole ? "rgb(15,23,42)" : "rgb(203,213,225)",
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgb(100,116,139)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 14px center",
                      }}
                      onChange={(e) => { setIndRole(e.target.value); setIndUniversity(""); clearError("indRole"); }}>
                      <option value="" disabled style={{ background: "#F5F0E8" }}>Select your role</option>
                      {INDIVIDUAL_ROLES.map((r) => <option key={r} value={r} style={{ background: "#F5F0E8" }}>{r}</option>)}
                    </select>
                    {errors.indRole && <p className={errorClass}>{errors.indRole}</p>}
                  </div>
                  {indRole === "Student" && (
                    <div>
                      <label className={labelClass}>University / Institution / School</label>
                      <input className={inputClass(errors.indUniversity)} placeholder="Where do you attend?" value={indUniversity} maxLength={120}
                        onChange={(e) => { setIndUniversity(e.target.value); clearError("indUniversity"); }} />
                      {errors.indUniversity && <p className={errorClass}>{errors.indUniversity}</p>}
                    </div>
                  )}
                  {indRole === "Instructor" && (
                    <div>
                      <label className={labelClass}>University / Institution / School</label>
                      <input className={inputClass(errors.indUniversity)} placeholder="Where do you teach?" value={indUniversity} maxLength={120}
                        onChange={(e) => { setIndUniversity(e.target.value); clearError("indUniversity"); }} />
                      {errors.indUniversity && <p className={errorClass}>{errors.indUniversity}</p>}
                    </div>
                  )}
                  <div>
                    <label className={labelClass}>Why do you want to use CADen?</label>
                    <textarea className={inputClass(errors.indReason) + " resize-none"} rows={4} placeholder="Tell us about your use case..." value={indReason} maxLength={1000}
                      onChange={(e) => { setIndReason(e.target.value); clearError("indReason"); }} />
                    <div className="flex justify-between items-center mt-1">
                      {errors.indReason ? <p className={errorClass}>{errors.indReason}</p> : <span />}
                      <span className={`text-xs ${indReason.length >= 1000 ? "text-red-500" : indReason.length > 800 ? "text-amber-500" : "text-slate-300"}`}>{indReason.length} / 1000</span>
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
                    <label className={labelClass}>Intended Usage</label>
                    <textarea className={inputClass(errors.teamUsage) + " resize-none"} rows={4} placeholder="How would your team use CADen? What problems are you solving?" value={teamUsage} maxLength={1000}
                      onChange={(e) => { setTeamUsage(e.target.value); clearError("teamUsage"); }} />
                    <div className="flex justify-between items-center mt-1">
                      {errors.teamUsage ? <p className={errorClass}>{errors.teamUsage}</p> : <span />}
                      <span className={`text-xs ${teamUsage.length >= 1000 ? "text-red-500" : teamUsage.length > 800 ? "text-amber-500" : "text-slate-300"}`}>{teamUsage.length} / 1000</span>
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
                {status === "loading" ? "Sending..." : "Request access"}
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
          <Link href="/how-it-works" className="text-xs text-slate-800 hover:text-slate-900 transition-colors">How it works</Link>
          <Link href="/about" className="text-xs text-slate-800 hover:text-slate-900 transition-colors">About</Link>
          <Link href="/contact" className="text-xs text-slate-800 hover:text-slate-900 transition-colors">Contact us</Link>
          <Link href="/terms" className="text-xs text-slate-800 hover:text-slate-900 transition-colors">Terms</Link>
          <Link href="/privacy-policy" className="text-xs text-slate-800 hover:text-slate-900 transition-colors">Privacy</Link>
        </div>
      </div>
    </footer>
    </>
  );
}
