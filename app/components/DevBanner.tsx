export default function DevBanner() {
  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-8 flex items-center justify-center bg-[#C7E2FF] border-b border-blue-200">
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
        </span>
        <span className="text-xs text-slate-700 tracking-wide">
          This project is currently in development
        </span>
      </div>
    </div>
  );
}
