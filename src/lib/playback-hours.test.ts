import { describe, it as test } from "node:test";
import assert from "node:assert/strict";
import { mergePlaybackRows, playbackWeek, splitPlaybackSeconds } from "./playback-hours";

describe("weekly Pack playback hours", () => {
  test("one hour of playback is 3600 seconds", () => {
    const start = Date.parse("2026-11-04T12:00:00Z");
    assert.deepEqual(splitPlaybackSeconds(start, start + 3600000), [{ week: "2026-11-02", seconds: 3600 }]);
  });
  test("splits at Monday midnight Perth without duplicating time", () => {
    assert.deepEqual(splitPlaybackSeconds(Date.parse("2026-11-08T15:59:55Z"), Date.parse("2026-11-08T16:00:05Z")), [{ week: "2026-11-02", seconds: 5 }, { week: "2026-11-09", seconds: 5 }]);
    assert.equal(playbackWeek(Date.parse("2026-11-08T16:00:00Z")), "2026-11-09");
  });
  test("combines incremental time and keeps listener and business separate", () => {
    const rows = mergePlaybackRows([{ week: "2026-11-02", source: "listener", seconds: 1800 }], { week: "2026-11-02", source: "listener", seconds: 1800 });
    assert.equal(rows[0]?.seconds, 3600);
    assert.equal(mergePlaybackRows(rows, { week: "2026-11-02", source: "business", seconds: 60 }).length, 2);
  });
  test("does not count negative or invalid elapsed time", () => {
    assert.deepEqual(splitPlaybackSeconds(1000, 500), []);
    assert.deepEqual(splitPlaybackSeconds(NaN, 500), []);
  });
});