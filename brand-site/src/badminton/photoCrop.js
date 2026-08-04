export function isValidPhotoCrop(crop) {
  if (!crop || typeof crop !== "object") return false;
  const x = Number(crop.x);
  const y = Number(crop.y);
  const width = Number(crop.width);
  const height = Number(crop.height);
  if (![x, y, width, height].every((n) => Number.isFinite(n))) {
    return false;
  }
  if (x < 0 || y < 0 || width <= 0 || height <= 0) return false;
  if (x > 1 || y > 1 || width > 1 || height > 1) return false;
  if (x + width > 1.0000001 || y + height > 1.0000001) return false;
  return true;
}

/** CSS for an absolutely positioned <img> inside overflow:hidden box to show crop region. */
export function photoCropImgStyle(crop) {
  if (!isValidPhotoCrop(crop)) return null;
  const x = Number(crop.x);
  const y = Number(crop.y);
  const width = Number(crop.width);
  const height = Number(crop.height);
  return {
    position: "absolute",
    width: `${100 / width}%`,
    height: `${100 / height}%`,
    maxWidth: "none",
    left: `${(-x / width) * 100}%`,
    top: `${(-y / height) * 100}%`,
    objectFit: "fill",
  };
}
