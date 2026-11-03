import { test } from "node:test";
import assert from "node:assert/strict";
import { isValidIsrc, isValidUpc, normaliseIsrc } from "./identifiers.ts";

test("UPC: valid 12 and 13 digit codes pass", () => {
  assert.ok(isValidUpc("036000291452")); // UPC-A
  assert.ok(isValidUpc("4006381333931")); // EAN-13
  assert.ok(isValidUpc("0601234567897")); // demo seed
});

test("UPC: a wrong check digit or length fails", () => {
  assert.ok(!isValidUpc("036000291453"));
  assert.ok(!isValidUpc("12345"));
  assert.ok(!isValidUpc("03600029145A"));
});

test("ISRC: format with or without dashes", () => {
  assert.ok(isValidIsrc("AU-XXX-26-00001"));
  assert.ok(isValidIsrc("auxx02600001"));
  assert.equal(normaliseIsrc("au-xxx-26-00001"), "AUXXX2600001");
  assert.ok(!isValidIsrc("AUXXX260001"));
  assert.ok(!isValidIsrc("1UXXX2600001"));
});
