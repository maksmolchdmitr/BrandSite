export function normalizeClipOrigin(clip) {
  const start = Math.min(...clip.tracks.map((track) => track.times[0]));
  const adjusted = new Set();
  if (start > 0 && Number.isFinite(start)) {
    for (const track of clip.tracks) {
      if (adjusted.has(track.times)) continue;
      for (let i = 0; i < track.times.length; i++) track.times[i] -= start;
      adjusted.add(track.times);
    }
  }
  clip.resetDuration();
}
