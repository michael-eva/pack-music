// Placeholder auth module. Any email is accepted; swap for a real provider later.
const COMMON_PASSWORDS = new Set(["password1234", "qwertyuiop12", "123456789012", "letmein12345", "thepack12345"]);
export const PASSWORD_MIN = 12;
export const TERMS_VERSION = "1.0";

export async function requestEmailLink(email: string): Promise<{ ok: boolean; error?: string }> {
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: "That email doesn't look quite right. Check it and try again." };
  return { ok: true };
}

export function checkPassword(password: string): { ok: boolean; error?: string } {
  if (password.length < PASSWORD_MIN) return { ok: false, error: `Passwords need at least ${PASSWORD_MIN} characters.` };
  if (COMMON_PASSWORDS.has(password.toLowerCase())) return { ok: false, error: "That password is too common. Choose another." };
  return { ok: true };
}

export function passwordStrength(password: string): "Weak" | "OK" | "Strong" {
  if (!checkPassword(password).ok) return "Weak";
  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z0-9]/].filter(r => r.test(password)).length;
  return password.length >= 16 && variety >= 3 ? "Strong" : "OK";
}

export async function signInWithPassword(email: string, password: string) {
  const r = await requestEmailLink(email);
  if (!r.ok) return r;
  return checkPassword(password);
}

export async function signUpListener(email: string, password?: string) {
  const r = await requestEmailLink(email);
  if (!r.ok || password === undefined) return r;
  return checkPassword(password);
}

// Same answer whether or not the account exists, so the form can't be used to probe for emails.
export const requestPasswordReset = requestEmailLink;

export function checkNewPassword(password: string, confirm: string): { ok: boolean; error?: string } {
  const r = checkPassword(password);
  if (!r.ok) return r;
  return password === confirm ? r : { ok: false, error: "The two passwords don't match." };
}

export const validatePostcode = (value: string) => value.trim() === "" || /^\d{4}$/.test(value.trim());

export const validateOtp = (code: string) => /^\d{6}$/.test(code);

export function validateAbn(value: string): boolean {
  const abn = value.replace(/\s/g, "");
  if (!/^\d{11}$/.test(abn)) return false;
  const d = [...abn].map((c, i) => Number(c) - (i === 0 ? 1 : 0));
  const w = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  return d.reduce((s, x, i) => s + x * (w[i] ?? 0), 0) % 89 === 0;
}
