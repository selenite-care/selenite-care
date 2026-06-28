const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function getPaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(Number(searchParams.get("page") ?? DEFAULT_PAGE) || DEFAULT_PAGE, 1);
  const limit = Math.min(
    Math.max(Number(searchParams.get("limit") ?? DEFAULT_LIMIT) || DEFAULT_LIMIT, 1),
    MAX_LIMIT,
  );

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    take: limit,
  };
}

export function getPaginationMeta({
  page,
  limit,
  totalCount,
}: {
  page: number;
  limit: number;
  totalCount: number;
}) {
  return {
    page,
    pageSize: limit,
    limit,
    totalCount,
    totalPages: Math.max(Math.ceil(totalCount / limit), 1),
  };
}
