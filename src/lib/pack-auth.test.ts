import test from "node:test";
import assert from "node:assert/strict";
import { checkNewPassword, signInWithPassword, signUpListener, validateAbn, validateOtp, validatePostcode } from "./pack-auth";

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
test("listener sign-up needs only an email", async () => {
  assert.equal((await signUpListener("a@b.co")).ok, true);
  assert.equal((await signUpListener("not-an-email")).ok, false);
});
test("listener sign-up checks a password when one is given", async () => {
  assert.equal((await signUpListener("a@b.co", "short")).ok, false);
  assert.equal((await signUpListener("a@b.co", "Abcdefghij12")).ok, true);
});
test("a new password must match its confirmation", () => {
  assert.equal(checkNewPassword("Abcdefghij12", "Abcdefghij12").ok, true);
  assert.equal(checkNewPassword("Abcdefghij12", "Abcdefghij13").ok, false);
  assert.equal(checkNewPassword("password1234", "password1234").ok, false);
});
test("postcode is optional but must be four digits", () => {
  assert.equal(validatePostcode(""), true);
  assert.equal(validatePostcode("6160"), true);
  assert.equal(validatePostcode("616"), false);
});
