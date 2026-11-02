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
  if (profile?.deactivated_at)
    throw new Response("This account has been deactivated.", { status: 403 });
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
  throw new Response("Forbidden", { status: 403 });
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
  testMode: boolean;
  siteFeeCents: number;
  artistShareBp: number;
  playThresholdSeconds: number;
  payoutThresholdCents: number;
  loudnessTargetLufs: number;
  acceptedAiAnswers: string[];
  playlistRules: { noArtistTwiceInARow: boolean; repeatWindowMinutes: number };
  featureFlags: Record<string, boolean>;
};

const SETTING_KEYS: Record<keyof Settings, string> = {
  testMode: "test_mode",
  siteFeeCents: "site_fee_cents",
  artistShareBp: "artist_share_bp",
  playThresholdSeconds: "play_threshold_seconds",
  payoutThresholdCents: "payout_threshold_cents",
  loudnessTargetLufs: "loudness_target_lufs",
  acceptedAiAnswers: "accepted_ai_answers",
  playlistRules: "playlist_rules",
  featureFlags: "feature_flags",
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
