export default function LoginLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background gradient-mesh">
      <div className="pointer-events-none absolute -top-[30%] left-1/2 h-[65vmax] w-[65vmax] -translate-x-1/2 rounded-full bg-[#a78bfa]/10 blur-[140px]" />
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div
          className="h-11 w-11 animate-spin rounded-full border-2 border-violet-400/30 border-t-violet-400"
          aria-hidden
        />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </div>
  );
}
