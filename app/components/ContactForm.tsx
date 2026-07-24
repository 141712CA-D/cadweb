"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Turnstile } from "@marsidev/react-turnstile";
import type { TurnstileInstance } from "@marsidev/react-turnstile";
import { apiUrl } from "@/lib/api";
import { consumeExpired } from "@/lib/consumeExpired";
import { isValidEmail } from "@/lib/email";
import MorphSwitch from "./MorphSwitch";
import CollegeAutocomplete from "./CollegeAutocomplete";
import { isKnownUniversity, loadUniversities, type University } from "@/lib/collegeSearch";

type FormType = "individual" | "team";
type Status = "idle" | "loading" | "verify" | "success" | "cooldown" | "error";

const ROLES = ["Student", "Instructor", "Freelancer", "Hobbyist", "Other"];

// Mirrors ContactRequest.ValidateBody() on the backend — the frontend's own
// maxLength/validate() should catch all of these before submit, but the
// backend is the source of truth (e.g. a bypassed client), so its rejection
// still needs to land on the right field instead of a generic error.
function mapContactError(error: string | undefined, type: FormType): { field?: string; message: string } {
  switch (error) {
    case "Invalid captcha":
      return { field: "captcha", message: "Please complete the verification." };
    case "Name too long":
      return { field: type === "individual" ? "name" : "teamRep", message: "That name is too long." };
    case "Email too long":
      return { field: type === "individual" ? "email" : "teamEmail", message: "That email is too long." };
    case "University name too long":
      return { field: "university", message: "That school name is too long." };
    case "Subject too long":
      return { field: type === "individual" ? "subject" : "teamSubject", message: "Please shorten the subject." };
    case "Message too long":
      return { field: type === "individual" ? "message" : "teamMessage", message: "Please shorten your message." };
    case "University required for students":
      return { field: "university", message: "Please enter where you study." };
    case "Organization name too long":
      return { field: "teamOrg", message: "That organization name is too long." };
    case "Role too long":
      return { field: "teamRole", message: "Please shorten your role." };
    case "Invalid university":
      return { field: "university", message: "Please select a university from the list." };
    default:
      return { message: "Something went wrong. Please try again." };
  }
}

const inputClass = (error?: string) =>
  `w-full rounded-md bg-[#eef2f9] border ${error ? "border-red-500/60" : "border-[#dbe6f5]"} px-4 py-3 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#3b82f6] transition-all duration-150 font-mono`;

const labelClass = "block font-mono text-xs uppercase tracking-[0.2em] text-[#64748b] mb-1.5";
const errorClass = "text-xs text-red-400/80 mt-1.5";

interface ContactFormProps {
  onSuccess?: () => void;
  isModal?: boolean;
}

export default function ContactForm({ onSuccess, isModal = false }: ContactFormProps) {
  const [type, setType] = useState<FormType>("individual");
  const [status, setStatus] = useState<Status>("idle");
  const [cooldownMins, setCooldownMins] = useState(0);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState("Something went wrong. Please try again.");
  const turnstileRef = useRef<TurnstileInstance>(null);

  const [code, setCode] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [verifying, setVerifying] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [university, setUniversity] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [teamRep, setTeamRep] = useState("");
  const [teamEmail, setTeamEmail] = useState("");
  const [teamOrg, setTeamOrg] = useState("");
  const [teamRole, setTeamRole] = useState("");
  const [teamSubject, setTeamSubject] = useState("");
  const [teamMessage, setTeamMessage] = useState("");

  // Loaded once the university field is actually relevant (not on initial
  // mount) — validate()/allFieldsFilled use it to require an exact match
  // against a real listed school, same dataset CollegeAutocomplete suggests
  // from.
  const [universities, setUniversities] = useState<University[] | null>(null);
  const needsUniversity = role === "Student";
  useEffect(() => {
    if (needsUniversity) loadUniversities().then(setUniversities);
  }, [needsUniversity]);
  const universityIsValid = !needsUniversity || (universities !== null && isKnownUniversity(university, universities));

  // Surfaces the "not a listed school" error as soon as the user leaves the
  // field, rather than only on submit — the disabled submit button alone
  // doesn't explain why.
  const handleUniversityBlur = () => {
    if (!university.trim()) return;
    if (universities === null) {
      setErrors((prev) => ({ ...prev, university: "Still loading schools — please try again in a moment." }));
    } else if (!isKnownUniversity(university, universities)) {
      setErrors((prev) => ({ ...prev, university: "Please select a university from the list." }));
    }
  };

  const allFieldsFilled =
    type === "individual"
      ? name.trim() !== "" &&
        isValidEmail(email) &&
        role !== "" &&
        universityIsValid &&
        subject.trim() !== "" &&
        message.trim() !== ""
      : teamRep.trim() !== "" &&
        isValidEmail(teamEmail) &&
        teamOrg.trim() !== "" &&
        teamRole.trim() !== "" &&
        teamSubject.trim() !== "" &&
        teamMessage.trim() !== "";

  function clearError(field: string) {
    setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (type === "individual") {
      if (!name.trim()) e.name = "Name is required.";
      if (!email.trim() || !isValidEmail(email)) e.email = "Please enter a valid email address.";
      if (!role) e.role = "Please select a role.";
      if (role === "Student" && !university.trim()) e.university = "University is required for students.";
      else if (needsUniversity && universities === null) e.university = "Still loading schools — please try again in a moment.";
      else if (needsUniversity && !universityIsValid) e.university = "Please select a university from the list.";
      if (!subject.trim()) e.subject = "Subject is required.";
      if (!message.trim()) e.message = "Please enter a message.";
    } else {
      if (!teamRep.trim()) e.teamRep = "Name is required.";
      if (!teamEmail.trim() || !isValidEmail(teamEmail)) e.teamEmail = "Please enter a valid email address.";
      if (!teamOrg.trim()) e.teamOrg = "Organization is required.";
      if (!teamRole.trim()) e.teamRole = "Role is required.";
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
      const res = await fetch(apiUrl("/api/contact/request"), {
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
        const data = await res.json().catch(() => ({}));
        const mapped = mapContactError(data.error, type);
        if (mapped.field) {
          setErrors((prev) => ({ ...prev, [mapped.field as string]: mapped.message }));
          setStatus("idle");
        } else {
          setErrorMessage(mapped.message);
          setStatus("error");
        }
        return;
      }
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
      const res = await fetch(apiUrl("/api/contact/verify"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail, code: code.trim() }),
      });
      if (res.ok) {
        void consumeExpired("contact");
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

  function reset() {
    setType("individual");
    setStatus("idle");
    setCaptchaToken(null);
    setErrors({});
    setErrorMessage("Something went wrong. Please try again.");
    setCode("");
    setVerifyError("");
    setPendingEmail("");
    setName("");
    setEmail("");
    setRole("");
    setUniversity("");
    setSubject("");
    setMessage("");
    setTeamRep("");
    setTeamEmail("");
    setTeamOrg("");
    setTeamRole("");
    setTeamSubject("");
    setTeamMessage("");
    setCooldownMins(0);
    turnstileRef.current?.reset();
  }

  const handleSuccess = () => {
    reset();
    if (onSuccess) {
      onSuccess();
    } else if (!isModal) {
      window.location.href = "/";
    }
  };

  return (
    <div className={isModal ? "" : "min-h-screen bg-[#f8fafc] grid-bg flex flex-col items-center justify-center px-4 py-12"}>
      <div className={isModal ? "w-full" : "w-full max-w-lg"}>

        {!isModal && (
          <div className="flex items-center justify-between mb-8">
            <Link href="/" className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="Parametra" style={{ width: 32, height: 32, display: "block", flexShrink: 0, filter: "brightness(0)" }} />
              <span className="text-[#0f172a] font-mono text-sm tracking-tight">Parametra</span>
            </Link>
            <Link href="/" className="font-mono text-xs text-[#64748b] hover:text-[#3b82f6] transition-colors">← Back</Link>
          </div>
        )}

        {status === "cooldown" ? (
          <div className="flex flex-col items-center text-center py-8 gap-4">
            <div className="w-12 h-12 rounded-full border border-[#dbe6f5] bg-[#eef2f9] flex items-center justify-center">
              <svg className="w-6 h-6 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="font-mono text-sm uppercase tracking-widest text-[#0f172a]">Slow down.</h2>
            <p className="text-sm text-[#475569] max-w-sm">You already sent a message recently. Try again in about {cooldownMins} minute{cooldownMins !== 1 ? "s" : ""}.</p>
            <button
              onClick={() => setStatus("idle")}
              className="mt-4 font-mono text-xs text-[#64748b] hover:text-[#3b82f6] transition-colors"
            >
              Go back
            </button>
          </div>
        ) : status === "verify" ? (
          <div className="flex flex-col items-center text-center py-4 gap-4">
            <div className="w-12 h-12 rounded-full border border-[#dbe6f5] bg-[#eef2f9] flex items-center justify-center">
              <svg className="w-6 h-6 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="font-mono text-sm uppercase tracking-widest text-[#0f172a]">Check your email.</h2>
            <p className="text-sm text-[#475569] max-w-sm">We sent a 6-digit code to <span className="font-mono text-[#0f172a]">{pendingEmail}</span>. Enter it below to send your message.</p>
            <form onSubmit={handleVerify} noValidate className="w-full max-w-xs flex flex-col gap-3 mt-2">
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setVerifyError(""); }}
                className={`w-full rounded-md bg-[#eef2f9] border ${verifyError ? "border-red-500/60" : "border-[#dbe6f5]"} px-4 py-3 text-center text-2xl tracking-[0.4em] font-mono text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#3b82f6] transition-all duration-150`}
              />
              {verifyError && <p className={errorClass}>{verifyError}</p>}
              <button
                type="submit"
                disabled={verifying || code.length !== 6}
                className="cursor-pointer w-full rounded-md py-2.5 bg-[#3b82f6] text-white font-mono text-xs uppercase tracking-widest hover:bg-[#2563eb] transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {verifying ? "Verifying..." : "Verify & send"}
              </button>
            </form>
            <button onClick={startOver} className="mt-2 font-mono text-xs text-[#64748b] hover:text-[#3b82f6] transition-colors">
              Didn&apos;t get it? Start over
            </button>
          </div>
        ) : status === "success" ? (
          <div className="flex flex-col items-center text-center py-8 gap-4">
            <div className="w-12 h-12 rounded-full border border-[#3b82f6]/30 bg-[#eef2f9] flex items-center justify-center">
              <svg className="w-6 h-6 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-mono text-sm uppercase tracking-widest text-[#0f172a]">Message received.</h2>
            <p className="text-sm text-[#475569] max-w-sm">We&apos;ll get back to you as soon as we can.</p>
            <p className="text-xs text-[#64748b] max-w-sm">If this is your first time receiving an email from {process.env.NEXT_PUBLIC_MAIL_FROM_EMAIL ?? "no-reply@parametra.ai"}, please unmark us as spam if applicable.</p>
            <button onClick={handleSuccess} className="mt-4 font-mono text-xs text-[#64748b] hover:text-[#3b82f6] transition-colors">
              Done
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Get in touch</h1>
            <p className="font-mono text-xs text-[#64748b] mb-6">Have a question or want to learn more? Drop us a message.</p>

            <div className="flex gap-0 mb-6 rounded-md border border-[#dbe6f5] overflow-hidden">
              {(["individual", "team"] as FormType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setType(t); setErrors({}); }}
                  className={`cursor-pointer flex-1 py-2 px-3 font-mono text-xs uppercase tracking-widest transition-all duration-150 ${
                    type === t
                      ? "bg-[#3b82f6] text-white"
                      : "text-[#64748b] hover:text-[#0f172a] bg-transparent"
                  }`}
                >
                  {t === "individual" ? "Individual" : "Team / Org"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              <MorphSwitch activeKey={type}>
              {type === "individual" ? (
                <div className="space-y-4">
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
                    <select aria-label="Role" className={inputClass(errors.role) + " cursor-pointer appearance-none pr-10"} value={role}
                      style={{
                        color: role ? "rgb(15,23,42)" : "rgba(100,116,139,0.6)",
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23647587' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 14px center",
                      }}
                      onChange={(e) => { setRole(e.target.value); setUniversity(""); clearError("role"); }}>
                      <option value="" disabled>Select your role</option>
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                    {errors.role && <p className={errorClass}>{errors.role}</p>}
                  </div>
                  {role === "Student" && (
                    <div className="form-field-enter delay-100">
                      <label className={labelClass}>University</label>
                      <CollegeAutocomplete className={inputClass(errors.university)} placeholder="Your university or institution" value={university} maxLength={120}
                        onChange={(v) => { setUniversity(v); clearError("university"); }} onBlur={handleUniversityBlur} />
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
                    <textarea className={inputClass(errors.message) + " resize-none h-24"} placeholder="What's on your mind?" value={message} maxLength={2000}
                      onChange={(e) => { setMessage(e.target.value); clearError("message"); }} />
                    <div className="flex justify-between items-center mt-1">
                      {errors.message ? <p className={errorClass}>{errors.message}</p> : <span />}
                      <span className={`text-xs ${message.length >= 2000 ? "text-red-400" : message.length > 1600 ? "text-amber-400" : "text-[#64748b]"}`}>{message.length} / 2000</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
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
                    <textarea className={inputClass(errors.teamMessage) + " resize-none h-24"} placeholder="What's on your mind?" value={teamMessage} maxLength={2000}
                      onChange={(e) => { setTeamMessage(e.target.value); clearError("teamMessage"); }} />
                    <div className="flex justify-between items-center mt-1">
                      {errors.teamMessage ? <p className={errorClass}>{errors.teamMessage}</p> : <span />}
                      <span className={`text-xs ${teamMessage.length >= 2000 ? "text-red-400" : teamMessage.length > 1600 ? "text-amber-400" : "text-[#64748b]"}`}>{teamMessage.length} / 2000</span>
                    </div>
                  </div>
                </div>
              )}
              </MorphSwitch>

              <Turnstile
                ref={turnstileRef}
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                onSuccess={(token) => { setCaptchaToken(token); clearError("captcha"); }}
                onExpire={() => setCaptchaToken(null)}
                options={{ theme: "light" }}
              />
              {errors.captcha && <p className={errorClass}>{errors.captcha}</p>}

              {status === "error" && (
                <p className={errorClass}>{errorMessage}</p>
              )}

              <button
                type="submit"
                disabled={status === "loading" || !captchaToken || !allFieldsFilled}
                className="cursor-pointer w-full rounded-md py-2.5 bg-[#3b82f6] text-white font-mono text-xs uppercase tracking-widest hover:bg-[#2563eb] transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
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
