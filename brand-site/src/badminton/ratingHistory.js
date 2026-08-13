/** Must match OpenAPI description / server SinglesRatingHistoryService.SAFETY_CAP. */
export const SINGLES_RATING_HISTORY_SAFETY_CAP = 200;

/** Must match OpenAPI description / server DoublesRatingHistoryService.SAFETY_CAP. */
export const DOUBLES_RATING_HISTORY_SAFETY_CAP = 200;

const DAY_MS = 24 * 60 * 60 * 1000;

const UNIT_DAYS = Object.freeze({
  d: 1,
  w: 7,
  m: 30,
  y: 365,
});

export const RATING_HISTORY_PERIOD_PRESETS = Object.freeze([
  { id: "1d", ms: 1 * DAY_MS },
  { id: "1w", ms: 7 * DAY_MS },
  { id: "1m", ms: 30 * DAY_MS },
  { id: "1y", ms: 365 * DAY_MS },
]);

/**
 * Parses period tokens like `3m`, `2w`, `14d`, `1y` (optional spaces).
 * @returns {{ id: string, ms: number } | null}
 */
export function parseRatingHistoryPeriod(raw) {
  const text = String(raw || "").trim().toLowerCase();
  const match = /^(\d+)\s*([dwmy])$/.exec(text);
  if (!match) return null;
  const amount = Number(match[1]);
  if (!Number.isInteger(amount) || amount < 1 || amount > 999) return null;
  const unit = match[2];
  const days = UNIT_DAYS[unit];
  if (!days) return null;
  return {
    id: `${amount}${unit}`,
    ms: amount * days * DAY_MS,
  };
}

export function ratingHistoryPeriodMs(periodId, fallbackMs = 30 * DAY_MS) {
  return parseRatingHistoryPeriod(periodId)?.ms ?? fallbackMs;
}

/**
 * Share of the requested window that lies at/after the earliest returned point.
 * Meaningful when the safety-cap keeps the newest points (left edge of the chart is cut).
 * @returns {number | null} integer 1..100, or null if not computable
 */
export function ratingHistoryShownPeriodPercent(points, startTime, endTime) {
  const startMs = Date.parse(startTime);
  const endMs = endTime == null || endTime === ""
    ? Date.now()
    : Date.parse(endTime);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    return null;
  }
  let firstMs = Infinity;
  for (const point of points || []) {
    const t = Date.parse(point?.createdAt);
    if (Number.isFinite(t) && t < firstMs) firstMs = t;
  }
  if (!Number.isFinite(firstMs)) return null;
  const clampedFirst = Math.min(Math.max(firstMs, startMs), endMs);
  const percent = Math.round((100 * (endMs - clampedFirst)) / (endMs - startMs));
  return Math.min(100, Math.max(1, percent));
}

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
