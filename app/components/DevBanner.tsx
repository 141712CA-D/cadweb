"use client";

import { useEffect, useState } from "react";

export default function DevBanner() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let obs: IntersectionObserver;
    const attach = () => {
      const demo = document.getElementById("live-demo");
      if (!demo) { setTimeout(attach, 100); return; }
      obs = new IntersectionObserver(
        ([e]) => setHidden(e.isIntersecting),
        { threshold: 0.1 }
      );
      obs.observe(demo);
    };
    attach();
    return () => obs?.disconnect();
  }, []);

  return (
    <div className={`fixed top-0 left-0 right-0 z-[60] h-8 flex items-center justify-center bg-[#0f0f0f] border-b border-[#262626] transition-all duration-300 ${hidden ? "-translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100"}`}>
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff41] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff41]" />
        </span>
        <span className="font-mono text-xs text-[#888] tracking-widest uppercase">
          In development
        </span>
      </div>
    </div>
  );
}
