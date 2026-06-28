"use client";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
};

function getPageItems(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, "ellipsis-end", totalPages] as const;
  }

  if (currentPage >= totalPages - 2) {
    return [1, "ellipsis-start", totalPages - 3, totalPages - 2, totalPages - 1, totalPages] as const;
  }

  return [
    1,
    "ellipsis-start",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "ellipsis-end",
    totalPages,
  ] as const;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: PaginationProps) {
  if (totalItems <= 0 || totalPages <= 0) {
    return null;
  }

  const normalizedCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startItem = (normalizedCurrentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(normalizedCurrentPage * itemsPerPage, totalItems);
  const pageItems = getPageItems(normalizedCurrentPage, totalPages);

  function handlePageChange(page: number) {
    if (page < 1 || page > totalPages || page === normalizedCurrentPage) {
      return;
    }

    onPageChange(page);
  }

  return (
    <nav
      className="flex flex-col gap-4 rounded-lg border border-[#D8C7B5] bg-white px-4 py-4 dark:border-[#3D3530] dark:bg-[#242220] sm:flex-row sm:items-center sm:justify-between"
      aria-label="Pagination"
    >
      <p className="text-center text-sm text-[#8C7967] dark:text-[#8A7D75] sm:text-left">
        Showing {startItem}-{endItem} of {totalItems} results
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
        <button
          type="button"
          onClick={() => handlePageChange(normalizedCurrentPage - 1)}
          disabled={normalizedCurrentPage === 1}
          className="inline-flex h-10 items-center justify-center rounded-md border border-[#D8C7B5] bg-[#D8C7B5] px-3 text-sm font-medium text-[#2B2B2B] transition-colors hover:bg-[#CDB9A5] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#3D3530] dark:bg-[#3D3530] dark:text-[#F0EDE8] dark:hover:bg-[#4A4038]"
        >
          Previous
        </button>

        {pageItems.map((item) =>
          typeof item === "string" ? (
            <span
              key={item}
              className="inline-flex h-10 min-w-10 items-center justify-center px-1 text-sm font-medium text-[#8C7967] dark:text-[#8A7D75]"
            >
              ...
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => handlePageChange(item)}
              aria-current={item === normalizedCurrentPage ? "page" : undefined}
              className={`inline-flex h-10 min-w-10 items-center justify-center rounded-md px-3 text-sm font-semibold transition-colors ${
                item === normalizedCurrentPage
                  ? "bg-[#2B2B2B] text-[#F8F5F0] dark:bg-[#C6A56B] dark:text-[#141210]"
                  : "border border-[#D8C7B5] bg-[#D8C7B5] text-[#2B2B2B] hover:bg-[#CDB9A5] dark:border-[#3D3530] dark:bg-[#3D3530] dark:text-[#F0EDE8] dark:hover:bg-[#4A4038]"
              }`}
            >
              {item}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => handlePageChange(normalizedCurrentPage + 1)}
          disabled={normalizedCurrentPage === totalPages}
          className="inline-flex h-10 items-center justify-center rounded-md border border-[#D8C7B5] bg-[#D8C7B5] px-3 text-sm font-medium text-[#2B2B2B] transition-colors hover:bg-[#CDB9A5] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#3D3530] dark:bg-[#3D3530] dark:text-[#F0EDE8] dark:hover:bg-[#4A4038]"
        >
          Next
        </button>
      </div>
    </nav>
  );
}
