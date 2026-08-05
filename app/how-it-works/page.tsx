import Link from "next/link";
import DevBanner from "../components/DevBanner";
import Header from "../components/Header";
import Footer from "../components/Footer";

// Hidden page — no longer linked from the header, footer, or hero while the
// site focuses on Inter-CAD transfer. Kept intact (and reachable by direct URL)
// so it can be brought back later; noindex keeps it out of search results.
export const metadata = {
  robots: { index: false, follow: false },
};

const processingSteps = [
  {
    eyebrow: "Layer 01",
    label: "NLM Processor",
    status: "reading input",
    desc: "Reads your input — whether it's a drawing or plain text — and figures out what you're actually trying to build",
    accent: "bg-amber-400",
    border: "border-amber-300",
  },
  {
    eyebrow: "Layer 02",
    label: "Interpreter",
    status: "extracting geometry",
    desc: "Breaks that down into real geometry. Holes, profiles, extrusions — the stuff CAD actually needs",
    accent: "bg-sky-400",
    border: "border-sky-300",
  },
  {
    eyebrow: "Layer 03",
    label: "Reasoning Engine",
    status: "resolving intent",
    desc: "Fills in the gaps. Resolves what's implied, catches what doesn't add up, and makes sure the design holds together",
    accent: "bg-emerald-400",
    border: "border-emerald-300",
  },
  {
    eyebrow: "Layer 04",
    label: "Execution Layer",
    status: "running pipeline",
    desc: "Drives the agent pipeline start to finish — sketch, extrude, fillet, edit — until the part is done",
    accent: "bg-violet-400",
    border: "border-violet-300",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="relative min-h-screen bg-white flex flex-col overflow-hidden">

      <div className="grid-bg fixed inset-0 pointer-events-none z-0" />
      <DevBanner />
      <Header />

      <main className="relative z-10 flex-1 flex flex-col items-center px-4 sm:px-6 pt-36 pb-24">

        {/* Heading */}
        <div className="text-center mb-16 sm:mb-24">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#3b82f6] mb-4">How it works</p>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight">
            <span className="text-[#0f172a]">The Vision</span>
            <br />
            <span className="text-[#0f172a]">for Parametra.</span>
          </h1>
          <p className="mt-6 text-[#475569] text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Type what you need or drop in a drawing. We&apos;ll handle the CAD.
          </p>
        </div>

        {/* Flow tree */}
        <div className="w-full max-w-3xl flex flex-col items-center">

          {/* ── Inputs ── */}
          <div className="w-full grid grid-cols-2 gap-4 sm:gap-6">

            {/* ASME Drawing Input */}
            <div className="rounded-lg flex flex-col items-center text-center gap-3 sm:gap-4 border border-[#dbe6f5] bg-[#eef2f9] p-4 sm:p-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-md flex items-center justify-center border border-[#dbe6f5] bg-white flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6 text-[#3b82f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-[#0f172a] leading-tight">ASME Drawing</p>
                <p className="hidden sm:block font-mono text-xs text-[#64748b] mt-1 leading-relaxed">Drop in an ASME drawing and we pull every dimension out of it</p>
              </div>
            </div>

            {/* Direct Prompt Input */}
            <div className="rounded-lg flex flex-col items-center text-center gap-3 sm:gap-4 border border-[#dbe6f5] bg-[#eef2f9] p-4 sm:p-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-md flex items-center justify-center border border-[#dbe6f5] bg-white flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6 text-[#3b82f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-[#0f172a] leading-tight">Direct Prompt</p>
                <p className="hidden sm:block font-mono text-xs text-[#64748b] mt-1 leading-relaxed">Just describe what you want. No CAD background required</p>
              </div>
            </div>

          </div>

          {/* ── Connector ── */}
          <div className="relative w-full h-10 sm:h-14 flex-shrink-0 overflow-hidden">
            <div className="absolute left-[25%] top-0 bottom-0 w-px bg-[#dbe6f5]" />
            <div className="absolute right-[25%] top-0 bottom-0 w-px bg-[#dbe6f5]" />
            <div className="absolute bottom-0 left-[25%] right-[25%] h-px bg-[#dbe6f5]" />
          </div>

          {/* ── Processing Layer ── */}
          <div className="rounded-lg w-full border border-[#dbe6f5] bg-[#eef2f9] p-5 sm:p-8">
            <div className="text-center mb-5 sm:mb-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#3b82f6] mb-1">Under the hood</p>
              <h2 className="text-base sm:text-xl font-bold text-[#0f172a]">The Parametra Pipeline</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {processingSteps.map((step) => (
                <article key={step.label} className={`rounded-md overflow-hidden border bg-[#eef2f9] ${step.border}`}>
                  <div className="flex min-h-10 items-center justify-between gap-4 border-b border-[#dbe6f5] px-4 py-2">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 flex-shrink-0 rounded-full bg-red-500" />
                      <span className="h-2 w-2 flex-shrink-0 rounded-full bg-amber-500" />
                      <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[#3b82f6]" />
                    </div>
                    <p className="truncate font-mono text-[10px] text-[#64748b]">{step.status}</p>
                  </div>
                  <div className="p-4">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#64748b]">{step.eyebrow}</p>
                        <h3 className="mt-1 text-sm sm:text-base font-bold text-[#0f172a]">{step.label}</h3>
                      </div>
                      <span className={`mt-0.5 h-2.5 w-2.5 flex-shrink-0 ${step.accent}`} />
                    </div>
                    <p className="font-mono text-xs text-[#64748b] leading-relaxed">{step.desc}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* ── Connector: straight down ── */}
          <div className="relative flex flex-col items-center h-10 sm:h-14 flex-shrink-0">
            <div className="w-px flex-1 bg-[#dbe6f5]" />
            <svg className="w-4 h-3 -mt-px" viewBox="0 0 16 10" fill="none">
              <path d="M8 10L0 0h16L8 10z" fill="#dbe6f5" />
            </svg>
          </div>

          {/* ── Output ── */}
          <div className="rounded-lg w-full sm:w-2/3 border border-[#3b82f6]/30 bg-[#eef2f9] p-5 sm:p-7 flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-md flex items-center justify-center border border-[#3b82f6]/30 bg-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-[#3b82f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
              </svg>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#3b82f6] mb-1">Output</p>
              <p className="text-base sm:text-lg font-bold text-[#0f172a]">Your Model in Onshape</p>
              <p className="font-mono text-xs text-[#64748b] mt-1.5 leading-relaxed max-w-xs mx-auto">
                A real part lands in your Onshape document — features, constraints, geometry all there. Yours to tweak however you want.
              </p>
            </div>
          </div>

        </div>

        {/* ── Vision section ── */}
        <div className="w-full max-w-3xl flex flex-col items-center mt-24 sm:mt-32">

          <div className="text-center mb-12 sm:mb-16">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#3b82f6] mb-4">Where we&apos;re headed</p>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              <span className="text-[#0f172a]">Beyond Onshape.</span>
              <br />
              <span className="text-[#0f172a]">Every CAD tool, one platform.</span>
            </h2>
            <p className="mt-6 text-[#475569] text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
              Prompt-to-model is just the start. Parametra connects every major CAD environment in one place.
            </p>
          </div>

          {/* Translation card */}
          <div className="rounded-lg w-full border border-[#dbe6f5] bg-[#eef2f9] p-6 sm:p-8 mb-4">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-md flex items-center justify-center border border-[#dbe6f5] bg-white flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[#3b82f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#3b82f6] mb-1">Cross-Platform</p>
                <h3 className="text-base sm:text-lg font-bold text-[#0f172a]">Universal CAD Translation</h3>
                <p className="font-mono text-xs text-[#64748b] mt-1.5 leading-relaxed">
                  Working in SolidWorks? Fusion 360? CATIA? Parametra reads your model and rebuilds it — natively — in any other environment. No manual re-modeling. No lost constraints.
                </p>
              </div>
            </div>

            {/* Translation flow diagram */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap mt-4">
              {["SolidWorks", "Fusion 360", "CATIA", "FreeCAD"].map((sw) => (
                <div
                  key={sw}
                  className="rounded-md px-3 py-1.5 font-mono text-xs text-[#64748b] border border-[#dbe6f5] bg-white"
                >
                  {sw}
                </div>
              ))}
              <div className="flex items-center gap-1 text-[#3b82f6]">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </div>
              <div className="rounded-md px-3 py-1.5 font-mono text-xs text-[#3b82f6] border border-[#3b82f6]/40 bg-white">
                Any target platform
              </div>
            </div>
          </div>

          {/* Onshape integration card */}
          <div className="rounded-lg w-full border border-[#dbe6f5] bg-[#eef2f9] p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-md flex items-center justify-center border border-[#dbe6f5] bg-white flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[#3b82f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#3b82f6] mb-1">Phase 1 — Coming Soon</p>
                <h3 className="text-base sm:text-lg font-bold text-[#0f172a]">Onshape Native Integration</h3>
                <p className="font-mono text-xs text-[#64748b] mt-1.5 leading-relaxed">
                  Our first integration runs directly inside Onshape. Describe a part, drop in a drawing, and a multi-agent pipeline builds the full parametric model in your document — sketch, extrude, fillet, and all.
                </p>
                <p className="font-mono text-xs text-[#64748b] mt-2 leading-relaxed">
                  Already working in SolidWorks or another tool? Import your model into Parametra and continue in Onshape — no rebuilding required.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* ── CTA ── */}
        <div className="mt-14 flex flex-col items-center gap-4 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#64748b]">Want early access?</p>
          <Link
            href="/signup"
            className="rounded-md px-8 py-3.5 bg-[#3b82f6] font-mono text-xs uppercase tracking-widest text-white hover:bg-[#2563eb] transition-colors duration-200"
          >
            Join the Waitlist
          </Link>
        </div>

      </main>

      {/* Footer */}
      <Footer currentPage="how-it-works" />

    </div>
  );
}
