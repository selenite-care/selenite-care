function joinClassNames(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={joinClassNames(
        "animate-pulse rounded bg-[#EADDCD] dark:bg-[#3D3530]",
        className,
      )}
    />
  );
}

export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  const widths = ["w-full", "w-4/5", "w-3/5"];

  return (
    <div className={joinClassNames("space-y-3", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={joinClassNames("h-3", widths[index % widths.length])}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={joinClassNames(
        "rounded-lg border border-[#EADDCD] bg-card p-6 dark:border-[#3D3530]",
        className,
      )}
    >
      <Skeleton className="h-5 w-2/5" />
      <SkeletonText lines={3} className="mt-5" />
    </div>
  );
}

export function SkeletonTable({
  rows = 5,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#EADDCD] bg-card dark:border-[#3D3530]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left">
          <thead>
            <tr className="border-b border-[#EADDCD] dark:border-[#3D3530]">
              {Array.from({ length: cols }).map((_, index) => (
                <th key={index} className="px-4 py-3">
                  <Skeleton className="h-3 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-[#EADDCD]/70 last:border-b-0 dark:border-[#3D3530]"
              >
                {Array.from({ length: cols }).map((_, colIndex) => (
                  <td key={colIndex} className="px-4 py-4">
                    <Skeleton
                      className={joinClassNames(
                        "h-4",
                        colIndex % 3 === 0
                          ? "w-28"
                          : colIndex % 3 === 1
                            ? "w-20"
                            : "w-24",
                      )}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="rounded-2xl border border-[#EADDCD] bg-card p-6 shadow-sm dark:border-[#3D3530]">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-4 h-9 w-16" />
    </div>
  );
}
