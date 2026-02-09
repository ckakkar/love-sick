import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background gradient-mesh dashboard-bg">
      <div className="pointer-events-none fixed left-1/2 top-0 h-96 w-[600px] -translate-x-1/2 rounded-full bg-[#7c3aed]/12 blur-[100px]" />
      <div className="relative z-10 mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-8">
        <div className="mb-6 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-40 rounded-lg" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton
              key={i}
              className={
                i === 5 || i === 6 ? "min-h-[280px] rounded-xl lg:min-h-[320px]" : "min-h-[140px] rounded-xl"
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
