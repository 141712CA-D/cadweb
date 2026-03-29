import Image from "next/image";
import Link from "next/link";
import DevBanner from "../components/DevBanner";
import Header from "../components/Header";

const team = [
  {
    name: "Andrew Yang",
    image: "/AndyHeadshot.png",
    imagePosition: "left" as const,
    major: "Mechanical Engineering",
    university: "University of Michigan",
    classOf: "2029",
    bio: "Andrew is a CAD enthusiast from New York with a passion for turning ideas into real, engineered designs. A robotics warrior at heart, he competed at the FIRST Worlds Robotics Competition in high school — where precision design and fast iteration weren't optional. That drive is exactly what he's bringing to Project CADen.",
  },
  {
    name: "Sandeep Sawhney",
    image: "/SandeepHeashot.jpg",
    imagePosition: "right" as const,
    major: "Computer Engineering",
    university: "University of Michigan",
    classOf: "2029",
    bio: "Sandeep is a builder from New York at the intersection of AI/ML and hardware, with a deep focus on embedded systems applications. Before Michigan, he was deep in academic research — working in Biomedical Engineering and earning a finalist spot at the Regeneron Science Talent Search, one of the most prestigious science competitions in the country. He brings that same research-driven rigor to building the intelligence behind Project CADen.",
  },
];

export default function AboutPage() {
  return (
    <div className="relative min-h-screen bg-black flex flex-col overflow-hidden">

      {/* Background grid */}
      <div className="grid-bg fixed inset-0 pointer-events-none" />

      {/* Ambient orbs */}
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

      {/* Page content */}
      <main className="relative z-10 flex-1 flex flex-col items-center px-4 sm:px-6 pt-36 pb-20">

        {/* Heading */}
        <div className="text-center mb-14 sm:mb-20">
          <p className="text-xs text-white/30 tracking-widest uppercase font-mono mb-4">The team</p>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight">
            <span className="gradient-text">Meet the brains</span>
            <br />
            <span className="text-white/90">behind Project CADen.</span>
          </h1>
        </div>

        {/* Team cards + side bracket */}
        <div className="w-full max-w-6xl flex flex-row items-stretch">

          {/* Side bracket annotation — left side, pointing right toward cards */}
          <div className="hidden xl:flex items-stretch pr-4 select-none pointer-events-none">
            <div className="relative flex items-center w-4">
              {/* Vertical line on the left edge */}
              <div className="absolute left-0 top-8 bottom-8 w-px bg-white/[0.1]" />
              {/* Top tick pointing right */}
              <div className="absolute left-0 top-8 w-3 h-px bg-white/[0.1]" />
              {/* Bottom tick pointing right */}
              <div className="absolute left-0 bottom-8 w-3 h-px bg-white/[0.1]" />
              {/* Midpoint label — text sits between line and cards */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <div className="w-4 h-px bg-white/[0.1]" />
                <span className="text-[10px] text-white/20 font-mono italic whitespace-nowrap -rotate-1">
                  they were freshman year roommates btw
                </span>
              </div>
            </div>
          </div>

          {/* Cards column */}
          <div className="flex-1 flex flex-col gap-8 sm:gap-12 min-w-0">

          {/* Andy's card */}
          {[team[0]].map((member) => (
            <div
              key={member.name}
              className={`flex flex-col lg:flex-row items-center gap-8 rounded-2xl border border-white/8 p-6 sm:p-10`}
              style={{ background: "linear-gradient(145deg, rgba(37,99,235,0.05) 0%, rgba(0,0,0,0.6) 100%)", backdropFilter: "blur(12px)" }}
            >
              <div className="flex-shrink-0">
                <div className="relative w-44 h-44 sm:w-64 sm:h-64 rounded-2xl overflow-hidden border border-blue-500/20" style={{ boxShadow: "0 0 40px rgba(37,99,235,0.15)" }}>
                  <Image src={member.image} alt={member.name} fill className="object-cover object-top" />
                </div>
              </div>
              <div className="flex flex-col gap-4 items-center text-center lg:items-start lg:text-left">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">{member.name}</h2>
                  <div className="sm:hidden mt-1 font-mono">
                    <p className="text-xs text-blue-400/80">{member.major}</p>
                    <p className="text-xs text-white/30 mt-0.5">{member.university} &nbsp;·&nbsp; Class of {member.classOf}</p>
                  </div>
                  <p className="hidden sm:block text-sm text-blue-400/80 mt-1 font-mono">
                    {member.major} &nbsp;·&nbsp; {member.university} &nbsp;·&nbsp; Class of {member.classOf}
                  </p>
                </div>
                <div className="w-12 h-px bg-gradient-to-r from-blue-500/40 to-sky-400/40" />
                <p className="text-sm text-white/40 leading-relaxed max-w-lg">{member.bio}</p>
              </div>
            </div>
          ))}


          {/* Sandeep's card */}
          {[team[1]].map((member) => (
            <div
              key={member.name}
              className={`flex flex-col lg:flex-row-reverse items-center gap-8 rounded-2xl border border-white/8 p-6 sm:p-10`}
              style={{ background: "linear-gradient(145deg, rgba(37,99,235,0.05) 0%, rgba(0,0,0,0.6) 100%)", backdropFilter: "blur(12px)" }}
            >
              <div className="flex-shrink-0">
                <div className="relative w-44 h-44 sm:w-64 sm:h-64 rounded-2xl overflow-hidden border border-blue-500/20" style={{ boxShadow: "0 0 40px rgba(37,99,235,0.15)" }}>
                  <Image src={member.image} alt={member.name} fill className="object-cover object-top" />
                </div>
              </div>
              <div className="flex flex-col gap-4 items-center text-center lg:items-end lg:text-right">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">{member.name}</h2>
                  <div className="sm:hidden mt-1 font-mono">
                    <p className="text-xs text-blue-400/80">{member.major}</p>
                    <p className="text-xs text-white/30 mt-0.5">{member.university} &nbsp;·&nbsp; Class of {member.classOf}</p>
                  </div>
                  <p className="hidden sm:block text-sm text-blue-400/80 mt-1 font-mono">
                    {member.major} &nbsp;·&nbsp; {member.university} &nbsp;·&nbsp; Class of {member.classOf}
                  </p>
                </div>
                <div className="w-12 h-px bg-gradient-to-r from-blue-500/40 to-sky-400/40" />
                <p className="text-sm text-white/40 leading-relaxed max-w-lg">{member.bio}</p>
              </div>
            </div>
          ))}

          </div>{/* end cards column */}


        </div>{/* end outer flex row */}

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
