import { SkeletonCard, SkeletonTable } from "@/components/ui/Skeleton";

export default function DashboardOrderDetailsLoading() {
  return (
    <section className="min-h-screen bg-[#F8F5F0] px-6 py-10 dark:bg-[#1A1814]">
      <div className="max-w-xl">
        <div className="h-4 w-40 animate-pulse rounded bg-[#D8C7B5] dark:bg-[#3D3530]" />
        <div className="mt-4 h-9 w-56 animate-pulse rounded bg-[#D8C7B5] dark:bg-[#3D3530]" />
        <div className="mt-3 h-4 w-72 animate-pulse rounded bg-[#D8C7B5] dark:bg-[#3D3530]" />
      </div>

      <div className="mt-8">
        <SkeletonCard />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <SkeletonTable rows={4} cols={5} />
        <SkeletonCard />
      </div>
    </section>
  );
}
