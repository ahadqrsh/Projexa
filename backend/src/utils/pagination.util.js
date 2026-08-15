/** Shared pagination parsing + meta building for every list endpoint. */

import { PAGINATION } from '../config/constants.js';

export const parsePagination = (query = {}) => {
  const page = Math.max(Number.parseInt(query.page, 10) || PAGINATION.DEFAULT_PAGE, 1);
  const requested = Number.parseInt(query.limit, 10) || PAGINATION.DEFAULT_LIMIT;
  const limit = Math.min(Math.max(requested, 1), PAGINATION.MAX_LIMIT);
  return { page, limit, skip: (page - 1) * limit };
};

/** "-createdAt,title" -> { createdAt: -1, title: 1 } */
export const parseSort = (sort = '-createdAt') =>
  String(sort)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .reduce((acc, field) => {
      if (field.startsWith('-')) acc[field.slice(1)] = -1;
      else acc[field] = 1;
      return acc;
    }, {});

/** "title,status" -> "title status" (Mongoose projection syntax) */
export const parseFields = (fields) =>
  fields
    ? String(fields)
        .split(',')
        .map((f) => f.trim())
        .filter((f) => f && !f.startsWith('-_id'))
        .join(' ')
    : null;

export const buildMeta = ({ page, limit, total }) => {
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};
