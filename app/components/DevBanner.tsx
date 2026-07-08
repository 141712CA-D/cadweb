export default function DevBanner() {
  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-8 flex items-center justify-center bg-[#0f0f0f] border-b border-[#262626]">
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
