export const MIN_SPEED = 0;
export const MAX_SPEED = 3;
export const DETENT = Math.PI / 18;

export function clampSpeed(value) {
  return Math.max(MIN_SPEED, Math.min(MAX_SPEED, Number.isFinite(value) ? value : 1));
}

export function wrappedAngleDelta(current, previous) {
  return Math.atan2(Math.sin(current - previous), Math.cos(current - previous));
}

export function pointerDialDelta(previous, current, center, mode) {
  const radius = (point) => Math.hypot(point.x - center.x, point.y - center.y);
  if (mode === 'angular' && radius(previous) >= 8 && radius(current) >= 8) {
    return wrappedAngleDelta(
      Math.atan2(current.y - center.y, current.x - center.x),
      Math.atan2(previous.y - center.y, previous.x - center.x),
    );
  }
  return ((current.x - previous.x) - (current.y - previous.y) * 0.5) * 0.012;
}

export function speedAfterTurn(speed, clockwiseAngle) {
  return clampSpeed(speed + clockwiseAngle * 1.5 / Math.PI);
}
