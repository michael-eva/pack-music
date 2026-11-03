import type { Database, Json } from "@/integrations/supabase/types";

/**
 * Server-only access checks. The browser never talks to the database: every
 * server function loads the caller with `getCaller`, checks roles with
 * `requireRole`, then uses the service-role client. Never import from browser code.
 */

export type AppRole = Database["public"]["Enums"]["app_role"];

export type Caller = {
  userId: string;
  email: string;
  displayName: string | null;
  roles: AppRole[];
};

/**
 * Thrown when the caller lacks a role. An Error, not a Response: a Response thrown
 * from a server function reaches the browser as a normal return value, so the
 * screen would think the call worked.
 */
export class AccessError extends Error {
  readonly status = 403;
}

export async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function getCaller(userId: string): Promise<Caller> {
  const sb = await db();
  const [{ data: profile }, { data: roles }] = await Promise.all([
    sb
      .from("profiles")
      .select("email,display_name,deactivated_at")
      .eq("user_id", userId)
      .maybeSingle(),
    sb.from("user_roles").select("role").eq("user_id", userId),
  ]);
  if (profile?.deactivated_at) throw new AccessError("This account has been deactivated.");
  return {
    userId,
    email: profile?.email ?? "",
    displayName: profile?.display_name ?? null,
    roles: (roles ?? []).map((r) => r.role),
  };
}

/** Throws 403 unless the caller holds at least one of `roles`. Admin passes every check. */
export async function requireRole(userId: string, ...roles: AppRole[]): Promise<Caller> {
  const caller = await getCaller(userId);
  if (caller.roles.includes("admin") || roles.some((r) => caller.roles.includes(r))) return caller;
  throw new AccessError("You don't have access to do that.");
}

export async function audit(entry: {
  actor: string | null;
  action: string;
  target?: string;
  before?: unknown;
  after?: unknown;
  reason?: string;
}) {
  const sb = await db();
  await sb.from("audit_log").insert({
    actor: entry.actor,
    action: entry.action,
    target: entry.target ?? null,
    before: (entry.before ?? null) as Json,
    after: (entry.after ?? null) as Json,
    reason: entry.reason ?? null,
  });
}

export type Settings = {
  loudnessTargetLufs: number;
  playlistRules: { noArtistTwiceInARow: boolean; repeatWindowMinutes: number };
};

const SETTING_KEYS: Record<keyof Settings, string> = {
  loudnessTargetLufs: "loudness_target_lufs",
  playlistRules: "playlist_rules",
};

export async function getSettings(): Promise<Settings> {
  const sb = await db();
  const { data, error } = await sb.from("settings").select("key,value");
  if (error) throw new Error(error.message);
  const byKey = new Map((data ?? []).map((row) => [row.key, row.value]));
  const out = {} as Record<string, unknown>;
  for (const [field, key] of Object.entries(SETTING_KEYS)) out[field] = byKey.get(key);
  return out as Settings;
}

export function settingKey(field: keyof Settings) {
  return SETTING_KEYS[field];
}
