import { test } from "node:test";
import assert from "node:assert/strict";
import { dbToLinear, playbackGainDb } from "./loudness.ts";

test("PLY-3: a loud track is turned down to the target", () => {
  assert.equal(playbackGainDb({ targetLufs: -14, trackLufs: -9.4, truePeakDb: -0.5 }), -4.6);
});

test("PLY-3: a quiet track is boosted only as far as its true-peak headroom", () => {
  // Wants +8 dB, but only has 4 dB before the -1 dBTP ceiling.
  assert.equal(playbackGainDb({ targetLufs: -14, trackLufs: -22, truePeakDb: -5 }), 4);
  // Plenty of headroom: full boost.
  assert.equal(playbackGainDb({ targetLufs: -14, trackLufs: -22.35, truePeakDb: -14.46 }), 8.4);
});

test("PLY-2: the site trim is added on top of levelling", () => {
  assert.equal(playbackGainDb({ targetLufs: -14, trackLufs: -14, truePeakDb: -3, trimDb: -6 }), -6);
});

test("missing loudness falls back to the trim only", () => {
  assert.equal(
    playbackGainDb({ targetLufs: -14, trackLufs: null, truePeakDb: null, trimDb: 2 }),
    2,
  );
});

test("dbToLinear", () => {
  assert.equal(dbToLinear(0), 1);
  assert.ok(Math.abs(dbToLinear(-6) - 0.501) < 0.001);
});
