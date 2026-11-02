import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/** Business owner and staff screens (B1, B2, B4, B5). Owners edit; staff run the player only (ACC-4). */

export type SiteAccess = "owner" | "staff" | "admin";

/** Server-only: what the caller may do at a site. Throws 403 when nothing. */
export async function siteAccess(userId: string, siteId: string): Promise<SiteAccess> {
  const { db, getCaller } = await import("./auth.server");
  const sb = await db();
  const caller = await getCaller(userId);
  const { data: site } = await sb
    .from("sites")
    .select("id,businesses(owner_user_id)")
    .eq("id", siteId)
    .maybeSingle();
  if (!site) throw new Response("Not found", { status: 404 });
  if (site.businesses?.owner_user_id === userId) return "owner";
  if (caller.roles.includes("admin")) return "admin";
  const { data: staff } = await sb
    .from("site_staff")
    .select("user_id")
    .eq("site_id", siteId)
    .eq("user_id", userId)
    .maybeSingle();
  if (staff) return "staff";
  throw new Response("Forbidden", { status: 403 });
}

const SITE_FIELDS =
  "id,business_id,name,address,region,business_type,opening_hours,player_start,player_end,vibe,fee_cents,short_code,trim_db,explicit_allowed,use_house_playlist,licensing_accepted_at,last_heartbeat_at,businesses(name,owner_user_id)";

/** Every site the caller can reach, with what they may do there. */
export const getMyBusiness = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { db, getCaller, getSettings } = await import("./auth.server");
    const sb = await db();
    const caller = await getCaller(context.userId);
    const isAdmin = caller.roles.includes("admin");

    const { data: staffRows } = await sb
      .from("site_staff")
      .select("site_id")
      .eq("user_id", context.userId);
    const staffIds = (staffRows ?? []).map((r) => r.site_id);
    const { data: owned } = await sb
      .from("businesses")
      .select("id")
      .eq("owner_user_id", context.userId);
    const ownedIds = (owned ?? []).map((b) => b.id);

    let query = sb.from("sites").select(SITE_FIELDS).order("name");
    if (!isAdmin) {
      const filters = [
        ownedIds.length ? `business_id.in.(${ownedIds.join(",")})` : null,
        staffIds.length ? `id.in.(${staffIds.join(",")})` : null,
      ].filter(Boolean);
      if (!filters.length) return emptyBusiness(await getSettings());
      query = query.or(filters.join(","));
    }
    const { data: sites, error } = await query;
    if (error) throw new Error(error.message);

    const siteIds = (sites ?? []).map((s) => s.id);
    const [{ data: staff }, { data: invites }, { data: regions }, { data: notice }] =
      await Promise.all([
        siteIds.length
          ? sb.from("site_staff").select("site_id,user_id,display_name").in("site_id", siteIds)
          : Promise.resolve({ data: [] }),
        siteIds.length
          ? sb
              .from("invites")
              .select("site_id,email,token,expires_at")
              .in("site_id", siteIds)
              .is("used_at", null)
          : Promise.resolve({ data: [] }),
        sb.from("regions").select("code,name").order("sort_order"),
        sb
          .from("documents")
          .select("id,version,title,summary")
          .eq("kind", "licensing_notice")
          .eq("is_current", true)
          .maybeSingle(),
      ]);
    const settings = await getSettings();

    return {
      sites: (sites ?? []).map((s) => ({
        ...s,
        trim_db: Number(s.trim_db),
        businessName: s.businesses?.name ?? s.name,
        access: (s.businesses?.owner_user_id === context.userId
          ? "owner"
          : isAdmin
            ? "admin"
            : "staff") as SiteAccess,
        staff: (staff ?? [])
          .filter((r) => r.site_id === s.id)
          .map((r) => ({ userId: r.user_id, name: r.display_name })),
        pendingStaff: (invites ?? [])
          .filter((r) => r.site_id === s.id && new Date(r.expires_at) > new Date())
          .map((r) => ({ email: r.email, token: r.token })),
      })),
      regions: regions ?? [],
      notice: notice ?? null,
      testMode: settings.testMode,
      artistShareBp: settings.artistShareBp,
    };
  });

function emptyBusiness(settings: { testMode: boolean; artistShareBp: number }) {
  return {
    sites: [],
    regions: [],
    notice: null,
    testMode: settings.testMode,
    artistShareBp: settings.artistShareBp,
  };
}

export type MyBusiness = Awaited<ReturnType<typeof getMyBusiness>>;
export type MySite = MyBusiness["sites"][number];

const time = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Use a time like 07:00");

/** B2: owner edits the site profile (VEN-1). */
export const saveSite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        siteId: z.string().uuid(),
        name: z.string().trim().min(1).max(160),
        address: z.string().trim().max(300),
        region: z.string().trim().max(60).nullable(),
        business_type: z.string().trim().max(60),
        opening_hours: z.string().trim().max(300),
        player_start: time,
        player_end: time,
        vibe: z.string().trim().max(500),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { db, audit } = await import("./auth.server");
    const access = await siteAccess(context.userId, data.siteId);
    if (access === "staff") throw new Error("Only the business owner can change the site profile.");
    const sb = await db();
    const { siteId, ...fields } = data;
    const { data: before } = await sb.from("sites").select("*").eq("id", siteId).single();
    const { error } = await sb.from("sites").update(fields).eq("id", siteId);
    if (error) throw new Error(error.message);
    await audit({
      actor: context.userId,
      action: "site.update",
      target: siteId,
      before,
      after: fields,
    });
    return { ok: true as const };
  });

/** B1: the owner acknowledges the licensing notice (VEN-7). Open data is separate and optional (ACC-10). */
export const acceptLicensing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ openData: z.boolean() }).parse(data))
  .handler(async ({ context, data }) => {
    const { db, audit } = await import("./auth.server");
    const sb = await db();
    const { data: notice } = await sb
      .from("documents")
      .select("id,version")
      .eq("kind", "licensing_notice")
      .eq("is_current", true)
      .single();
    await sb
      .from("acceptances")
      .upsert(
        { user_id: context.userId, document_id: notice!.id },
        { onConflict: "user_id,document_id", ignoreDuplicates: true },
      );
    const { data: owned } = await sb
      .from("businesses")
      .select("id")
      .eq("owner_user_id", context.userId);
    const ids = (owned ?? []).map((b) => b.id);
    if (ids.length) {
      await sb
        .from("sites")
        .update({ licensing_accepted_at: new Date().toISOString() })
        .in("business_id", ids)
        .is("licensing_accepted_at", null);
    }
    if (data.openData) {
      await sb
        .from("profiles")
        .update({ open_data_consent_at: new Date().toISOString() })
        .eq("user_id", context.userId);
    }
    await audit({
      actor: context.userId,
      action: "licensing.accept",
      after: { notice: notice!.version, openData: data.openData },
    });
    return { ok: true as const };
  });

/** B2: owner adds staff by link (ACC-4). Returns the single-use invite token. */
export const inviteStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z.object({ siteId: z.string().uuid(), email: z.string().trim().email().max(255) }).parse(data),
  )
  .handler(async ({ context, data }) => {
    const { db, audit } = await import("./auth.server");
    const access = await siteAccess(context.userId, data.siteId);
    if (access === "staff") throw new Error("Only the business owner can add staff.");
    const sb = await db();
    const { data: site } = await sb
      .from("sites")
      .select("business_id")
      .eq("id", data.siteId)
      .single();
    const { data: invite, error } = await sb
      .from("invites")
      .insert({
        email: data.email.toLowerCase(),
        role: "business_staff",
        site_id: data.siteId,
        business_id: site!.business_id,
        created_by: context.userId,
      })
      .select("id,token")
      .single();
    if (error) throw new Error(error.message);
    await audit({
      actor: context.userId,
      action: "staff.invite",
      target: invite.id,
      after: { email: data.email, siteId: data.siteId },
    });
    return { token: invite.token };
  });

/** B5: the Pack-assigned playlist and the site's house picks, if any. */
export const getSitePlaylists = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ siteId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const { db } = await import("./auth.server");
    await siteAccess(context.userId, data.siteId);
    const sb = await db();
    const { data: site } = await sb
      .from("sites")
      .select("use_house_playlist")
      .eq("id", data.siteId)
      .single();
    const { data: assignment } = await sb
      .from("site_assignments")
      .select("playlist_version_id,starts_at")
      .eq("site_id", data.siteId)
      .lte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { data: nowPlaying } = await sb
      .from("now_playing")
      .select("track_id")
      .eq("site_id", data.siteId)
      .maybeSingle();

    const loadVersion = async (versionId: string) => {
      const { data: version } = await sb
        .from("playlist_versions")
        .select("id,version,published_at,playlists(id,name,curated_by)")
        .eq("id", versionId)
        .single();
      const { data: rows } = await sb
        .from("playlist_tracks")
        .select("position,tracks(id,title,duration_ms,releases(artists(public_name)))")
        .eq("playlist_version_id", versionId)
        .order("position");
      return {
        id: version!.id,
        version: version!.version,
        name: version!.playlists?.name ?? "",
        curatedBy: version!.playlists?.curated_by ?? "",
        tracks: (rows ?? []).map((r) => ({
          position: r.position,
          trackId: r.tracks?.id ?? "",
          title: r.tracks?.title ?? "",
          artist: r.tracks?.releases?.artists?.public_name ?? "",
          durationMs: r.tracks?.duration_ms ?? 0,
        })),
      };
    };

    return {
      assigned: assignment ? await loadVersion(assignment.playlist_version_id) : null,
      useHousePlaylist: site?.use_house_playlist ?? false,
      nowPlayingTrackId: nowPlaying?.track_id ?? null,
    };
  });
