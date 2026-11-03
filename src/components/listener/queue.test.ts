import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cycleRepeat,
  identityOrder,
  isStale,
  nextPos,
  prevPos,
  shuffledOrder,
  type QueueState,
} from "./queue.ts";

const state = (pos: number, repeat: QueueState["repeat"] = "off", length = 3): QueueState => ({
  length,
  order: identityOrder(length),
  pos,
  repeat,
});

test("next moves on, and stops at the end when repeat is off", () => {
  assert.equal(nextPos(state(0), false), 1);
  assert.equal(nextPos(state(2), true), null);
});

test("repeat all wraps to the start", () => {
  assert.equal(nextPos(state(2, "all"), true), 0);
});

test("repeat one replays when the track ends, but a tap on Next moves on", () => {
  assert.equal(nextPos(state(1, "one"), true), 1);
  assert.equal(nextPos(state(1, "one"), false), 2);
});

test("an empty queue has nothing next", () => {
  assert.equal(nextPos(state(0, "all", 0), true), null);
});

test("previous restarts the song after 3 seconds, otherwise goes back", () => {
  assert.equal(prevPos(state(1), 10), 1);
  assert.equal(prevPos(state(1), 1), 0);
  assert.equal(prevPos(state(0), 1), 0);
  assert.equal(prevPos(state(0, "all"), 1), 2);
});

test("shuffle keeps every track once, with the current one first", () => {
  let seed = 3;
  const random = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const order = shuffledOrder(8, 5, random);
  assert.equal(order[0], 5);
  assert.deepEqual(
    [...order].sort((a, b) => a - b),
    identityOrder(8),
  );
  assert.deepEqual(shuffledOrder(0, 0), []);
});

test("repeat cycles off, all, one", () => {
  assert.equal(cycleRepeat("off"), "all");
  assert.equal(cycleRepeat("all"), "one");
  assert.equal(cycleRepeat("one"), "off");
});

test("signed links go stale after two hours", () => {
  assert.equal(isStale(0, 60 * 60 * 1000), false);
  assert.equal(isStale(0, 2 * 60 * 60 * 1000 + 1), true);
});
