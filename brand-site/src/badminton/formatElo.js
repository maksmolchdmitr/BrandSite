/** Formats Elo for display with two decimal places. */
export function formatElo(elo) {
  if (elo == null || elo === "") {
    return null;
  }
  const value = Number(elo);
  if (!Number.isFinite(value)) {
    return String(elo);
  }
  return value.toFixed(2);
}
