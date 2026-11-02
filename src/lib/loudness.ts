/**
 * Loudness levelling at playback (PLY-2, PLY-3). Masters are never touched:
 * the player applies `target - measured` dB, plus the site's trim. A boost is
 * capped by the track's true-peak headroom so it never clips.
 */
export function playbackGainDb(input: {
  targetLufs: number;
  trackLufs: number | null;
  truePeakDb: number | null;
  trimDb?: number;
  ceilingDb?: number; // highest allowed true peak after gain
}): number {
  const trim = input.trimDb ?? 0;
  if (input.trackLufs == null) return trim;
  let gain = input.targetLufs - input.trackLufs;
  if (gain > 0 && input.truePeakDb != null) {
    const headroom = (input.ceilingDb ?? -1) - input.truePeakDb;
    gain = Math.min(gain, Math.max(0, headroom));
  }
  return round1(gain + trim);
}

export function dbToLinear(db: number): number {
  return Math.pow(10, db / 20);
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}
