import Link from "next/link";

const particles = [
  { top: "15%", left: "8%",  size: 3, duration: "9s",  delay: "0s"   },
  { top: "25%", left: "18%", size: 2, duration: "12s", delay: "1.5s" },
  { top: "60%", left: "5%",  size: 4, duration: "7s",  delay: "3s"   },
  { top: "75%", left: "15%", size: 2, duration: "11s", delay: "0.5s" },
  { top: "10%", left: "82%", size: 3, duration: "10s", delay: "2s"   },
  { top: "30%", left: "90%", size: 2, duration: "8s",  delay: "4s"   },
  { top: "65%", left: "88%", size: 4, duration: "13s", delay: "1s"   },
  { top: "80%", left: "78%", size: 2, duration: "9s",  delay: "2.5s" },
  { top: "45%", left: "3%",  size: 2, duration: "14s", delay: "0s"   },
  { top: "50%", left: "95%", size: 3, duration: "11s", delay: "3.5s" },
];

export default function Hero() {
  return (
    <section className="relative flex flex-col items-center justify-center min-h-screen px-6 pt-24 overflow-hidden bg-black">

      {/* ── Background grid ── */}
      <div className="grid-bg absolute inset-0 pointer-events-none" />

      {/* ── Ambient glow orbs ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="orb-1 absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(37,99,235,0.22) 0%, transparent 70%)", filter: "blur(40px)" }}
        />
        <div
          className="orb-2 absolute -top-20 -right-40 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(14,165,233,0.16) 0%, transparent 70%)", filter: "blur(40px)" }}
        />
        <div
          className="orb-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(29,78,216,0.1) 0%, transparent 65%)", filter: "blur(60px)" }}
        />
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(37,99,235,0.12) 0%, transparent 70%)", filter: "blur(50px)" }}
        />
      </div>

      {/* ── Floating particles ── */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((p, i) => (
          <div
            key={i}
            className="particle absolute rounded-full"
            style={{
              top: p.top,
              left: p.left,
              width: p.size,
              height: p.size,
              background: i % 2 === 0 ? "rgba(59,130,246,0.8)" : "rgba(14,165,233,0.8)",
              boxShadow: i % 2 === 0 ? "0 0 6px rgba(59,130,246,0.9)" : "0 0 6px rgba(14,165,233,0.9)",
              "--duration": p.duration,
              "--delay": p.delay,
            } as React.CSSProperties}
          />
        ))}
      </div>


      {/* ── Main content ── */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl">

        {/* Badge */}
        <div className="animate-fade-up delay-100 mb-8 inline-flex items-center gap-2 rounded-full border border-blue-500/30 badge-shimmer px-4 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400"></span>
          </span>
          <span className="text-xs text-white/70 font-medium tracking-widest uppercase">
            Something big is coming
          </span>
        </div>

        {/* Headline */}
        <h1 className="animate-fade-up delay-200 text-6xl sm:text-7xl md:text-8xl font-bold tracking-tight leading-none">
          <span className="gradient-text">Think anything.</span>
          <br />
          <span className="text-white/90">
            <span className="sm:hidden">Let AI<br />build it.</span>
            <span className="hidden sm:inline">Let AI build it.</span>
          </span>
        </h1>

        {/* Subheadline */}
        <p className="animate-fade-up delay-400 mt-8 max-w-xl text-lg sm:text-xl text-white/40 leading-relaxed">
          Project CADen is the one stop AI agent for CAD design.
          <br />
          One prompt, endless designs.
        </p>

        {/* CTA */}
        <div className="animate-fade-up delay-600 mt-10">
          <Link
            href="/signup"
            className="glow-button relative px-10 py-4 rounded-full bg-gradient-to-r from-blue-600 to-sky-400 text-white text-sm font-semibold hover:opacity-90 transition-opacity duration-200"
          >
            Join the waitlist
          </Link>
        </div>

        {/* Disclaimer */}
        <p className="animate-fade-up delay-800 mt-6 text-xs text-white/20 tracking-wide">
          Built for engineers &nbsp;·&nbsp; Launching soon
        </p>

        {/* Divider */}
        <div className="animate-fade-in delay-800 mt-16 w-full flex items-center gap-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-blue-500/20" />
          <span className="text-xs text-white/15 tracking-widest uppercase font-mono">A glimpse</span>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-blue-500/20" />
        </div>

        {/* Product preview window */}
        <div
          className="animate-fade-in delay-1000 mt-10 w-full rounded-2xl overflow-hidden border border-blue-500/15"
          style={{ background: "linear-gradient(145deg, rgba(37,99,235,0.07) 0%, rgba(14,165,233,0.04) 100%)" }}
        >
          <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-blue-500/10 bg-blue-500/[0.03]">
            <span className="flex-shrink-0 w-3 h-3 rounded-full bg-red-500/60" />
            <span className="flex-shrink-0 w-3 h-3 rounded-full bg-yellow-500/60" />
            <span className="flex-shrink-0 w-3 h-3 rounded-full bg-green-500/60" />
            <span className="ml-2 text-xs text-white/20 font-mono">
              <span className="hidden sm:inline">project-caden — multi-agent design session · sketch agent [1/4]</span>
              <span className="sm:hidden">project-caden · sketch agent [1/4]</span>
            </span>
          </div>
          <div className="p-4 sm:p-8 font-mono text-xs leading-relaxed overflow-x-auto">
            <div className="flex flex-col gap-1 text-left w-full">

              <p className="text-white/30 mb-2">$ caden generate --prompt <span className="text-white/50">&quot;load-bearing bracket with 4 M6 mounting holes, 25mm center bore, chamfered corners, 6mm wall thickness&quot;</span> --plane Top</p>

              <p className="text-blue-400/70 mt-1">[agent] Parsing design intent...</p>
              <p className="text-white/20">&nbsp;&nbsp;↳ entities detected: rectangle, circle ×5, chamfer ×4</p>
              <p className="text-white/20">&nbsp;&nbsp;↳ constraints inferred: coincident, equal, symmetric, horizontal, vertical</p>
              <p className="text-white/20">&nbsp;&nbsp;↳ plane: Top &nbsp;|&nbsp; units: mm → m (Onshape internal)</p>

              <p className="text-blue-400/70 mt-2">[agent] Generating sketch entities...</p>
              <p className="text-sky-400/60">&nbsp;&nbsp;[tool: sketchPoint]&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;origin anchor → (0, 0)</p>
              <p className="text-sky-400/60">&nbsp;&nbsp;[tool: sketchRectangle]&nbsp;&nbsp;outer profile → 80mm × 60mm</p>
              <p className="text-sky-400/60">&nbsp;&nbsp;[tool: sketchFillet]&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;chamfer corners → r = 4mm ×4</p>
              <p className="text-sky-400/60">&nbsp;&nbsp;[tool: sketchCircle]&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;center bore → ⌀25mm @ (40, 30)</p>
              <p className="text-sky-400/60">&nbsp;&nbsp;[tool: sketchCircle ×4]&nbsp;&nbsp;M6 holes → ⌀6.35mm @ (10,10) (70,10) (10,50) (70,50)</p>

              <p className="text-blue-400/70 mt-2">[agent] Applying geometric constraints...</p>
              <p className="text-sky-400/60">&nbsp;&nbsp;[constraint: coincident]&nbsp;&nbsp;&nbsp;&nbsp;rectangle midpoint → origin</p>
              <p className="text-sky-400/60">&nbsp;&nbsp;[constraint: coincident]&nbsp;&nbsp;&nbsp;&nbsp;bore center → rectangle center</p>
              <p className="text-sky-400/60">&nbsp;&nbsp;[constraint: equal ×4]&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;M6 hole diameters unified</p>
              <p className="text-sky-400/60">&nbsp;&nbsp;[constraint: symmetric ×2]&nbsp;&nbsp;mounting pattern mirrored on X &amp; Y</p>
              <p className="text-sky-400/60">&nbsp;&nbsp;[constraint: horizontal]&nbsp;&nbsp;&nbsp;&nbsp;top &amp; bottom edges</p>
              <p className="text-sky-400/60">&nbsp;&nbsp;[constraint: vertical]&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;left &amp; right edges</p>

              <p className="text-blue-400/70 mt-2">[solver] Running DOF analysis...</p>
              <p className="text-white/20">&nbsp;&nbsp;↳ entities: 14 &nbsp;|&nbsp; raw DOF: 28 &nbsp;|&nbsp; constraints applied: 28 &nbsp;|&nbsp; net DOF: 0 ✓</p>
              <p className="text-blue-400/70 mt-1">[api] POST /api/v10/partstudios/d/…/features</p>
              <p className="text-white/20">&nbsp;&nbsp;↳ btType: BTMSketch-151 &nbsp;|&nbsp; wrapper: BTFeatureDefinitionCall-1406</p>

              <p className="text-green-400/80 mt-2">✓ Sketch created successfully in Onshape.</p>
              <p className="text-white/15 mt-1">Feature ID: Fz14FTGQASixn6X_0 &nbsp;·&nbsp; Entities: 14 &nbsp;·&nbsp; Constraints: 12 &nbsp;·&nbsp; Status: 200 OK</p>

              <div className="mt-4 border-t border-white/5 pt-4">
                <p className="text-white/15 mb-2">↓ handing off to next agents in pipeline...</p>
                <p className="text-blue-400/40">[extrusion agent]&nbsp;&nbsp;Extruding bracket profile → 6mm, blind</p>
                <p className="text-blue-400/40">[extrusion agent]&nbsp;&nbsp;Cutting M6 holes → through all</p>
                <p className="text-blue-400/40">[fillet agent]&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Applying edge fillets → r = 1mm, 8 edges</p>
                <p className="text-blue-400/40">[edit agent]&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Chamfering top face edges → 0.5mm ×4</p>
                <p className="text-green-400/40 mt-2">✓ Part complete &nbsp;·&nbsp; 4 features &nbsp;·&nbsp; ready for assembly</p>
              </div>

            </div>
          </div>
        </div>

        {/* Three pillars */}
        <div className="animate-fade-in delay-1200 mt-16 w-full grid grid-cols-1 sm:grid-cols-3 gap-px bg-blue-500/10 rounded-2xl overflow-hidden border border-blue-500/10">
          {[
            { label: "Describe it", body: "Plain English. No CAD expertise required. Tell it what you need." },
            { label: "Agents go to work", body: "A pipeline of specialized agents handles sketches, extrusions, cuts, fillets, and edits — each building on the last." },
            { label: "A complete model in Onshape", body: "Fully parameterized parts pushed directly to your document. Features, constraints, geometry — all done." },
          ].map((item) => (
            <div
              key={item.label}
              className="flex flex-col gap-3 p-8 bg-black/60"
            >
              <p className="text-sm font-semibold text-white/80">{item.label}</p>
              <p className="text-xs text-white/30 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>

        {/* Bottom CTA repeat */}
        <div className="animate-fade-in delay-1200 mt-16 mb-20 flex flex-col items-center gap-4">
          <p className="text-white/30 text-sm">Be the first to get access.</p>
          <Link
            href="/signup"
            className="glow-button px-10 py-4 rounded-full bg-gradient-to-r from-blue-600 to-sky-400 text-white text-sm font-semibold hover:opacity-90 transition-opacity duration-200"
          >
            Join the waitlist
          </Link>
        </div>

      </div>

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent, black)" }}
      />
    </section>
  );
}
