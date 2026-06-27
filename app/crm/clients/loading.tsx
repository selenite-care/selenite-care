import { Skeleton, SkeletonTable } from "@/components/ui/Skeleton";

export default function CrmClientsLoading() {
  return (
    <section className="min-h-screen bg-zinc-50 px-6 py-10 dark:bg-black">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-8 rounded-3xl border border-black/10 bg-background p-8 shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="mt-3 h-4 w-full max-w-lg" />
        </div>

        <SkeletonTable rows={6} cols={6} />
      </div>
    </section>
  );
}
