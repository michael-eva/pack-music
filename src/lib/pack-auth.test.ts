import test from "node:test";
import assert from "node:assert/strict";
import { signInWithPassword, validateAbn, validateOtp } from "./pack-auth";

test("rejects an 11-character password", async () => {
  assert.equal((await signInWithPassword("a@b.co", "Abcdefghij1")).ok, false);
});
test("accepts a 12-character password", async () => {
  assert.equal((await signInWithPassword("a@b.co", "Abcdefghij12")).ok, true);
});
test("rejects common passwords", async () => {
  assert.equal((await signInWithPassword("a@b.co", "password1234")).ok, false);
});
test("checks the ABN checksum", () => {
  assert.equal(validateAbn("51824753556"), true);
  assert.equal(validateAbn("51824753557"), false);
});
test("needs exactly six code digits", () => {
  assert.equal(validateOtp("123456"), true);
  assert.equal(validateOtp("12345"), false);
});
