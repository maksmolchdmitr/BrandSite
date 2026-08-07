/**
 * Порядок UUID как в PostgreSQL (unsigned bytes).
 * Для каноничных lowercase hex-строк с дефисами совпадает с lexicographic sort.
 * Не использовать Java UUID.compareTo / signed long compare на бэке.
 */
export function sortUuidsLikePostgres(ids) {
  if (!Array.isArray(ids) || ids.length < 2) {
    return ids;
  }
  return [...ids].sort((left, right) => String(left).localeCompare(String(right)));
}

export function orderMatchTeamsForApi(match) {
  if (!match || typeof match !== "object") {
    return match;
  }
  const next = { ...match };
  if (Array.isArray(next.teamA)) {
    next.teamA = sortUuidsLikePostgres(next.teamA);
  }
  if (Array.isArray(next.teamB)) {
    next.teamB = sortUuidsLikePostgres(next.teamB);
  }
  return next;
}
