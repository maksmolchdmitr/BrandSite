/** Formats Elo for display: truncate fractional part after the decimal point. */
export function formatElo(elo) {
  if (elo == null || elo === "") {
    return null;
  }
  const value = Number(elo);
  if (!Number.isFinite(value)) {
    return String(elo);
  }
  return String(Math.trunc(value));
}
