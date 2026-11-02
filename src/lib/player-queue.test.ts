import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addListened,
  dropSent,
  isPlayable,
  mergeEvents,
  nextIndex,
  parseQueue,
  upNext,
  type PlayEvent,
} from "./player-queue.ts";

const base = {
  trackId: "t",
  releaseState: "live",
  explicit: false,
  takenDownAt: null,
  flaggedAt: null,
  hasAudio: true,
};

test("RTS-4 / RTS-6 / CUR-7: only live, unflagged, allowed tracks are playable", () => {
  assert.equal(isPlayable(base, false), true);
  assert.equal(isPlayable({ ...base, releaseState: "scheduled" }, false), false);
  assert.equal(isPlayable({ ...base, takenDownAt: "2026-11-01" }, false), false);
  assert.equal(isPlayable({ ...base, flaggedAt: "2026-11-01" }, false), false);
  assert.equal(isPlayable({ ...base, explicit: true }, false), false);
  assert.equal(isPlayable({ ...base, explicit: true }, true), true);
  assert.equal(isPlayable({ ...base, hasAudio: false }, true), false);
});

test("the playlist loops", () => {
  assert.equal(nextIndex(-1, 3), 0);
  assert.equal(nextIndex(2, 3), 0);
  assert.equal(nextIndex(0, 0), -1);
});

test("up next follows the current track, and restarts if it was removed", () => {
  const q = [{ trackId: "a" }, { trackId: "b" }, { trackId: "c" }];
  assert.deepEqual(
    upNext(q, "b", 2).map((t) => t.trackId),
    ["c", "a"],
  );
  assert.deepEqual(
    upNext(q, "gone", 2).map((t) => t.trackId),
    ["a", "b"],
  );
  assert.deepEqual(
    upNext(q, null, 5).map((t) => t.trackId),
    ["a", "b", "c"],
  );
});

const ev = (id: string): PlayEvent => ({
  id,
  siteId: "s",
  trackId: "t",
  playlistVersionId: null,
  startedAt: "2026-11-02T00:00:00Z",
  secondsPlayed: 40,
});

test("PLY-5: the offline queue never duplicates an event and drops only confirmed ones", () => {
  const q = mergeEvents([ev("1")], [ev("1"), ev("2")]);
  assert.deepEqual(
    q.map((e) => e.id),
    ["1", "2"],
  );
  assert.deepEqual(
    dropSent(q, ["1"]).map((e) => e.id),
    ["2"],
  );
});

test("a corrupt stored queue is ignored", () => {
  assert.deepEqual(parseQueue("not json"), []);
  assert.deepEqual(parseQueue('[{"id":1}]'), []);
  assert.equal(parseQueue(JSON.stringify([ev("1")])).length, 1);
});

test("PAY-1: listened seconds ignore seeks", () => {
  let total = 0;
  total = addListened(total, 0, 0.25);
  total = addListened(total, 0.25, 0.5);
  total = addListened(total, 0.5, 90); // seek
  assert.equal(total, 0.5);
});
