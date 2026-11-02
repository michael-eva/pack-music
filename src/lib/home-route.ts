/** Where each kind of account lands after signing in. */
export function homeFor(roles: string[]): string {
  if (roles.includes("admin")) return "/admin";
  if (roles.includes("curator")) return "/admin/playlists";
  if (roles.includes("artist")) return "/studio";
  if (roles.includes("business_owner") || roles.includes("business_staff")) return "/business";
  return "/saved";
}
