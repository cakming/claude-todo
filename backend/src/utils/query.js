// Helpers for building list queries with optional text search and status
// filtering, shared by the epic/feature/task list endpoints.

// Escape user input before using it in a RegExp so search terms can't break the
// query or inject expensive patterns.
export function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Merge optional `search` (case-insensitive match on title/desc) and `status`
// (exact match) filters into a base Mongo query. Unknown/empty values are
// ignored, so callers can pass raw req.query through.
export function applyListFilters(baseQuery, { search, status } = {}) {
  const query = { ...baseQuery };

  if (typeof search === 'string' && search.trim()) {
    const rx = new RegExp(escapeRegex(search.trim()), 'i');
    query.$or = [{ title: rx }, { desc: rx }];
  }

  if (typeof status === 'string' && status.trim()) {
    query.status = status.trim();
  }

  return query;
}
