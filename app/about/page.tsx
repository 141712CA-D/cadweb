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

        {/* Team cards */}
        <div className="w-full max-w-5xl flex flex-col gap-8 sm:gap-12">
          {team.map((member) => (
            <div
              key={member.name}
              className={`flex flex-col ${member.imagePosition === "left" ? "lg:flex-row" : "lg:flex-row-reverse"} items-center gap-8 rounded-2xl border border-white/8 p-6 sm:p-10`}
              style={{ background: "linear-gradient(145deg, rgba(37,99,235,0.05) 0%, rgba(0,0,0,0.6) 100%)", backdropFilter: "blur(12px)" }}
            >
              {/* Photo */}
              <div className="flex-shrink-0">
                <div
                  className="relative w-44 h-44 sm:w-64 sm:h-64 rounded-2xl overflow-hidden border border-blue-500/20"
                  style={{ boxShadow: "0 0 40px rgba(37,99,235,0.15)" }}
                >
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover object-top"
                  />
                </div>
              </div>

              {/* Text — always centered on mobile, left/right on desktop */}
              <div className={`flex flex-col gap-4 items-center text-center ${member.imagePosition === "left" ? "lg:items-start lg:text-left" : "lg:items-end lg:text-right"}`}>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">{member.name}</h2>
                  {/* Mobile: two lines */}
                  <div className="sm:hidden mt-1 font-mono">
                    <p className="text-xs text-blue-400/80">{member.major}</p>
                    <p className="text-xs text-white/30 mt-0.5">{member.university} &nbsp;·&nbsp; Class of {member.classOf}</p>
                  </div>
                  {/* Desktop: one line */}
                  <p className="hidden sm:block text-sm text-blue-400/80 mt-1 font-mono">
                    {member.major} &nbsp;·&nbsp; {member.university} &nbsp;·&nbsp; Class of {member.classOf}
                  </p>
                </div>
                <div className="w-12 h-px bg-gradient-to-r from-blue-500/40 to-sky-400/40" />
                <p className="text-sm text-white/40 leading-relaxed max-w-lg">
                  {member.bio}
                </p>
              </div>
            </div>
          ))}
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
