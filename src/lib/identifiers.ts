/** Identifier checks for the catalogue (CAT-6). Pure, so the browser and server agree. */

/** UPC-A (12) or EAN-13 (13) digits with a valid GS1 check digit. */
export function isValidUpc(value: string): boolean {
  if (!/^\d{12,13}$/.test(value)) return false;
  const digits = value.split("").map(Number);
  const check = digits.pop()!;
  // Weights alternate 3,1 starting from the digit next to the check digit.
  const sum = digits.reverse().reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

/** Strips dashes and spaces and upper-cases: "au-xxx-26-00001" → "AUXXX2600001". */
export function normaliseIsrc(value: string): string {
  return value.replace(/[\s-]/g, "").toUpperCase();
}

/** Country (2 letters), registrant (3 alphanumerics), year (2 digits), designation (5 digits). */
export function isValidIsrc(value: string): boolean {
  return /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/.test(normaliseIsrc(value));
}
