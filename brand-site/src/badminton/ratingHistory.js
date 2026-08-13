/** Must match OpenAPI description / server SinglesRatingHistoryService.SAFETY_CAP. */
export const SINGLES_RATING_HISTORY_SAFETY_CAP = 200;

/** Must match OpenAPI description / server DoublesRatingHistoryService.SAFETY_CAP. */
export const DOUBLES_RATING_HISTORY_SAFETY_CAP = 200;

const SERIES_COLORS = [
  "#4F3DFF",
  "#E91E63",
  "#00897B",
  "#F57C00",
  "#5E35B1",
  "#039BE5",
  "#C0CA33",
  "#D81B60",
  "#6D4C41",
  "#00ACC1",
];

export function colorForSeriesKey(key) {
  const text = String(key || "");
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % SERIES_COLORS.length;
  return SERIES_COLORS[index];
}
