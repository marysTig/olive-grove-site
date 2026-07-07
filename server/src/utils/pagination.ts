export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

/**
 * Parses pagination parameters from query strings with safe defaults.
 */
export const parsePagination = (
  query: Record<string, unknown>
): PaginationParams => {
  let page = Number(query.page) || DEFAULT_PAGE;
  let limit = Number(query.limit) || DEFAULT_LIMIT;

  // Clamp values
  page = Math.max(1, page);
  limit = Math.min(Math.max(1, limit), MAX_LIMIT);

  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Builds a pagination result object from a total document count.
 */
export const buildPaginationResult = (
  page: number,
  limit: number,
  total: number
): PaginationResult => {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};
