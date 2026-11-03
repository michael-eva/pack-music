/**
 * Pure queue logic for the listener player. `order` holds indexes into the
 * track list, so shuffling never loses the original order.
 */

export type Repeat = "off" | "all" | "one";

export type QueueState = {
  length: number;
  order: number[];
  pos: number; // position within `order`
  repeat: Repeat;
};

export function identityOrder(length: number): number[] {
  return Array.from({ length }, (_, i) => i);
}

/**
 * The next position, or null when the queue has run out.
 * `auto` is true when a track ended by itself: repeat-one replays it, while a
 * tap on Next always moves on.
 */
export function nextPos(state: QueueState, auto: boolean): number | null {
  if (state.length === 0) return null;
  if (auto && state.repeat === "one") return state.pos;
  if (state.pos + 1 < state.order.length) return state.pos + 1;
  return state.repeat === "off" ? null : 0;
}

/** Previous restarts the current track when it's more than 3 seconds in. */
export function prevPos(state: QueueState, currentTime: number): number {
  if (currentTime > 3 || state.length === 0) return state.pos;
  if (state.pos > 0) return state.pos - 1;
  return state.repeat === "all" ? state.order.length - 1 : 0;
}

/** Shuffles every track except the current one, which moves to the front. */
export function shuffledOrder(length: number, current: number, random = Math.random): number[] {
  const rest = identityOrder(length).filter((i) => i !== current);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [rest[i], rest[j]] = [rest[j]!, rest[i]!];
  }
  return length ? [current, ...rest] : [];
}

export function cycleRepeat(repeat: Repeat): Repeat {
  return repeat === "off" ? "all" : repeat === "all" ? "one" : "off";
}

/** Signed links last three hours; refresh a little before that. */
export const SOURCE_MAX_AGE_MS = 2 * 60 * 60 * 1000;

export function isStale(fetchedAt: number, now = Date.now()): boolean {
  return now - fetchedAt > SOURCE_MAX_AGE_MS;
}
