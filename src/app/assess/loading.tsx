import { Skeleton } from "@/components/ui/skeleton";

export default function AssessLoading() {
  return (
    <div className="min-h-screen bg-background gradient-mesh">
      <div className="pointer-events-none absolute left-1/2 top-20 h-64 w-[500px] -translate-x-1/2 rounded-full bg-[#8b5cf6]/15 blur-[80px]" />
      <div className="relative mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-16">
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-xl">
          <div className="space-y-2 border-b border-border/40 p-6">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="space-y-6 p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-full" />
            ))}
            <div className="flex justify-end gap-3 pt-4">
              <Skeleton className="h-10 w-20 rounded-xl" />
              <Skeleton className="h-10 w-32 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
