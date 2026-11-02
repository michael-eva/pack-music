import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeMonth,
  formatCents,
  largestRemainder,
  splitFee,
  type PlayInput,
  type TrackInput,
} from "./engine.ts";

const settings = { artistShareBp: 7000, playThresholdSeconds: 30 };

function plays(siteId: string, trackId: string, count: number, secondsPlayed = 200): PlayInput[] {
  return Array.from({ length: count }, () => ({ siteId, trackId, secondsPlayed }));
}

test("PAY-2: $49.99 gives $34.99 to artists and $15.00 to The Pack", () => {
  assert.deepEqual(splitFee(4999, 7000), { artistPoolCents: 3499, packCents: 1500 });
});

test("PAY-3: the worked example in section 8 matches to the cent", () => {
  const tracks = new Map<string, TrackInput>([
    [
      "a-night-bus",
      {
        splits: [
          { personId: "sam", shareBp: 6000 },
          { personId: "jo", shareBp: 4000 },
        ],
        held: false,
      },
    ],
    ["b-tide-tables", { splits: [{ personId: "sam", shareBp: 10000 }], held: false }],
    ["c-slow-water", { splits: [{ personId: "marlo", shareBp: 10000 }], held: false }],
  ]);
  const result = computeMonth({
    sites: [{ siteId: "cafe", feeCents: 4999 }],
    plays: [
      ...plays("cafe", "a-night-bus", 90),
      ...plays("cafe", "b-tide-tables", 70),
      ...plays("cafe", "c-slow-water", 40),
    ],
    tracks,
    settings,
  });

  const byTrack = (id: string) =>
    result.entries.filter((e) => e.trackId === id).reduce((a, e) => a + e.cents, 0);
  assert.equal(byTrack("a-night-bus"), 1574);
  assert.equal(byTrack("b-tide-tables"), 1225);
  assert.equal(byTrack("c-slow-water"), 700);

  const nightBus = result.entries.filter((e) => e.trackId === "a-night-bus");
  assert.equal(nightBus.find((e) => e.personId === "sam")!.cents, 944);
  assert.equal(nightBus.find((e) => e.personId === "jo")!.cents, 630);
  assert.equal(result.reconciliation.differenceCents, 0);
  assert.equal(formatCents(result.reconciliation.accruedCents), "$34.99");
});

test("PAY-1: a play under the threshold does not qualify", () => {
  const result = computeMonth({
    sites: [{ siteId: "cafe", feeCents: 4999 }],
    plays: [{ siteId: "cafe", trackId: "t", secondsPlayed: 20 }],
    tracks: new Map([["t", { splits: [{ personId: "p", shareBp: 10000 }], held: false }]]),
    settings,
  });
  assert.equal(result.entries.length, 0);
  assert.equal(result.pots[0]!.qualifiedPlays, 0);
  assert.equal(result.reconciliation.differenceCents, 0);
});

test("PAY-2: an artist not played at a site is never paid from its pot", () => {
  const result = computeMonth({
    sites: [
      { siteId: "cafe", feeCents: 4999 },
      { siteId: "books", feeCents: 4999 },
    ],
    plays: [...plays("cafe", "t1", 5), ...plays("books", "t2", 5)],
    tracks: new Map([
      ["t1", { splits: [{ personId: "p1", shareBp: 10000 }], held: false }],
      ["t2", { splits: [{ personId: "p2", shareBp: 10000 }], held: false }],
    ]),
    settings,
  });
  assert.ok(result.entries.filter((e) => e.siteId === "cafe").every((e) => e.personId === "p1"));
  assert.ok(result.entries.filter((e) => e.siteId === "books").every((e) => e.personId === "p2"));
});

test("RTS-6: a held track's money is posted as a hold, not an accrual", () => {
  const result = computeMonth({
    sites: [{ siteId: "cafe", feeCents: 4999 }],
    plays: plays("cafe", "t", 3),
    tracks: new Map([["t", { splits: [{ personId: "p", shareBp: 10000 }], held: true }]]),
    settings,
  });
  assert.equal(result.entries[0]!.type, "hold");
  assert.equal(result.reconciliation.heldCents, 3499);
  assert.equal(result.reconciliation.differenceCents, 0);
});

// Small deterministic PRNG so failures can be reproduced.
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

test("PAY-4: property test, allocations always sum to the pot", () => {
  const random = rng(42);
  for (let round = 0; round < 500; round++) {
    const total = Math.floor(random() * 1_000_000);
    const weights = Array.from({ length: 1 + Math.floor(random() * 12) }, () =>
      Math.floor(random() * 500),
    );
    const parts = largestRemainder(total, weights);
    const expected = weights.some((w) => w > 0) ? total : 0;
    assert.equal(
      parts.reduce((a, p) => a + p, 0),
      expected,
      `round ${round}`,
    );
    weights.forEach((w, i) => {
      if (w === 0) assert.equal(parts[i], 0);
    });
  }
});

test("PAY-4 / PAY-10: property test, every random month reconciles to $0.00", () => {
  const random = rng(7);
  for (let round = 0; round < 200; round++) {
    const sites = Array.from({ length: 1 + Math.floor(random() * 5) }, (_, i) => ({
      siteId: `s${i}`,
      feeCents: Math.floor(random() * 20000),
    }));
    const trackIds = Array.from({ length: 1 + Math.floor(random() * 20) }, (_, i) => `t${i}`);
    const tracks = new Map<string, TrackInput>();
    for (const id of trackIds) {
      const people = 1 + Math.floor(random() * 4);
      const shares = largestRemainder(
        10000,
        Array.from({ length: people }, () => 1 + Math.floor(random() * 100)),
      );
      tracks.set(id, {
        splits:
          random() < 0.1
            ? null
            : shares
                .map((shareBp, i) => ({ personId: `p${i}`, shareBp }))
                .filter((s) => s.shareBp > 0),
        held: random() < 0.1,
      });
    }
    const allPlays: PlayInput[] = [];
    for (let i = 0; i < Math.floor(random() * 400); i++) {
      allPlays.push({
        siteId: sites[Math.floor(random() * sites.length)]!.siteId,
        trackId: trackIds[Math.floor(random() * trackIds.length)]!,
        secondsPlayed: Math.floor(random() * 300),
      });
    }
    const result = computeMonth({ sites, plays: allPlays, tracks, settings });
    assert.equal(result.reconciliation.differenceCents, 0, `round ${round}`);
    for (const pot of result.pots) assert.equal(pot.artistPoolCents + pot.packCents, pot.feeCents);
  }
});
