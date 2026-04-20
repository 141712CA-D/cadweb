import Link from "next/link";
import DevBanner from "../components/DevBanner";
import Header from "../components/Header";

const processingSteps = [
  {
    label: "NLM Processor",
    desc: "Reads your input — whether it's a drawing or plain text — and figures out what you're actually trying to build",
  },
  {
    label: "Interpreter",
    desc: "Breaks that down into real geometry. Holes, profiles, extrusions — the stuff CAD actually needs",
  },
  {
    label: "Reasoning Engine",
    desc: "Fills in the gaps. Resolves what's implied, catches what doesn't add up, and makes sure the design holds together",
  },
  {
    label: "Execution Layer",
    desc: "Drives the agent pipeline start to finish — sketch, extrude, fillet, edit — until the part is done",
  },
];

export default function OverviewPage() {
  return (
    <div className="relative min-h-screen bg-black flex flex-col overflow-hidden">

      <div className="grid-bg fixed inset-0 pointer-events-none" />

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="orb-1 absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)", filter: "blur(40px)" }}
        />
        <div
          className="orb-2 absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(14,165,233,0.10) 0%, transparent 70%)", filter: "blur(40px)" }}
        />
      </div>

      <DevBanner />
      <Header />

      <main className="relative z-10 flex-1 flex flex-col items-center px-4 sm:px-6 pt-36 pb-24">

        {/* Heading */}
        <div className="text-center mb-16 sm:mb-24">
          <p className="text-xs text-white/30 tracking-widest uppercase font-mono mb-4">How it works</p>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight">
            <span className="gradient-text">The Vision</span>
            <br />
            <span className="text-white/90">for CADen.</span>
          </h1>
          <p className="mt-6 text-white/35 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Type what you need or hand us a drawing. CADen handles the rest.
          </p>
        </div>

        {/* Flow tree */}
        <div className="w-full max-w-3xl flex flex-col items-center">

          {/* ── Inputs ── */}
          <div className="w-full grid grid-cols-2 gap-4 sm:gap-6">

            {/* ASME Drawing Input */}
            <div
              className="flex flex-col items-center text-center gap-3 sm:gap-4 rounded-2xl border border-blue-500/20 p-4 sm:p-6"
              style={{ background: "linear-gradient(145deg, rgba(37,99,235,0.08) 0%, rgba(0,0,0,0.6) 100%)", backdropFilter: "blur(12px)" }}
            >
              <div
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border border-blue-500/30 flex-shrink-0"
                style={{ background: "rgba(37,99,235,0.12)" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-white/80 leading-tight">ASME Drawing</p>
                <p className="hidden sm:block text-xs text-white/30 mt-1 leading-relaxed">Drop in an ASME drawing and we pull every dimension out of it</p>
              </div>
            </div>

            {/* Direct Prompt Input */}
            <div
              className="flex flex-col items-center text-center gap-3 sm:gap-4 rounded-2xl border border-sky-500/20 p-4 sm:p-6"
              style={{ background: "linear-gradient(145deg, rgba(14,165,233,0.08) 0%, rgba(0,0,0,0.6) 100%)", backdropFilter: "blur(12px)" }}
            >
              <div
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border border-sky-500/30 flex-shrink-0"
                style={{ background: "rgba(14,165,233,0.12)" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-white/80 leading-tight">Direct Prompt</p>
                <p className="hidden sm:block text-xs text-white/30 mt-1 leading-relaxed">Just describe what you want. No CAD background required</p>
              </div>
            </div>

          </div>

          {/* ── Connector: two lines meeting ── */}
          <div className="relative w-full h-10 sm:h-14 flex-shrink-0 overflow-hidden">
            {/* Left line from input 1 */}
            <div className="absolute left-[25%] top-0 bottom-0 w-px"
              style={{ background: "linear-gradient(to bottom, rgba(37,99,235,0.4), rgba(37,99,235,0.2))" }} />
            {/* Right line from input 2 */}
            <div className="absolute right-[25%] top-0 bottom-0 w-px"
              style={{ background: "linear-gradient(to bottom, rgba(14,165,233,0.4), rgba(14,165,233,0.2))" }} />
            {/* Horizontal joining bar at bottom */}
            <div className="absolute bottom-0 left-[25%] right-[25%] h-px"
              style={{ background: "linear-gradient(to right, rgba(37,99,235,0.3), rgba(14,165,233,0.3))" }} />
          </div>

          {/* ── Processing Layer ── */}
          <div
            className="w-full rounded-2xl border border-blue-500/25 p-5 sm:p-8"
            style={{
              background: "linear-gradient(145deg, rgba(37,99,235,0.10) 0%, rgba(14,165,233,0.05) 100%)",
              backdropFilter: "blur(16px)",
              boxShadow: "0 0 60px rgba(37,99,235,0.12)",
            }}
          >
            <div className="text-center mb-5 sm:mb-6">
              <p className="text-[10px] text-blue-400/60 tracking-widest uppercase font-mono mb-1">Under the hood</p>
              <h2 className="text-base sm:text-xl font-bold text-white/90">The CADen Pipeline</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {processingSteps.map((step, i) => (
                <div
                  key={step.label}
                  className="flex items-start gap-3 rounded-xl p-3 sm:p-4 border border-white/6"
                  style={{ background: "rgba(255,255,255,0.02)" }}
                >
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-blue-300 flex-shrink-0 mt-0.5"
                    style={{ background: "rgba(37,99,235,0.2)", border: "1px solid rgba(37,99,235,0.3)" }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-white/80">{step.label}</p>
                    <p className="text-xs text-white/30 mt-0.5 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Connector: straight down ── */}
          <div className="relative flex flex-col items-center h-10 sm:h-14 flex-shrink-0">
            <div className="w-px flex-1"
              style={{ background: "linear-gradient(to bottom, rgba(37,99,235,0.3), rgba(14,165,233,0.3))" }} />
            {/* Arrowhead */}
            <svg className="w-4 h-3 -mt-px" viewBox="0 0 16 10" fill="none">
              <path d="M8 10L0 0h16L8 10z" fill="rgba(14,165,233,0.5)" />
            </svg>
          </div>

          {/* ── Output ── */}
          <div
            className="w-full sm:w-2/3 rounded-2xl border border-green-500/20 p-5 sm:p-7 flex flex-col items-center text-center gap-3"
            style={{
              background: "linear-gradient(145deg, rgba(34,197,94,0.07) 0%, rgba(0,0,0,0.7) 100%)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 0 40px rgba(34,197,94,0.08)",
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center border border-green-500/30"
              style={{ background: "rgba(34,197,94,0.12)" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] text-green-400/60 tracking-widest uppercase font-mono mb-1">Output</p>
              <p className="text-base sm:text-lg font-bold text-white/90">Your Model in Onshape</p>
              <p className="text-xs text-white/30 mt-1.5 leading-relaxed max-w-xs mx-auto">
                A real part lands in your Onshape document — features, constraints, geometry all there. Yours to tweak however you want.
              </p>
            </div>
          </div>

        </div>

        {/* ── Vision section ── */}
        <div className="w-full max-w-3xl flex flex-col items-center mt-24 sm:mt-32">

          <div className="text-center mb-12 sm:mb-16">
            <p className="text-xs text-white/30 tracking-widest uppercase font-mono mb-4">Where we&apos;re headed</p>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              <span className="gradient-text">Beyond Onshape.</span>
              <br />
              <span className="text-white/90">Every CAD tool, one platform.</span>
            </h2>
            <p className="mt-6 text-white/35 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
              CADen isn&apos;t just a prompt-to-model tool. It&apos;s the bridge between every major CAD environment.
            </p>
          </div>

          {/* Translation card */}
          <div
            className="w-full rounded-2xl border border-blue-500/20 p-6 sm:p-8 mb-4"
            style={{
              background: "linear-gradient(145deg, rgba(37,99,235,0.09) 0%, rgba(0,0,0,0.65) 100%)",
              backdropFilter: "blur(16px)",
              boxShadow: "0 0 60px rgba(37,99,235,0.10)",
            }}
          >
            <div className="flex items-start gap-4 mb-5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center border border-blue-500/30 flex-shrink-0"
                style={{ background: "rgba(37,99,235,0.15)" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] text-blue-400/60 tracking-widest uppercase font-mono mb-1">Cross-Platform</p>
                <h3 className="text-base sm:text-lg font-bold text-white/90">Universal CAD Translation</h3>
                <p className="text-xs sm:text-sm text-white/35 mt-1.5 leading-relaxed">
                  Working in SolidWorks? Fusion 360? CATIA? CADen reads your model and rebuilds it — natively — in any other environment. No manual re-modeling. No lost constraints.
                </p>
              </div>
            </div>

            {/* Translation flow diagram */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap mt-4">
              {["SolidWorks", "Fusion 360", "CATIA", "FreeCAD"].map((sw) => (
                <div
                  key={sw}
                  className="px-3 py-1.5 rounded-full text-xs font-medium text-white/60 border border-white/10"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                >
                  {sw}
                </div>
              ))}
              <div className="flex items-center gap-1 text-blue-400/60">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </div>
              <div
                className="px-3 py-1.5 rounded-full text-xs font-semibold text-blue-300 border border-blue-500/40"
                style={{ background: "rgba(37,99,235,0.15)" }}
              >
                Any target platform
              </div>
            </div>
          </div>

          {/* Onshape integration card */}
          <div
            className="w-full rounded-2xl border border-sky-500/20 p-6 sm:p-8"
            style={{
              background: "linear-gradient(145deg, rgba(14,165,233,0.09) 0%, rgba(0,0,0,0.65) 100%)",
              backdropFilter: "blur(16px)",
              boxShadow: "0 0 60px rgba(14,165,233,0.08)",
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center border border-sky-500/30 flex-shrink-0"
                style={{ background: "rgba(14,165,233,0.15)" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] text-sky-400/60 tracking-widest uppercase font-mono mb-1">Phase 1 — Coming Soon</p>
                <h3 className="text-base sm:text-lg font-bold text-white/90">Onshape Native Integration</h3>
                <p className="text-xs sm:text-sm text-white/35 mt-1.5 leading-relaxed">
                  Our first integration runs directly inside Onshape. Describe a part, drop in a drawing, and a multi-agent pipeline builds the full parametric model in your document — sketch, extrude, fillet, and all.
                </p>
                <p className="text-xs sm:text-sm text-white/35 mt-2 leading-relaxed">
                  Users coming from SolidWorks or any other tool can import their work into CADen and pick up right where they left off — in Onshape.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* ── CTA ── */}
        <div className="mt-14 flex flex-col items-center gap-4 text-center">
            <p className="text-white/25 text-sm">Want early access?</p>
            <Link
              href="/signup"
              className="glow-button px-8 py-3.5 rounded-full bg-gradient-to-r from-blue-600 to-sky-400 text-white text-sm font-semibold hover:opacity-90 transition-opacity duration-200"
            >
              Join the waitlist
            </Link>
          </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-black border-t border-white/5 py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/20">© 2026 Project CADen. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/contact" className="text-xs text-white/25 hover:text-white/60 transition-colors">Contact us</Link>
            <Link href="/signup" className="text-xs text-white/25 hover:text-white/60 transition-colors">Join waitlist</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
