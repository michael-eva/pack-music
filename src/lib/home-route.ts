/** Where each kind of account lands after signing in. */
export function homeFor(roles: string[]): string {
  if (roles.includes("admin") || roles.includes("curator")) return "/admin";
  return "/listen";
}
