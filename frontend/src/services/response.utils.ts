import { PaginatedResponse } from '../types';

export function unwrapList<T>(payload: T[] | PaginatedResponse<T>): T[] {
  return Array.isArray(payload) ? payload : payload.data;
}

export function normalizePaginated<T>(
  payload: T[] | PaginatedResponse<T>,
  page = 1,
  limit = Array.isArray(payload) ? payload.length : payload.meta.limit,
): PaginatedResponse<T> {
  if (!Array.isArray(payload)) {
    return payload;
  }

  const total = payload.length;

  return {
    data: payload,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / Math.max(limit, 1)), 1),
      hasNextPage: false,
      hasPreviousPage: page > 1,
    },
  };
}
