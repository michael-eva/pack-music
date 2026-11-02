/**
 * Pure helpers for the business player (VEN-2, VEN-4, PLY-5, PAY-1).
 * No browser or database access here, so they can be tested directly.
 */

export type QueueCandidate = {
  trackId: string;
  releaseState: string;
  explicit: boolean;
  takenDownAt: string | null;
  flaggedAt: string | null;
  hasAudio: boolean;
};

/** A track can reach a player only when its release is live and nothing has pulled it (RTS-4, RTS-6, CUR-7). */
export function isPlayable(track: QueueCandidate, explicitAllowed: boolean): boolean {
  if (track.releaseState !== "live") return false;
  if (track.takenDownAt || track.flaggedAt) return false;
  if (track.explicit && !explicitAllowed) return false;
  return track.hasAudio;
}

/** The position after `current` in a looping playlist of `length` tracks. */
export function nextIndex(current: number, length: number): number {
  if (length <= 0) return -1;
  if (current < 0) return 0;
  return (current + 1) % length;
}

/**
 * The next `count` tracks after the one that just played. If that track has
 * left the playlist (reassigned or taken down), start again from the top.
 */
export function upNext<T extends { trackId: string }>(
  queue: T[],
  currentTrackId: string | null,
  count: number,
): T[] {
  if (!queue.length) return [];
  const at = currentTrackId ? queue.findIndex((t) => t.trackId === currentTrackId) : -1;
  const out: T[] = [];
  let i = at;
  for (let n = 0; n < Math.min(count, queue.length); n++) {
    i = nextIndex(i, queue.length);
    out.push(queue[i]!);
  }
  return out;
}

export type PlayEvent = {
  id: string;
  siteId: string;
  trackId: string;
  playlistVersionId: string | null;
  startedAt: string;
  secondsPlayed: number;
};

/** Adds events to the offline queue without duplicating any id. */
export function mergeEvents(queue: PlayEvent[], incoming: PlayEvent[]): PlayEvent[] {
  const seen = new Set(queue.map((e) => e.id));
  const out = [...queue];
  for (const event of incoming) {
    if (seen.has(event.id)) continue;
    seen.add(event.id);
    out.push(event);
  }
  return out;
}

/** Removes the events the server has confirmed. */
export function dropSent(queue: PlayEvent[], sentIds: string[]): PlayEvent[] {
  const sent = new Set(sentIds);
  return queue.filter((e) => !sent.has(e.id));
}

/** Reads a stored queue defensively: corrupt storage never stops the music. */
export function parseQueue(raw: string | null): PlayEvent[] {
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter(
      (e): e is PlayEvent =>
        e &&
        typeof e.id === "string" &&
        typeof e.trackId === "string" &&
        typeof e.siteId === "string" &&
        typeof e.startedAt === "string" &&
        Number.isFinite(e.secondsPlayed),
    );
  } catch {
    return [];
  }
}

/**
 * Counts seconds actually listened, from timeupdate ticks. A jump of more
 * than two seconds (a seek or a stall resuming) adds nothing.
 */
export function addListened(total: number, previousTime: number, currentTime: number): number {
  const delta = currentTime - previousTime;
  if (delta <= 0 || delta > 2) return total;
  return total + delta;
}
