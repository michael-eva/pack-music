export type PlaybackHoursRow = { week: string; source: "listener" | "business"; seconds: number };

// Reporting weeks begin Monday at 00:00 in Perth (UTC+8, no daylight saving).
export function playbackWeek(time: number): string {
  const date = new Date(time + 8 * 60 * 60 * 1000);
  date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
  return date.toISOString().slice(0, 10);
}

export function splitPlaybackSeconds(start: number, end: number): { week: string; seconds: number }[] {
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return [];
  const rows: { week: string; seconds: number }[] = [];
  let cursor = start;
  while (cursor < end) {
    const week = playbackWeek(cursor);
    const boundary = Date.parse(`${week}T00:00:00+08:00`) + 7 * 86400000;
    const stop = Math.min(end, boundary);
    rows.push({ week, seconds: (stop - cursor) / 1000 });
    cursor = stop;
  }
  return rows;
}

export function mergePlaybackRows(rows: PlaybackHoursRow[], addition: PlaybackHoursRow): PlaybackHoursRow[] {
  if (!Number.isFinite(addition.seconds) || addition.seconds <= 0) return rows;
  const found = rows.some(row => row.week === addition.week && row.source === addition.source);
  return (found ? rows.map(row => row.week === addition.week && row.source === addition.source ? { ...row, seconds: row.seconds + addition.seconds } : row) : [...rows, addition]).sort((a, b) => b.week.localeCompare(a.week)).slice(0, 104);
}