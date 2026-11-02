import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { siteAccess } from "./business.functions";

/** The business player (B3): queue, heartbeat, play events, skips and trim. */

/**
 * The site's current playlist, levelled and ready to play. Called at every
 * track boundary, so a reassignment or a takedown applies at the next track
 * (CUR-3, RTS-4).
 */
export const getPlayerQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ siteId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const { db, getSettings } = await import("./auth.server");
    const { signedAudioUrls } = await import("./audio.server");
    const { playbackGainDb } = await import("./loudness");
    const { isPlayable } = await import("./player-queue");
    await siteAccess(context.userId, data.siteId);
    const sb = await db();
    const settings = await getSettings();

    const { data: site } = await sb
      .from("sites")
      .select(
        "id,name,short_code,trim_db,explicit_allowed,licensing_accepted_at,regions(name),businesses(name)",
      )
      .eq("id", data.siteId)
      .single();
    if (!site) throw new Response("Not found", { status: 404 });

    const { data: assignment } = await sb
      .from("site_assignments")
      .select("playlist_version_id")
      .eq("site_id", data.siteId)
      .lte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const base = {
      site: {
        id: site.id,
        name: site.name,
        businessName: site.businesses?.name ?? site.name,
        region: site.regions?.name ?? null,
        shortCode: site.short_code,
        trimDb: Number(site.trim_db),
        licensingAccepted: !!site.licensing_accepted_at,
      },
      targetLufs: settings.loudnessTargetLufs,
    };
    if (!assignment) return { ...base, playlist: null, tracks: [] };

    const { data: version } = await sb
      .from("playlist_versions")
      .select("id,version,playlists(name,curated_by)")
      .eq("id", assignment.playlist_version_id)
      .single();
    const { data: rows } = await sb
      .from("playlist_tracks")
      .select(
        "position,tracks(id,title,duration_ms,audio_path,explicit,lufs,true_peak,taken_down_at,flagged_at,releases(state,artwork_url,title,artists(id,public_name,regions(name))))",
      )
      .eq("playlist_version_id", assignment.playlist_version_id)
      .order("position");

    const eligible = (rows ?? [])
      .map((r) => r.tracks)
      .filter((t): t is NonNullable<typeof t> => !!t)
      .filter((t) =>
        isPlayable(
          {
            trackId: t.id,
            releaseState: t.releases?.state ?? "",
            explicit: t.explicit,
            takenDownAt: t.taken_down_at,
            flaggedAt: t.flagged_at,
            hasAudio: !!t.audio_path,
          },
          site.explicit_allowed,
        ),
      );
    const urls = await signedAudioUrls(eligible.map((t) => t.audio_path!));

    return {
      ...base,
      playlist: {
        versionId: version!.id,
        version: version!.version,
        name: version!.playlists?.name ?? "",
        curatedBy: version!.playlists?.curated_by ?? "",
      },
      tracks: eligible.map((t) => ({
        trackId: t.id,
        title: t.title,
        durationMs: t.duration_ms,
        artistId: t.releases?.artists?.id ?? "",
        artist: t.releases?.artists?.public_name ?? "",
        artistRegion: t.releases?.artists?.regions?.name ?? null,
        releaseTitle: t.releases?.title ?? "",
        artworkUrl: t.releases?.artwork_url ?? null,
        url: urls.get(t.audio_path!) ?? null,
        // Levelling only. The site trim is applied live by the player so it can change without a refetch.
        gainDb: playbackGainDb({
          targetLufs: settings.loudnessTargetLufs,
          trackLufs: t.lufs == null ? null : Number(t.lufs),
          truePeakDb: t.true_peak == null ? null : Number(t.true_peak),
        }),
      })),
    };
  });

export type PlayerQueue = Awaited<ReturnType<typeof getPlayerQueue>>;
export type PlayerTrack = PlayerQueue["tracks"][number];

/** Every 30 seconds, and at each track start (VEN-5, VEN-6). */
export const heartbeat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        siteId: z.string().uuid(),
        trackStarted: z
          .object({
            trackId: z.string().uuid(),
            playlistVersionId: z.string().uuid().nullable(),
            startedAt: z.string().datetime(),
          })
          .optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { db } = await import("./auth.server");
    await siteAccess(context.userId, data.siteId);
    const sb = await db();
    const now = new Date().toISOString();
    await sb.from("sites").update({ last_heartbeat_at: now }).eq("id", data.siteId);
    if (data.trackStarted) {
      await sb.from("now_playing").upsert(
        {
          site_id: data.siteId,
          track_id: data.trackStarted.trackId,
          playlist_version_id: data.trackStarted.playlistVersionId,
          started_at: data.trackStarted.startedAt,
        },
        { onConflict: "site_id" },
      );
    }
    return { at: now };
  });

/** Stopping the player clears what's playing, so the listener page says so at once. */
export const stopPlayer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ siteId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const { db } = await import("./auth.server");
    await siteAccess(context.userId, data.siteId);
    const sb = await db();
    await sb.from("now_playing").delete().eq("site_id", data.siteId);
    return { ok: true as const };
  });

const eventSchema = z.object({
  id: z.string().uuid(),
  siteId: z.string().uuid(),
  trackId: z.string().uuid(),
  playlistVersionId: z.string().uuid().nullable(),
  startedAt: z.string().datetime(),
  secondsPlayed: z
    .number()
    .min(0)
    .max(24 * 3600),
});

/**
 * Batched play events from the player's offline queue. The player makes the
 * id, so sending the same event twice records one play (PAY-1, PLY-5).
 */
export const recordPlays = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ events: z.array(eventSchema).max(500) }).parse(data))
  .handler(async ({ context, data }) => {
    const { db } = await import("./auth.server");
    if (!data.events.length) return { accepted: [] as string[] };
    for (const siteId of new Set(data.events.map((e) => e.siteId)))
      await siteAccess(context.userId, siteId);
    const sb = await db();
    const { error } = await sb.from("play_events").upsert(
      data.events.map((e) => ({
        id: e.id,
        site_id: e.siteId,
        track_id: e.trackId,
        playlist_version_id: e.playlistVersionId,
        started_at: e.startedAt,
        seconds_played: Math.floor(e.secondsPlayed),
      })),
      { onConflict: "id", ignoreDuplicates: true },
    );
    if (error) throw new Error(error.message);
    return { accepted: data.events.map((e) => e.id) };
  });

export const SKIP_REASONS = ["Doesn't fit tonight", "Wrong energy", "Too loud"] as const;

/** VEN-3: one-tap skip reason. It reaches curators as feedback. */
export const recordSkip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        siteId: z.string().uuid(),
        trackId: z.string().uuid(),
        reason: z.enum(SKIP_REASONS),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { db } = await import("./auth.server");
    await siteAccess(context.userId, data.siteId);
    const sb = await db();
    const { error } = await sb.from("skips").insert({
      site_id: data.siteId,
      track_id: data.trackId,
      reason: data.reason,
      user_id: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/** VEN-3, PLY-2: per-site volume trim, ±6 dB. Levelling stays on underneath. */
export const setTrim = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z.object({ siteId: z.string().uuid(), trimDb: z.number().min(-6).max(6) }).parse(data),
  )
  .handler(async ({ context, data }) => {
    const { db } = await import("./auth.server");
    await siteAccess(context.userId, data.siteId);
    const sb = await db();
    const trim = Math.round(data.trimDb * 2) / 2;
    const { error } = await sb.from("sites").update({ trim_db: trim }).eq("id", data.siteId);
    if (error) throw new Error(error.message);
    return { trimDb: trim };
  });
