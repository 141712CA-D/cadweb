"use client";

import { useState, useRef, useEffect } from "react";
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
type Status =
  | "idle"
  | "loading"
  | "verify"
  | "success"
  | "welcome_back"
  | "duplicate"
  | "unsubscribing"
  | "unsubscribe_verify"
  | "unsubscribed"
  | "unsubscribe_rate_limited"
  | "rate_limited"
  | "error";
type EmailCheck = "idle" | "checking" | "available" | "registered" | "returning";

const INDIVIDUAL_ROLES = ["Student", "Instructor", "Freelancer", "Hobbyist"];

// Mirrors WaitlistRequest.ValidateBody() on the backend — the frontend's own
// maxLength/validate() should catch all of these before submit, but the
// backend is the source of truth (e.g. a bypassed client), so its rejection
// still needs to land on the right field instead of a generic error.
function mapWaitlistError(error: string | undefined, type: FormType): { field?: string; message: string } {
  switch (error) {
    case "Invalid captcha":
      return { field: "captcha", message: "Please complete the verification." };
    case "Name is too long":
      return { field: type === "individual" ? "indName" : "teamRep", message: "That name is too long." };
    case "Email is too long":
      return { field: type === "individual" ? "indEmail" : "teamEmail", message: "That email is too long." };
    case "University is too long":
      return { field: "indUniversity", message: "That school name is too long." };
    case "Reason is too long":
      return { field: "indReason", message: "Please shorten your answer." };
    case "University is required for students":
      return { field: "indUniversity", message: "Please enter where you attend." };
    case "University is required for instructors":
      return { field: "indUniversity", message: "Please enter where you teach." };
    case "Invalid role":
      return { field: "indRole", message: "Please select a valid role." };
    case "Invalid university":
      return { field: "indUniversity", message: "Please select a university from the list." };
    case "Organization is too long":
      return { field: "teamOrg", message: "That organization name is too long." };
    case "Usage is too long":
      return { field: "teamUsage", message: "Please shorten your answer." };
    default:
      return { message: "Something went wrong. Please try again." };
  }
}

function mapUnsubscribeError(status: number, error: string | undefined): string {
  if (error === "User not found on waitlist" || status === 404) {
    return "This email isn't on the waitlist, so there's nothing to remove.";
  }
  if (error === "Invalid or expired token" || error === "Token is required" || status === 400) {
    return "This unsubscribe link has expired. Request a fresh one and try again.";
  }
  if (status >= 500) {
    return "Something went wrong on our end. Please try again in a moment.";
  }
  return "That unsubscribe link could not be used right now.";
}

const inputClass = (error?: string) =>
  `w-full rounded-md bg-[#eef2f9] border ${error ? "border-red-500/60" : "border-[#dbe6f5]"} px-4 py-3 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#3b82f6] transition-all duration-150 font-mono`;

const labelClass = "block font-mono text-xs uppercase tracking-[0.2em] text-[#64748b] mb-1.5";
const errorClass = "font-mono text-xs text-red-500 mt-1";

function EmailCheckBadge({
  status,
  unsubscribeHref,
  onUnsubscribe,
}: {
  status: EmailCheck;
  unsubscribeHref?: string;
  onUnsubscribe?: (e: React.MouseEvent<HTMLElement>) => void;
}) {
  const baseClass = "inline-flex h-5 items-center justify-end gap-1 whitespace-nowrap shrink-0 font-mono text-[11px] normal-case tracking-normal transition-colors duration-150";

  if (status === "idle") {
    return <span className={`${baseClass} text-transparent`} aria-hidden="true">Can register</span>;
  }
  if (status === "checking") {
    return <span className={`${baseClass} text-[#64748b]`}>Checking...</span>;
  }
  if (status === "available" || status === "returning") {
    return <span className={`${baseClass} text-[#3b82f6]`}>Can register</span>;
  }
  if (status === "registered") {
    return (
      <span className={`${baseClass} text-red-500`}>
        <span>Already registered</span>
        {unsubscribeHref ? (
          <a
            href={unsubscribeHref}
            onClick={onUnsubscribe}
            className="underline decoration-current underline-offset-2 hover:text-[#3b82f6]"
          >
            Remove?
          </a>
        ) : null}
      </span>
    );
  }
  return <span className={`${baseClass} text-transparent`} aria-hidden="true">Can register</span>;
}

interface SignupFormProps {
  onSuccess?: () => void;
  isModal?: boolean;
}

export default function SignupForm({ onSuccess, isModal = false }: SignupFormProps) {
  const [type, setType] = useState<FormType>("individual");
  const [status, setStatus] = useState<Status>("idle");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState("Something went wrong. Please try again.");
  const turnstileRef = useRef<TurnstileInstance>(null);
  const [emailCheck, setEmailCheck] = useState<EmailCheck>("idle");
  const emailCannotRegister = emailCheck === "registered";
  const statusRef = useRef<Status>("idle");
  const [unsubscribeToken, setUnsubscribeToken] = useState<string | null>(null);
  const [unsubscribeEmail, setUnsubscribeEmail] = useState<string | null>(null);
  const [unsubscribeError, setUnsubscribeError] = useState("");
  const [showUnsubscribeConfirm, setShowUnsubscribeConfirm] = useState(false);
  const [unsubscribeCode, setUnsubscribeCode] = useState("");
  const [unsubscribeCodeError, setUnsubscribeCodeError] = useState("");
  const [unsubscribeVerifying, setUnsubscribeVerifying] = useState(false);

  const [code, setCode] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [verifying, setVerifying] = useState(false);
  const emailCheckRequestId = useRef(0);

  const [indName, setIndName] = useState("");
  const [indEmail, setIndEmail] = useState("");
  const [indRole, setIndRole] = useState("");
  const [indUniversity, setIndUniversity] = useState("");
  const [indReason, setIndReason] = useState("");

  const [teamRep, setTeamRep] = useState("");
  const [teamEmail, setTeamEmail] = useState("");
  const [teamOrg, setTeamOrg] = useState("");
  const [teamRole, setTeamRole] = useState("");
  const [teamUsage, setTeamUsage] = useState("");

  // Loaded once the university field is actually relevant (not on initial
  // mount) — validate()/allFieldsFilled use it to require an exact match
  // against a real listed school, same dataset CollegeAutocomplete suggests
  // from.
  const [universities, setUniversities] = useState<University[] | null>(null);
  const needsUniversity = indRole === "Student" || indRole === "Instructor";
  useEffect(() => {
    if (needsUniversity) loadUniversities().then(setUniversities);
  }, [needsUniversity]);
  const universityIsValid = !needsUniversity || (universities !== null && isKnownUniversity(indUniversity, universities));

  // Surfaces the "not a listed school" error as soon as the user leaves the
  // field, rather than only on submit — the disabled submit button alone
  // doesn't explain why.
  const handleUniversityBlur = () => {
    if (!indUniversity.trim()) return;
    if (universities === null) {
      setErrors((prev) => ({ ...prev, indUniversity: "Still loading schools — please try again in a moment." }));
    } else if (!isKnownUniversity(indUniversity, universities)) {
      setErrors((prev) => ({ ...prev, indUniversity: "Please select a university from the list." }));
    }
  };

  const allFieldsFilled =
    type === "individual"
      ? indName.trim() !== "" &&
        isValidEmail(indEmail) &&
        indRole !== "" &&
        universityIsValid &&
        indReason.trim() !== ""
      : teamRep.trim() !== "" &&
        isValidEmail(teamEmail) &&
        teamOrg.trim() !== "" &&
        teamRole.trim() !== "" &&
        teamUsage.trim() !== "";

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    const email = (type === "individual" ? indEmail : teamEmail).toLowerCase().trim();
    if (!email || !isValidEmail(email)) {
      setEmailCheck("idle");
      return;
    }
    setEmailCheck("checking");
    const currentRequestId = ++emailCheckRequestId.current;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(apiUrl(`/api/waitlist/check-cache?email=${encodeURIComponent(email)}`));
        if (currentRequestId !== emailCheckRequestId.current) return;
        if (res.status === 409) {
          const data = await res.json().catch(() => ({}));
          setEmailCheck("registered");
          setUnsubscribeToken(typeof data.token === "string" ? data.token : null);
          setUnsubscribeEmail(email);
          return;
        }
        if (!res.ok) {
          setEmailCheck("idle");
          return;
        }
        const data = await res.json();
        if (!data.canRegister) {
          setEmailCheck("registered");
          setUnsubscribeToken(typeof data.token === "string" ? data.token : null);
          setUnsubscribeEmail(email);
        } else if (data.status === "returning") {
          setEmailCheck("returning");
          setUnsubscribeToken(null);
        } else {
          setEmailCheck("available");
          if (
            statusRef.current !== "duplicate" &&
            statusRef.current !== "unsubscribing" &&
            statusRef.current !== "unsubscribe_verify" &&
            statusRef.current !== "unsubscribed"
          ) {
            setUnsubscribeToken(null);
          }
        }
      } catch {
        if (currentRequestId !== emailCheckRequestId.current) return;
        setEmailCheck("idle");
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [indEmail, teamEmail, type]);

  function clearError(field: string) {
    setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (type === "individual") {
      if (!indName.trim()) e.indName = "Name is required.";
      if (!indEmail.trim() || !isValidEmail(indEmail)) e.indEmail = "Please enter a valid email address.";
      if (!indRole) e.indRole = "Please select a role.";
      if (indRole === "Student" && !indUniversity.trim()) e.indUniversity = "Please enter where you attend.";
      else if (indRole === "Instructor" && !indUniversity.trim()) e.indUniversity = "Please enter where you teach.";
      else if (needsUniversity && universities === null) e.indUniversity = "Still loading schools — please try again in a moment.";
      else if (needsUniversity && !universityIsValid) e.indUniversity = "Please select a university from the list.";
      if (!indReason.trim()) e.indReason = "Please tell us why you want to use Parametra.";
    } else {
      if (!teamRep.trim()) e.teamRep = "Name is required.";
      if (!teamEmail.trim() || !isValidEmail(teamEmail)) e.teamEmail = "Please enter a valid email address.";
      if (!teamOrg.trim()) e.teamOrg = "Organization is required.";
      if (!teamRole.trim()) e.teamRole = "Role is required.";
      if (!teamUsage.trim()) e.teamUsage = "Please describe your intended usage.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    if (emailCannotRegister) {
      setErrors((prev) => ({
        ...prev,
        [type === "individual" ? "indEmail" : "teamEmail"]: "This email is already on the waitlist.",
      }));
      return;
    }
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
      const res = await fetch(apiUrl("/api/waitlist/request"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, captchaToken }),
      });
      if (res.status === 409) {
        const data = await res.json().catch(() => ({}));
        setUnsubscribeToken(typeof data.token === "string" ? data.token : null);
        setUnsubscribeEmail(type === "individual" ? indEmail : teamEmail);
        setUnsubscribeError("");
        setStatus("duplicate");
        return;
      }
      if (res.status === 429) {
        setStatus("rate_limited");
        turnstileRef.current?.reset();
        setCaptchaToken(null);
        return;
      }
      if (!res.ok) {
        turnstileRef.current?.reset();
        setCaptchaToken(null);
        const data = await res.json().catch(() => ({}));
        const mapped = mapWaitlistError(data.error, type);
        if (mapped.field) {
          setErrors((prev) => ({ ...prev, [mapped.field as string]: mapped.message }));
          setStatus("idle");
        } else {
          setErrorMessage(mapped.message);
          setStatus("error");
        }
        return;
      }
      setPendingEmail(type === "individual" ? indEmail : teamEmail);
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
      const res = await fetch(apiUrl("/api/waitlist/verify"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail, code: code.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        void consumeExpired("waitlist");
        setStatus(data.returning ? "welcome_back" : "success");
        return;
      }
      if (res.status === 409) { setStatus("duplicate"); return; }
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
    setUnsubscribeToken(null);
    setUnsubscribeEmail(null);
    setUnsubscribeError("");
    setUnsubscribeCode("");
    setUnsubscribeCodeError("");
    turnstileRef.current?.reset();
    setCaptchaToken(null);
  }

  // Backs out of the code-entry step to the "already registered" screen so
  // the user can request a fresh unsubscribe code without losing the token.
  function cancelUnsubscribeVerify() {
    setStatus("duplicate");
    setUnsubscribeCode("");
    setUnsubscribeCodeError("");
  }

  function reset() {
    setType("individual");
    setStatus("idle");
    setCaptchaToken(null);
    setErrors({});
    setErrorMessage("Something went wrong. Please try again.");
    setCode("");
    setVerifyError("");
    setUnsubscribeToken(null);
    setUnsubscribeEmail(null);
    setUnsubscribeError("");
    setUnsubscribeCode("");
    setUnsubscribeCodeError("");
    setPendingEmail("");
    setIndName("");
    setIndEmail("");
    setIndRole("");
    setIndUniversity("");
    setIndReason("");
    setTeamRep("");
    setTeamEmail("");
    setTeamOrg("");
    setTeamRole("");
    setTeamUsage("");
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

  const unsubscribeHref = unsubscribeToken
    ? apiUrl(`/api/waitlist/unsubscribe-request?token=${encodeURIComponent(unsubscribeToken)}`)
    : "";

  function requestUnsubscribe(e?: React.MouseEvent<HTMLElement>) {
    e?.preventDefault();
    if (!unsubscribeToken) return;
    setUnsubscribeError("");
    setShowUnsubscribeConfirm(true);
  }

  function cancelUnsubscribe() {
    setShowUnsubscribeConfirm(false);
  }

  // Step 1: exchange the JWT (captured from the check-cache/duplicate
  // response) for a 6-digit code sent to the user's email.
  async function confirmUnsubscribe() {
    if (!unsubscribeToken || status === "unsubscribing") return;

    setShowUnsubscribeConfirm(false);
    setUnsubscribeError("");
    setStatus("unsubscribing");

    try {
      const res = await fetch(apiUrl("/api/waitlist/unsubscribe-request"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: unsubscribeToken }),
      });
      if (res.status === 429) {
        setStatus("unsubscribe_rate_limited");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatus("duplicate");
        setUnsubscribeError(mapUnsubscribeError(res.status, data.error));
        return;
      }
      setUnsubscribeCode("");
      setUnsubscribeCodeError("");
      setStatus("unsubscribe_verify");
    } catch {
      setStatus("duplicate");
      setUnsubscribeError("Couldn't reach the server. Check your connection and try again.");
    }
  }

  // Step 2: complete the unsubscribe with the emailed code.
  async function submitUnsubscribeCode(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(unsubscribeCode.trim())) {
      setUnsubscribeCodeError("Enter the 6-digit code from your email.");
      return;
    }
    setUnsubscribeVerifying(true);
    setUnsubscribeCodeError("");
    try {
      const res = await fetch(apiUrl("/api/waitlist/unsubscribe"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: unsubscribeEmail, code: unsubscribeCode.trim() }),
      });
      if (res.ok) {
        void consumeExpired("waitlist");
        setStatus("unsubscribed");
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (res.status === 410 || data.error === "expired") {
        setUnsubscribeCodeError("That code expired. Start over to get a new one.");
      } else if (res.status === 429 || data.error === "too_many_attempts") {
        setUnsubscribeCodeError("Too many attempts. Start over to get a new code.");
      } else {
        setUnsubscribeCodeError("Incorrect code. Please try again.");
      }
    } catch {
      setUnsubscribeCodeError("Something went wrong. Please try again.");
    } finally {
      setUnsubscribeVerifying(false);
    }
  }

  return (
    <div className={isModal ? "" : "min-h-screen bg-[#f8fafc] grid-bg flex flex-col items-center justify-center px-4 py-12"}>
      <div className={isModal ? "w-full" : "w-full max-w-lg"}>

        {!isModal && (
          <div className="flex items-center justify-between mb-8">
            <Link href="/" className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="Parametra" style={{ width: 32, height: 32, display: "block", flexShrink: 0, filter: "brightness(0)" }} />
              <span className="text-[#0f172a] font-semibold text-base tracking-tight">Parametra</span>
            </Link>
            <Link href="/" className="font-mono text-xs text-[#64748b] hover:text-[#3b82f6] transition-colors">← Back</Link>
          </div>
        )}

        {status === "rate_limited" ? (
          <div className="flex flex-col items-center text-center py-8 gap-5">
            <div className="w-12 h-12 rounded-full border border-amber-500/30 bg-[#eef2f9] flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#0f172a]">Slow down.</h2>
              <p className="mt-2 font-mono text-sm text-[#475569] max-w-sm">
                Too many requests. You can try again in ~24 hours.
              </p>
            </div>
            <button onClick={startOver} className="mt-1 font-mono text-xs uppercase tracking-widest text-[#3b82f6] hover:text-[#2563eb] transition-colors">
              Done
            </button>
          </div>
        ) : status === "welcome_back" ? (
          <div className="flex flex-col items-center text-center py-8 gap-4">
            <div className="w-12 h-12 rounded-full border border-[#3b82f6]/40 bg-[#eef2f9] flex items-center justify-center">
              <svg className="w-6 h-6 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-[#0f172a]">Welcome back to the list.</h2>
            <p className="font-mono text-sm text-[#475569] max-w-sm">Good to see you again. You&apos;re back on the waitlist — we&apos;ll be in touch when access opens up.</p>
            <p className="font-mono text-xs text-[#64748b] max-w-sm">If this is your first time receiving an email from {process.env.NEXT_PUBLIC_MAIL_FROM_EMAIL ?? "no-reply@parametra.ai"}, please unmark us as spam if applicable.</p>
            <button onClick={handleSuccess} className="mt-4 font-mono text-xs uppercase tracking-widest text-[#3b82f6] hover:text-[#2563eb] transition-colors">
              Done
            </button>
          </div>
        ) : status === "duplicate" ? (
          <div className="flex flex-col items-center text-center py-8 gap-5">
            <div className="w-12 h-12 rounded-full border border-[#dbe6f5] bg-[#eef2f9] flex items-center justify-center">
              <svg className="w-6 h-6 text-[#475569]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#0f172a]">Already registered.</h2>
              <p className="mt-2 font-mono text-sm text-[#475569] max-w-sm">
                This email is already on the waitlist. We&apos;ll be in touch when access opens up.
              </p>
            </div>

            {unsubscribeError ? (
              <div className="w-full max-w-sm border border-red-500/30 bg-red-500/5 px-4 py-3 flex items-start gap-3 text-left">
                <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
                </svg>
                <div className="flex-1">
                  <p className="font-mono text-xs text-red-400">{unsubscribeError}</p>
                  {unsubscribeHref && (
                    <button
                      onClick={() => { setUnsubscribeError(""); setShowUnsubscribeConfirm(true); }}
                      className="mt-2 font-mono text-[11px] uppercase tracking-widest text-[#64748b] hover:text-[#0f172a] transition-colors"
                    >
                      Try again →
                    </button>
                  )}
                </div>
              </div>
            ) : unsubscribeHref ? (
              <button
                onClick={requestUnsubscribe}
                className="font-mono text-xs uppercase tracking-widest text-[#64748b] hover:text-red-400 border border-[#dbe6f5] hover:border-red-500/40 px-5 py-2 transition-colors"
              >
                Remove from waitlist
              </button>
            ) : null}

            <button onClick={handleSuccess} className="mt-1 font-mono text-xs uppercase tracking-widest text-[#3b82f6] hover:text-[#2563eb] transition-colors">
              Done
            </button>
          </div>
        ) : status === "unsubscribing" ? (
          <div className="flex flex-col items-center text-center py-8 gap-5">
            <div className="w-12 h-12 rounded-full border border-[#dbe6f5] bg-[#eef2f9] flex items-center justify-center">
              <svg className="w-5 h-5 text-[#64748b] animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#0f172a]">Sending code...</h2>
              <p className="mt-2 font-mono text-sm text-[#475569] max-w-sm">Just a moment.</p>
            </div>
          </div>
        ) : status === "unsubscribe_rate_limited" ? (
          <div className="flex flex-col items-center text-center py-8 gap-5">
            <div className="w-12 h-12 rounded-full border border-amber-500/30 bg-[#eef2f9] flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#0f172a]">Slow down.</h2>
              <p className="mt-2 font-mono text-sm text-[#475569] max-w-sm">
                You can remove yourself from the waitlist again in ~24 hours.
              </p>
            </div>
            <button onClick={handleSuccess} className="mt-1 font-mono text-xs uppercase tracking-widest text-[#3b82f6] hover:text-[#2563eb] transition-colors">
              Done
            </button>
          </div>
        ) : status === "unsubscribe_verify" ? (
          <div className="flex flex-col items-center text-center py-4 gap-4">
            <div className="w-12 h-12 rounded-full border border-[#dbe6f5] bg-[#eef2f9] flex items-center justify-center">
              <svg className="w-6 h-6 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-[#0f172a]">Check your email.</h2>
            <p className="font-mono text-sm text-[#475569] max-w-sm">We sent a 6-digit code to <span className="text-[#0f172a]">{unsubscribeEmail}</span>. Enter it below to confirm removal.</p>
            <form onSubmit={submitUnsubscribeCode} noValidate className="w-full max-w-xs flex flex-col gap-3 mt-2">
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                value={unsubscribeCode}
                onChange={(e) => { setUnsubscribeCode(e.target.value.replace(/\D/g, "")); setUnsubscribeCodeError(""); }}
                className={`w-full rounded-md bg-[#eef2f9] border ${unsubscribeCodeError ? "border-red-500/60" : "border-[#dbe6f5]"} px-4 py-3 text-center text-2xl tracking-[0.4em] font-mono text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#3b82f6] transition-all duration-150`}
              />
              {unsubscribeCodeError && <p className={errorClass}>{unsubscribeCodeError}</p>}
              <button
                type="submit"
                disabled={unsubscribeVerifying || unsubscribeCode.length !== 6}
                className="cursor-pointer w-full py-2.5 bg-[#3b82f6] font-mono text-xs uppercase tracking-widest text-white hover:bg-[#2563eb] transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {unsubscribeVerifying ? "Removing..." : "Confirm removal"}
              </button>
            </form>
            <button onClick={cancelUnsubscribeVerify} className="mt-2 font-mono text-xs text-[#64748b] hover:text-[#3b82f6] transition-colors">
              Didn&apos;t get it? Start over
            </button>
          </div>
        ) : status === "unsubscribed" ? (
          <div className="flex flex-col items-center text-center py-8 gap-4">
            <div className="w-12 h-12 rounded-full border border-[#3b82f6]/40 bg-[#eef2f9] flex items-center justify-center">
              <svg className="w-6 h-6 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-[#0f172a]">You&apos;re unsubscribed.</h2>
            <p className="font-mono text-sm text-[#475569] max-w-sm">You won&apos;t receive waitlist emails for this address anymore.</p>
            <button onClick={handleSuccess} className="mt-4 font-mono text-xs uppercase tracking-widest text-[#3b82f6] hover:text-[#2563eb] transition-colors">
              Done
            </button>
          </div>
        ) : status === "verify" ? (
          <div className="flex flex-col items-center text-center py-4 gap-4">
            <div className="w-12 h-12 rounded-full border border-[#dbe6f5] bg-[#eef2f9] flex items-center justify-center">
              <svg className="w-6 h-6 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-[#0f172a]">Check your email.</h2>
            <p className="font-mono text-sm text-[#475569] max-w-sm">We sent a 6-digit code to <span className="text-[#0f172a]">{pendingEmail}</span>. Enter it below to confirm.</p>
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
                className="cursor-pointer w-full py-2.5 bg-[#3b82f6] font-mono text-xs uppercase tracking-widest text-white hover:bg-[#2563eb] transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {verifying ? "Verifying..." : "Verify & join"}
              </button>
            </form>
            <button onClick={startOver} className="mt-2 font-mono text-xs text-[#64748b] hover:text-[#3b82f6] transition-colors">
              Didn&apos;t get it? Start over
            </button>
          </div>
        ) : status === "success" ? (
          <div className="flex flex-col items-center text-center py-8 gap-4">
            <div className="w-12 h-12 rounded-full border border-[#3b82f6]/40 bg-[#eef2f9] flex items-center justify-center">
              <svg className="w-6 h-6 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-[#0f172a]">You&apos;re on the list.</h2>
            <p className="font-mono text-sm text-[#475569] max-w-sm">We&apos;ll reach out when access opens up. You won&apos;t want to miss it.</p>
            <p className="font-mono text-xs text-[#64748b] max-w-sm">If this is your first time receiving an email from {process.env.NEXT_PUBLIC_MAIL_FROM_EMAIL ?? "no-reply@parametra.ai"}, please unmark us as spam if applicable.</p>
            <button onClick={handleSuccess} className="mt-4 font-mono text-xs uppercase tracking-widest text-[#3b82f6] hover:text-[#2563eb] transition-colors">
              Done
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Join the waitlist</h1>
            <p className="font-mono text-sm text-[#64748b] mb-6">Tell us who you are and we&apos;ll be in touch.</p>

            <div className="flex gap-0 mb-6 rounded-md border border-[#dbe6f5] overflow-hidden">
              {(["individual", "team"] as FormType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setType(t); setErrors({}); }}
                  className={`cursor-pointer flex-1 py-2 px-3 font-mono text-xs uppercase tracking-widest transition-all duration-150 ${
                    type === t
                      ? "bg-[#3b82f6] text-white"
                      : "text-[#64748b] hover:text-[#0f172a] bg-[#f8fafc]"
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
                    <label className={labelClass}>Name (First & Last)</label>
                    <input className={inputClass(errors.indName)} placeholder="Your full name" value={indName} maxLength={80}
                      onChange={(e) => { setIndName(e.target.value); clearError("indName"); }} />
                    {errors.indName && <p className={errorClass}>{errors.indName}</p>}
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <label className={labelClass}>Email</label>
                      <EmailCheckBadge
                        status={emailCheck}
                        unsubscribeHref={emailCheck === "registered" ? unsubscribeHref : undefined}
                        onUnsubscribe={requestUnsubscribe}
                      />
                    </div>
                    <input type="email" className={inputClass(errors.indEmail)} placeholder="you@example.com" value={indEmail} maxLength={255}
                      onChange={(e) => { setIndEmail(e.target.value); clearError("indEmail"); }} />
                    {errors.indEmail && <p className={errorClass}>{errors.indEmail}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Role</label>
                    <select aria-label="Role" className={inputClass(errors.indRole) + " cursor-pointer appearance-none pr-10"} value={indRole}
                      style={{
                        color: indRole ? "rgb(15,23,42)" : "rgb(148,163,184)",
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgb(100,116,139)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 12px center",
                      }}
                      onChange={(e) => { setIndRole(e.target.value); setIndUniversity(""); clearError("indRole"); }}>
                      <option value="" disabled style={{ background: "#eef2f9" }}>Select your role</option>
                      {INDIVIDUAL_ROLES.map((r) => <option key={r} value={r} style={{ background: "#eef2f9" }}>{r}</option>)}
                    </select>
                    {errors.indRole && <p className={errorClass}>{errors.indRole}</p>}
                  </div>
                  {indRole === "Student" && (
                    <div className="form-field-enter delay-100">
                      <label className={labelClass}>University / Institution / School</label>
                      <CollegeAutocomplete className={inputClass(errors.indUniversity)} placeholder="Where do you attend?" value={indUniversity} maxLength={120}
                        onChange={(v) => { setIndUniversity(v); clearError("indUniversity"); }} onBlur={handleUniversityBlur} />
                      {errors.indUniversity && <p className={errorClass}>{errors.indUniversity}</p>}
                    </div>
                  )}
                  {indRole === "Instructor" && (
                    <div className="form-field-enter delay-100">
                      <label className={labelClass}>University / Institution / School</label>
                      <CollegeAutocomplete className={inputClass(errors.indUniversity)} placeholder="Where do you teach?" value={indUniversity} maxLength={120}
                        onChange={(v) => { setIndUniversity(v); clearError("indUniversity"); }} onBlur={handleUniversityBlur} />
                      {errors.indUniversity && <p className={errorClass}>{errors.indUniversity}</p>}
                    </div>
                  )}
                  <div>
                    <label className={labelClass}>Why do you want to use Parametra?</label>
                    <textarea className={inputClass(errors.indReason) + " resize-none h-24"} placeholder="Tell us about your use case..." value={indReason} maxLength={1000}
                      onChange={(e) => { setIndReason(e.target.value); clearError("indReason"); }} />
                    <div className="flex justify-between items-center mt-1">
                      {errors.indReason ? <p className={errorClass}>{errors.indReason}</p> : <span />}
                      <span className={`font-mono text-xs ${indReason.length >= 1000 ? "text-red-500" : indReason.length > 800 ? "text-amber-500" : "text-[#94a3b8]"}`}>{indReason.length} / 1000</span>
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
                    <div className="flex items-center justify-between">
                      <label className={labelClass}>Email</label>
                      <EmailCheckBadge
                        status={emailCheck}
                        unsubscribeHref={emailCheck === "registered" ? unsubscribeHref : undefined}
                        onUnsubscribe={requestUnsubscribe}
                      />
                    </div>
                    <input type="email" className={inputClass(errors.teamEmail)} placeholder="you@company.com" value={teamEmail} maxLength={255}
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
                    <textarea className={inputClass(errors.teamUsage) + " resize-none h-24"} placeholder="How would your team use Parametra? What problems are you solving?" value={teamUsage} maxLength={1000}
                      onChange={(e) => { setTeamUsage(e.target.value); clearError("teamUsage"); }} />
                    <div className="flex justify-between items-center mt-1">
                      {errors.teamUsage ? <p className={errorClass}>{errors.teamUsage}</p> : <span />}
                      <span className={`font-mono text-xs ${teamUsage.length >= 1000 ? "text-red-500" : teamUsage.length > 800 ? "text-amber-500" : "text-[#94a3b8]"}`}>{teamUsage.length} / 1000</span>
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
                disabled={status === "loading" || !captchaToken || emailCannotRegister || !allFieldsFilled}
                className="cursor-pointer w-full py-2.5 bg-[#3b82f6] font-mono text-xs uppercase tracking-widest text-white hover:bg-[#2563eb] transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {status === "loading" ? "Sending..." : "Request access"}
              </button>
            </form>
          </>
        )}
        {showUnsubscribeConfirm && unsubscribeHref && (
          <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 px-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="unsubscribe-title"
          >
            <div className="w-full max-w-sm rounded-lg border border-[#dbe6f5] bg-[#eef2f9] p-6 shadow-2xl">
              <h3 id="unsubscribe-title" className="text-lg font-semibold text-[#0f172a]">
                Are you sure?
              </h3>
              <p className="mt-2 font-mono text-sm text-[#475569]">
                Are you sure you want to remove yourself from the waitlist?
              </p>
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={cancelUnsubscribe}
                  className="font-mono text-xs uppercase tracking-widest text-[#64748b] hover:text-[#0f172a] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmUnsubscribe}
                  className="font-mono text-xs uppercase tracking-widest text-[#3b82f6] hover:text-[#2563eb] transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
