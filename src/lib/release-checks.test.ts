import { test } from "node:test";
import assert from "node:assert/strict";
import {
  checkRelease,
  isValidIsrc,
  isValidUpc,
  stateAfterChecks,
  type CheckContext,
  type CheckRelease,
  type CheckTrack,
} from "./release-checks.ts";

const context: CheckContext = {
  acceptedAiAnswers: ["no"],
  genreIds: new Set(["rock-indie", "folk-acoustic"]),
  existingIsrcs: new Set(["AUXX02600001"]),
  existingUpcs: new Set(["036000291452"]),
};

function track(overrides: Partial<CheckTrack> = {}): CheckTrack {
  return {
    id: "t1",
    position: 1,
    title: "Long Way Down",
    isrc: "AU-AB1-26-00042",
    explicit: false,
    audioPath: "r/long-way-down.wav",
    aiDeclaration: "no",
    genreId: "rock-indie",
    lufs: -11.2,
    splits: [{ shareBp: 10000 }],
    ...overrides,
  };
}

function release(tracks: CheckTrack[], overrides: Partial<CheckRelease> = {}): CheckRelease {
  return { title: "Kestrel Road", upc: "012345678905", tracks, ...overrides };
}

const codes = (r: CheckRelease) => checkRelease(r, context).map((i) => i.code);

test("a clean release has no issues and goes to review", () => {
  const issues = checkRelease(release([track()]), context);
  assert.deepEqual(issues, []);
  assert.equal(stateAfterChecks(issues), "in_review");
});

test("UPC and ISRC formats", () => {
  assert.ok(isValidUpc("036000291452"));
  assert.ok(isValidUpc("4006381333931"));
  assert.ok(!isValidUpc("036000291453"));
  assert.ok(!isValidUpc("12345"));
  assert.ok(isValidIsrc("AU-AB1-26-00042"));
  assert.ok(isValidIsrc("auab12600042"));
  assert.ok(!isValidIsrc("AU-AB1-26-0004"));
});

test("E204: missing audio is a reject that names the song", () => {
  const issues = checkRelease(release([track({ position: 3, audioPath: null })]), context);
  const issue = issues.find((i) => i.code === "E204")!;
  assert.equal(issue.outcome, "reject");
  assert.match(issue.message, /Track 3, “Long Way Down”, is missing its audio file/);
  assert.equal(stateAfterChecks(issues), "needs_attention");
});

test("E310 / E311: AI declaration unanswered is a reject, an answer not accepted is a hold", () => {
  assert.ok(codes(release([track({ aiDeclaration: null })])).includes("E310"));
  const issues = checkRelease(release([track({ aiDeclaration: "yes" })]), context);
  assert.equal(issues[0]!.code, "E311");
  assert.equal(issues[0]!.outcome, "hold");
  assert.equal(stateAfterChecks(issues), "held");
});

test("ING-5: changing the accepted answers changes the outcome with no code change", () => {
  const issues = checkRelease(release([track({ aiDeclaration: "yes" })]), {
    ...context,
    acceptedAiAnswers: ["no", "yes"],
  });
  assert.deepEqual(issues, []);
});

test("E402: splits that don't total 100% say the actual total", () => {
  const issues = checkRelease(
    release([track({ title: "Ocean Teeth", splits: [{ shareBp: 5000 }, { shareBp: 4800 }] })]),
    context,
  );
  assert.equal(issues[0]!.code, "E402");
  assert.match(issues[0]!.message, /“Ocean Teeth” add up to 98%/);
});

test("E520 / E521: identifiers already in the catalogue go to a person", () => {
  const isrc = checkRelease(release([track({ isrc: "AUXX02600001" })]), context);
  assert.equal(isrc[0]!.code, "E520");
  assert.equal(isrc[0]!.outcome, "hold");
  const upc = checkRelease(release([track()], { upc: "036000291452" }), context);
  assert.equal(upc[0]!.code, "E521");
});

test("malformed identifiers and duplicate ISRCs inside one release are rejects", () => {
  assert.ok(codes(release([track({ isrc: "NOPE" })])).includes("E211"));
  assert.ok(codes(release([track()], { upc: "036000291453" })).includes("E131"));
  assert.ok(codes(release([track(), track({ id: "t2", position: 2 })])).includes("E212"));
});

test("E601 off-list genre is a hold; E701 missing loudness is a hold; explicit unknown is a reject", () => {
  assert.equal(
    checkRelease(release([track({ genreId: "dubstep-deluxe" })]), context)[0]!.code,
    "E601",
  );
  assert.equal(checkRelease(release([track({ lufs: null })]), context)[0]!.code, "E701");
  assert.equal(checkRelease(release([track({ explicit: null })]), context)[0]!.code, "E215");
});

test("ING-6: no message uses jargon", () => {
  const everything = release(
    [
      track({
        title: "",
        audioPath: null,
        isrc: null,
        explicit: null,
        aiDeclaration: null,
        genreId: null,
        splits: [],
      }),
      track({
        id: "t2",
        position: 2,
        isrc: "bad",
        aiDeclaration: "yes",
        genreId: "x",
        lufs: null,
        splits: [{ shareBp: 9000 }],
      }),
      track({ id: "t3", position: 3, isrc: "AUXX02600001" }),
    ],
    { title: "", upc: "1" },
  );
  for (const issue of [
    ...checkRelease(everything, context),
    ...checkRelease(release([], { upc: null }), context),
  ]) {
    assert.doesNotMatch(
      issue.message,
      /schema|manifest|parse|metadata|null|undefined/i,
      issue.code,
    );
  }
});
