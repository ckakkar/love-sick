import { Skeleton } from "@/components/ui/skeleton";

export default function OnboardingLoading() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background gradient-mesh">
      <div className="pointer-events-none absolute -top-[30%] left-1/2 h-[65vmax] w-[65vmax] -translate-x-1/2 rounded-full bg-[#a78bfa]/10 blur-[140px]" />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6 rounded-3xl border border-border/60 bg-card/80 p-6 shadow-xl backdrop-blur-xl sm:p-8">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full rounded-2xl" />
            <Skeleton className="h-10 w-full rounded-2xl" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-10 w-24 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
