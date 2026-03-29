export default function DevBanner() {
  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-8 flex items-center justify-center bg-blue-950/80 backdrop-blur-sm border-b border-blue-500/20">
      <div className="flex items-center gap-2.5">
        {/* Pinging status dot */}
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400" />
        </span>
        <span className="text-xs text-white/60 tracking-wide">
          This project is currently in development
        </span>
      </div>
    </div>
  );
}
