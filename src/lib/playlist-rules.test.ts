import { test } from "node:test";
import assert from "node:assert/strict";
import { checkPlaylist, type RuleTrack } from "./playlist-rules.ts";

const rules = { noArtistTwiceInARow: true, repeatWindowMinutes: 180 };
const t = (id: string, artistId: string, minutes = 4, explicit = false): RuleTrack => ({
  id,
  title: id,
  artistId,
  artistName: artistId,
  durationMs: minutes * 60_000,
  explicit,
});

test("CUR-2: the same artist twice in a row is flagged, naming both tracks", () => {
  const issues = checkPlaylist([t("a", "x", 60), t("b", "x", 60), t("c", "y", 60)], rules);
  const twice = issues.filter((i) => i.kind === "artist_twice");
  assert.equal(twice.length, 1);
  assert.deepEqual(twice[0]!.positions, [0, 1]);
  assert.match(twice[0]!.message, /“a” then “b”/);
});

test("CUR-2: the loop from last to first counts as in a row", () => {
  const issues = checkPlaylist([t("a", "x", 60), t("b", "y", 60), t("c", "x", 60)], rules);
  assert.deepEqual(issues.find((i) => i.kind === "artist_twice")?.positions, [2, 0]);
});

test("CUR-2: a track repeated inside the window is a break", () => {
  const issues = checkPlaylist(
    [t("a", "x", 30), t("b", "y", 30), t("a", "x", 30), t("c", "z", 200)],
    rules,
  );
  const repeat = issues.find((i) => i.kind === "repeat_window");
  assert.deepEqual(repeat?.positions, [0, 2]);
});

test("a long enough list with distinct artists passes", () => {
  const issues = checkPlaylist([t("a", "x", 70), t("b", "y", 70), t("c", "z", 70)], rules);
  assert.deepEqual(issues, []);
});

test("a short list warns that it loops inside the window", () => {
  const issues = checkPlaylist([t("a", "x"), t("b", "y")], rules);
  assert.equal(issues.length, 1);
  assert.equal(issues[0]!.kind, "loop_short");
  assert.equal(issues[0]!.severity, "warning");
});

test("CUR-7: explicit tracks warn unless the site allows them", () => {
  const list = [t("a", "x", 100, true), t("b", "y", 100)];
  assert.equal(checkPlaylist(list, rules).filter((i) => i.kind === "explicit").length, 1);
  assert.equal(
    checkPlaylist(list, rules, { explicitAllowed: true }).filter((i) => i.kind === "explicit")
      .length,
    0,
  );
});
