/**
 * The Pack payments engine (scope section 8, PAY-1 to PAY-10).
 *
 * Pure functions, no I/O. Money is integer cents. Every division uses the
 * largest-remainder method, so allocations always add up to what was divided:
 * the ledger never creates or loses a cent.
 */

export type EngineSettings = {
  artistShareBp: number; // 7000 = 70%
  playThresholdSeconds: number; // a play qualifies at this many seconds
};

export type SiteInput = { siteId: string; feeCents: number };
export type PlayInput = { siteId: string; trackId: string; secondsPlayed: number };
export type SplitShare = { personId: string; shareBp: number };
export type TrackInput = { splits: SplitShare[] | null; held: boolean };

export type Pot = {
  siteId: string;
  feeCents: number;
  artistPoolCents: number;
  packCents: number;
  qualifiedPlays: number;
};

export type Entry = {
  type: "accrual" | "hold";
  siteId: string;
  trackId: string;
  personId: string;
  cents: number;
  plays: number; // qualified plays of this track at this site
  potPlays: number; // qualified plays of all tracks at this site
  shareBp: number;
};

export type Exception =
  | { kind: "no_plays"; siteId: string; cents: number }
  | { kind: "no_split"; siteId: string; trackId: string; cents: number }
  | { kind: "held"; siteId: string; trackId: string; cents: number };

export type MonthResult = {
  pots: Pot[];
  entries: Entry[];
  exceptions: Exception[];
  reconciliation: {
    artistPoolCents: number;
    accruedCents: number;
    heldCents: number;
    unallocatedCents: number;
    differenceCents: number;
  };
};

/**
 * Splits `total` cents across `weights` in proportion. Each share is rounded
 * down, then the leftover cents go one each to the shares with the largest
 * remainder (ties go to the earlier share). The result always sums to `total`.
 */
export function largestRemainder(total: number, weights: number[]): number[] {
  assertCents(total);
  const sum = weights.reduce((a, w) => a + w, 0);
  if (weights.some((w) => !Number.isInteger(w) || w < 0)) {
    throw new Error("weights must be non-negative integers");
  }
  if (sum === 0) return weights.map(() => 0);

  const big = BigInt(total);
  const bigSum = BigInt(sum);
  const parts = weights.map((w, index) => {
    const exact = big * BigInt(w);
    return { index, floor: Number(exact / bigSum), remainder: exact % bigSum };
  });

  let leftover = total - parts.reduce((a, p) => a + p.floor, 0);
  const byRemainder = [...parts].sort((a, b) =>
    a.remainder === b.remainder ? a.index - b.index : a.remainder > b.remainder ? -1 : 1,
  );
  for (const part of byRemainder) {
    if (leftover === 0) break;
    if (weights[part.index] === 0) continue;
    part.floor += 1;
    leftover -= 1;
  }
  return parts.map((p) => p.floor);
}

/** A site's monthly fee becomes its own pot. The artist share is rounded down
 *  and the leftover cent goes to The Pack (PAY-2): $49.99 gives $34.99 / $15.00. */
export function splitFee(feeCents: number, artistShareBp: number) {
  assertCents(feeCents);
  const artistPoolCents = Number((BigInt(feeCents) * BigInt(artistShareBp)) / 10000n);
  return { artistPoolCents, packCents: feeCents - artistPoolCents };
}

export function computeMonth(input: {
  sites: SiteInput[];
  plays: PlayInput[];
  tracks: Map<string, TrackInput>;
  settings: EngineSettings;
}): MonthResult {
  const { settings } = input;
  const pots: Pot[] = [];
  const entries: Entry[] = [];
  const exceptions: Exception[] = [];

  for (const site of input.sites) {
    const { artistPoolCents, packCents } = splitFee(site.feeCents, settings.artistShareBp);

    // Qualified plays per track at this site only (user-centric, never pooled).
    const playsByTrack = new Map<string, number>();
    for (const play of input.plays) {
      if (play.siteId !== site.siteId) continue;
      if (play.secondsPlayed < settings.playThresholdSeconds) continue;
      playsByTrack.set(play.trackId, (playsByTrack.get(play.trackId) ?? 0) + 1);
    }
    const trackIds = [...playsByTrack.keys()].sort();
    const counts = trackIds.map((id) => playsByTrack.get(id)!);
    const potPlays = counts.reduce((a, c) => a + c, 0);

    pots.push({ siteId: site.siteId, feeCents: site.feeCents, artistPoolCents, packCents, qualifiedPlays: potPlays });

    if (potPlays === 0) {
      if (artistPoolCents > 0) exceptions.push({ kind: "no_plays", siteId: site.siteId, cents: artistPoolCents });
      continue;
    }

    const trackCents = largestRemainder(artistPoolCents, counts);
    trackIds.forEach((trackId, i) => {
      const cents = trackCents[i]!;
      const plays = counts[i]!;
      const track = input.tracks.get(trackId);
      const splits = track?.splits;
      if (!splits || splits.length === 0 || splits.reduce((a, s) => a + s.shareBp, 0) !== 10000) {
        exceptions.push({ kind: "no_split", siteId: site.siteId, trackId, cents });
        return;
      }
      const type = track.held ? "hold" : "accrual";
      if (track.held) exceptions.push({ kind: "held", siteId: site.siteId, trackId, cents });
      const personCents = largestRemainder(cents, splits.map((s) => s.shareBp));
      splits.forEach((split, j) => {
        entries.push({
          type,
          siteId: site.siteId,
          trackId,
          personId: split.personId,
          cents: personCents[j]!,
          plays,
          potPlays,
          shareBp: split.shareBp,
        });
      });
    });
  }

  const artistPoolCents = pots.reduce((a, p) => a + p.artistPoolCents, 0);
  const accruedCents = sum(entries.filter((e) => e.type === "accrual").map((e) => e.cents));
  const heldCents = sum(entries.filter((e) => e.type === "hold").map((e) => e.cents));
  const unallocatedCents = sum(exceptions.filter((e) => e.kind !== "held").map((e) => e.cents));

  return {
    pots,
    entries,
    exceptions,
    reconciliation: {
      artistPoolCents,
      accruedCents,
      heldCents,
      unallocatedCents,
      differenceCents: artistPoolCents - accruedCents - heldCents - unallocatedCents,
    },
  };
}

function sum(values: number[]) {
  return values.reduce((a, v) => a + v, 0);
}

function assertCents(value: number) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`not a whole number of cents: ${value}`);
}

export function formatCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}$${Math.floor(abs / 100).toLocaleString("en-AU")}.${String(abs % 100).padStart(2, "0")}`;
}
