import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/** Validation errors reach the screen, so keep them in plain words. */
export function valid<T>(schema: z.ZodType<T, z.ZodTypeDef, unknown>, d: unknown): T {
  const r = schema.safeParse(d);
  if (!r.success) throw new Error(r.error.issues.map((i) => i.message).join(" "));
  return r.data;
}

const uuid = z.string().uuid();

// ---------------------------------------------------------------------------
// Dashboard (ADM-1)
// ---------------------------------------------------------------------------

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireRole, db } = await import("./auth.server");
    await requireRole(context.userId, "admin");
    const sb = await db();
    const count = async (q: PromiseLike<{ count: number | null }>) => (await q).count ?? 0;
    const head = { count: "exact" as const, head: true };
    const [
      artists,
      live,
      drafts,
      tracks,
      playlists,
      featured,
      listeners,
      { data: recent },
      { data: profiles },
    ] = await Promise.all([
      count(sb.from("artists").select("id", head)),
      count(sb.from("releases").select("id", head).eq("state", "live")),
      count(sb.from("releases").select("id", head).eq("state", "draft")),
      count(sb.from("tracks").select("id", head)),
      count(sb.from("playlists").select("id", head)),
      count(sb.from("playlists").select("id", head).eq("is_featured", true)),
      count(sb.from("user_roles").select("user_id", head).eq("role", "listener")),
      sb
        .from("audit_log")
        .select("id,actor,action,target,created_at")
        .order("created_at", { ascending: false })
        .limit(10),
      sb.from("profiles").select("user_id,email,display_name"),
    ]);
    const who = new Map((profiles ?? []).map((p) => [p.user_id, p.display_name ?? p.email]));
    return {
      artists,
      liveReleases: live,
      draftReleases: drafts,
      tracks,
      playlists,
      featuredPlaylists: featured,
      listeners,
      recent: (recent ?? []).map((r) => ({
        ...r,
        actorName: r.actor ? (who.get(r.actor) ?? "Unknown") : "System",
      })),
    };
  });

// ---------------------------------------------------------------------------
// Users and invites (ADM-3)
// ---------------------------------------------------------------------------

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireRole, db } = await import("./auth.server");
    await requireRole(context.userId, "admin");
    const sb = await db();
    const [{ data: profiles }, { data: roles }, { data: invites }] = await Promise.all([
      sb
        .from("profiles")
        .select("user_id,email,display_name,deactivated_at,created_at")
        .order("created_at"),
      sb.from("user_roles").select("user_id,role"),
      sb
        .from("invites")
        .select("id,token,email,role,used_at,expires_at,created_at")
        .is("used_at", null)
        .order("created_at", { ascending: false }),
    ]);
    const users = (profiles ?? []).map((p) => ({
      id: p.user_id,
      email: p.email,
      name: p.display_name,
      roles: (roles ?? []).filter((r) => r.user_id === p.user_id).map((r) => r.role),
      joinedAt: p.created_at,
      deactivated: !!p.deactivated_at,
      isMe: p.user_id === context.userId,
    }));
    const pending = (invites ?? []).map((i) => ({
      id: i.id,
      token: i.token,
      email: i.email,
      role: i.role,
      expired: new Date(i.expires_at) < new Date(),
      createdAt: i.created_at,
    }));
    return { users, invites: pending };
  });

export const createInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    valid(
      z.object({
        email: z.string().trim().email("Enter a valid email address.").max(255),
        role: z.enum(["admin", "curator"]),
      }),
      d,
    ),
  )
  .handler(async ({ context, data }) => {
    const { requireRole, db, audit } = await import("./auth.server");
    await requireRole(context.userId, "admin");
    const sb = await db();
    const { data: invite, error } = await sb
      .from("invites")
      .insert({ email: data.email.toLowerCase(), role: data.role, created_by: context.userId })
      .select("id,token")
      .single();
    if (error) throw new Error(error.message);
    await audit({ actor: context.userId, action: "invite.create", target: invite.id, after: data });
    return { token: invite.token };
  });

/** Resend = a fresh single-use link; the old one stops working. */
export const resendInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => valid(z.object({ inviteId: uuid }), d))
  .handler(async ({ context, data }) => {
    const { requireRole, db, audit } = await import("./auth.server");
    await requireRole(context.userId, "admin");
    const sb = await db();
    const { data: old } = await sb.from("invites").select("*").eq("id", data.inviteId).single();
    if (!old || old.used_at) throw new Error("That invite has already been used.");
    await sb.from("invites").update({ expires_at: new Date().toISOString() }).eq("id", old.id);
    const { data: fresh, error } = await sb
      .from("invites")
      .insert({ email: old.email, role: old.role, created_by: context.userId })
      .select("id,token")
      .single();
    if (error || !fresh) throw new Error(error?.message ?? "Couldn't make a new link.");
    await audit({
      actor: context.userId,
      action: "invite.resend",
      target: fresh.id,
      before: { invite: old.id },
    });
    return { token: fresh.token };
  });

/** Grant or revoke the curator role. Admin is granted only by invite. */
export const setCurator = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => valid(z.object({ userId: uuid, curator: z.boolean() }), d))
  .handler(async ({ context, data }) => {
    const { requireRole, db, audit } = await import("./auth.server");
    await requireRole(context.userId, "admin");
    const sb = await db();
    const { error } = data.curator
      ? await sb
          .from("user_roles")
          .upsert({ user_id: data.userId, role: "curator" }, { onConflict: "user_id,role" })
      : await sb.from("user_roles").delete().eq("user_id", data.userId).eq("role", "curator");
    if (error) throw new Error(error.message);
    await audit({
      actor: context.userId,
      action: data.curator ? "role.grant" : "role.revoke",
      target: data.userId,
      after: { role: "curator" },
    });
    return { ok: true as const };
  });

export const setUserActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => valid(z.object({ userId: uuid, active: z.boolean() }), d))
  .handler(async ({ context, data }) => {
    const { requireRole, db, audit } = await import("./auth.server");
    await requireRole(context.userId, "admin");
    if (data.userId === context.userId) throw new Error("You can't deactivate your own account.");
    const sb = await db();
    // Ban in auth too, so existing sessions can't refresh and sign-in is refused (ADM-3).
    const { error } = await sb.auth.admin.updateUserById(data.userId, {
      ban_duration: data.active ? "none" : "876000h",
    });
    if (error) throw new Error(error.message);
    await sb
      .from("profiles")
      .update({ deactivated_at: data.active ? null : new Date().toISOString() })
      .eq("user_id", data.userId);
    await audit({
      actor: context.userId,
      action: data.active ? "user.reactivate" : "user.deactivate",
      target: data.userId,
    });
    return { ok: true as const };
  });

// ---------------------------------------------------------------------------
// Settings (ADM-4)
// ---------------------------------------------------------------------------

export const getSettingsTable = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireRole, db } = await import("./auth.server");
    await requireRole(context.userId, "admin");
    const sb = await db();
    const [{ data: rows }, { data: profiles }] = await Promise.all([
      sb
        .from("settings")
        .select("key,value,changed_by,changed_at")
        .in("key", Object.keys(SETTING_SCHEMAS)),
      sb.from("profiles").select("user_id,display_name,email"),
    ]);
    const who = (id: string | null) => {
      const p = (profiles ?? []).find((x) => x.user_id === id);
      return p ? (p.display_name ?? p.email) : null;
    };
    return (rows ?? []).map((r) => ({
      key: r.key,
      value: r.value,
      changedBy: who(r.changed_by),
      changedAt: r.changed_at,
    }));
  });

const SETTING_SCHEMAS: Record<string, z.ZodTypeAny> = {
  loudness_target_lufs: z
    .number()
    .min(-30, "Pick a target between -30 and -5 LUFS.")
    .max(-5, "Pick a target between -30 and -5 LUFS."),
  playlist_rules: z.object({
    noArtistTwiceInARow: z.boolean(),
    repeatWindowMinutes: z.number().int().min(0).max(1440),
  }),
};

export const updateSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => {
    const base = valid(
      z.object({
        key: z.enum(Object.keys(SETTING_SCHEMAS) as [string, ...string[]]),
        value: z.unknown(),
      }),
      d,
    );
    return { key: base.key, value: valid(SETTING_SCHEMAS[base.key]!, base.value) as unknown };
  })
  .handler(async ({ context, data }) => {
    const { requireRole, db, audit } = await import("./auth.server");
    await requireRole(context.userId, "admin");
    const sb = await db();
    const { data: before } = await sb
      .from("settings")
      .select("value")
      .eq("key", data.key)
      .maybeSingle();
    const { error } = await sb.from("settings").upsert({
      key: data.key,
      value: data.value as never,
      changed_by: context.userId,
      changed_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    await audit({
      actor: context.userId,
      action: "setting.change",
      target: data.key,
      before: before?.value ?? null,
      after: data.value,
    });
    return { ok: true as const };
  });

// ---------------------------------------------------------------------------
// Audit log (ADM-7)
// ---------------------------------------------------------------------------

export const listAudit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    valid(
      z.object({
        actorEmail: z.string().trim().max(255).optional(),
        action: z.string().trim().max(100).optional(),
        from: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
        to: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
        page: z.number().int().min(0).default(0),
      }),
      d,
    ),
  )
  .handler(async ({ context, data }) => {
    const { requireRole, db } = await import("./auth.server");
    await requireRole(context.userId, "admin");
    const sb = await db();
    const { data: profiles } = await sb.from("profiles").select("user_id,email,display_name");
    let query = sb
      .from("audit_log")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });
    if (data.actorEmail) {
      const ids = (profiles ?? [])
        .filter((p) => p.email.includes(data.actorEmail!.toLowerCase()))
        .map((p) => p.user_id);
      query = query.in("actor", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    }
    if (data.action) query = query.ilike("action", `%${data.action}%`);
    if (data.from) query = query.gte("created_at", `${data.from}T00:00:00Z`);
    if (data.to)
      query = query.lt(
        "created_at",
        new Date(new Date(`${data.to}T00:00:00Z`).getTime() + 86400_000).toISOString(),
      );
    const start = data.page * 50;
    const { data: rows, count, error } = await query.range(start, start + 49);
    if (error) throw new Error(error.message);
    const who = new Map((profiles ?? []).map((p) => [p.user_id, p.email]));
    return {
      rows: (rows ?? []).map((r) => ({
        ...r,
        actorEmail: r.actor ? (who.get(r.actor) ?? r.actor) : "system",
      })),
      total: count ?? 0,
    };
  });
