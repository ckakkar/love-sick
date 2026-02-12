import { Skeleton } from "@/components/ui/skeleton";

export default function OnboardingLoading() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none fixed inset-0 gradient-mesh" />
      <div className="pointer-events-none absolute -top-[40%] left-1/2 h-[80vmax] w-[80vmax] -translate-x-1/2 rounded-full bg-[#a78bfa]/8 blur-[120px]" />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-[420px] space-y-6">
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-5 w-32 rounded-full" />
            <Skeleton className="h-4 w-56 rounded-full" />
          </div>
          <div className="mx-auto h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-muted/60">
            <div className="h-full w-1/5 rounded-full bg-muted" />
          </div>
          <div className="rounded-3xl border border-border/40 bg-card/60 p-6 shadow-2xl backdrop-blur-2xl sm:p-8 min-h-[320px] space-y-6">
            <div className="flex items-center gap-3">
              <Skeleton className="h-11 w-11 rounded-2xl shrink-0" />
              <div className="space-y-2 flex-1 min-w-0">
                <Skeleton className="h-6 w-3/4 rounded-lg" />
                <Skeleton className="h-4 w-full rounded-lg" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-12 w-full rounded-2xl" />
            </div>
            <div className="flex justify-end pt-4">
              <Skeleton className="h-10 w-28 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
