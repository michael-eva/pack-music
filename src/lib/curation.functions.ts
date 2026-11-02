import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/** Validation errors reach the screen, so keep them in plain words. */
function valid<T>(schema: z.ZodType<T, z.ZodTypeDef, unknown>, d: unknown): T {
  const r = schema.safeParse(d);
  if (!r.success) throw new Error(r.error.issues.map((i) => i.message).join(" "));
  return r.data;
}

/**
 * Curation (CUR). A person picks every song: filters only narrow the list.
 * A published version is never edited; changes are a new version, and a site
 * change is a new assignment from a start time (CUR-3).
 */

const uuid = z.string().uuid();

export const listPlaylists = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireRole, db } = await import("./auth.server");
    const caller = await requireRole(context.userId, "curator");
    const sb = await db();
    const [{ data: playlists }, { data: assignments }] = await Promise.all([
      sb
        .from("playlists")
        .select(
          "id,name,curated_by,site_id,created_at,playlist_versions(id,version,published_at,playlist_tracks(position))",
        )
        .is("site_id", null)
        .order("created_at", { ascending: false }),
      sb
        .from("site_assignments")
        .select("site_id,playlist_version_id,starts_at,sites(name)")
        .lte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: false }),
    ]);
    const current = new Map<string, { versionId: string; siteName: string }>();
    for (const a of assignments ?? [])
      if (!current.has(a.site_id))
        current.set(a.site_id, { versionId: a.playlist_version_id, siteName: a.sites?.name ?? "" });
    return {
      defaultCuratedBy: `${caller.displayName ?? caller.email.split("@")[0]} & The Pack`,
      playlists: (playlists ?? []).map((p) => {
        const versions = [...p.playlist_versions].sort((a, b) => b.version - a.version);
        const latest = versions.find((v) => v.published_at) ?? null;
        const versionIds = new Set(versions.map((v) => v.id));
        return {
          id: p.id,
          name: p.name,
          curatedBy: p.curated_by,
          latestVersion: latest?.version ?? null,
          trackCount: latest?.playlist_tracks.length ?? 0,
          publishedAt: latest?.published_at ?? null,
          playingAt: [...current.values()]
            .filter((c) => versionIds.has(c.versionId))
            .map((c) => c.siteName),
        };
      }),
    };
  });

export const createPlaylist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    valid(
      z.object({
        name: z.string().trim().min(1).max(160),
        curatedBy: z.string().trim().min(1).max(160),
      }),
      d,
    ),
  )
  .handler(async ({ context, data }) => {
    const { requireRole, db, audit } = await import("./auth.server");
    await requireRole(context.userId, "curator");
    const sb = await db();
    const { data: row, error } = await sb
      .from("playlists")
      .insert({ name: data.name, curated_by: data.curatedBy, curator_user_id: context.userId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await audit({ actor: context.userId, action: "playlist.create", target: row.id, after: data });
    return { id: row.id };
  });

/** Everything the builder needs in one call: the catalogue of live tracks, versions, sites and exposure. */
export const getBuilder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => valid(z.object({ id: uuid }), d))
  .handler(async ({ context, data }) => {
    const { requireRole, db, getSettings } = await import("./auth.server");
    const { signedAudioUrls } = await import("./audio.server");
    const { playbackGainDb } = await import("./loudness");
    await requireRole(context.userId, "curator");
    const sb = await db();
    const settings = await getSettings();
    const since = new Date(Date.now() - 30 * 86400_000).toISOString();

    const { data: playlist, error } = await sb
      .from("playlists")
      .select(
        "id,name,curated_by,playlist_versions(id,version,published_at,playlist_tracks(position,track_id))",
      )
      .eq("id", data.id)
      .single();
    if (error) throw new Error("We couldn't find that playlist.");

    const [
      { data: tracks },
      { data: genres },
      { data: descriptors },
      { data: regions },
      { data: sites },
      { data: assignments },
      { data: plays },
      { data: allVersions },
      { data: skips },
    ] = await Promise.all([
      sb
        .from("tracks")
        .select(
          "id,title,duration_ms,explicit,lufs,true_peak,genre_id,audio_path,taken_down_at,flagged_at,track_descriptors(descriptor_id),releases!inner(id,title,state,artwork_url,artists(id,public_name,region))",
        )
        .eq("releases.state", "live")
        .is("taken_down_at", null)
        .is("flagged_at", null),
      sb.from("genres").select("id,label,parent_id").is("retired_at", null),
      sb.from("descriptors").select("id,facet,label").is("retired_at", null),
      sb.from("regions").select("code,name").order("sort_order"),
      sb.from("sites").select("id,name,region,explicit_allowed").order("name"),
      sb
        .from("site_assignments")
        .select("site_id,playlist_version_id,starts_at")
        .lte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: false }),
      sb.from("play_events").select("track_id,seconds_played").gte("started_at", since),
      sb
        .from("playlist_versions")
        .select("id,published_at,playlist_tracks(track_id)")
        .not("published_at", "is", null)
        .gte("published_at", since),
      sb.from("skips").select("track_id,reason").gte("created_at", since),
    ]);

    const urls = await signedAudioUrls((tracks ?? []).map((t) => t.audio_path ?? ""));
    const genreById = new Map((genres ?? []).map((g) => [g.id, g]));
    const catalogue = (tracks ?? []).map((t) => {
      const g = t.genre_id ? genreById.get(t.genre_id) : null;
      const artist = t.releases.artists;
      return {
        id: t.id,
        title: t.title,
        releaseTitle: t.releases.title,
        artworkUrl: t.releases.artwork_url,
        artistId: artist?.id ?? "",
        artistName: artist?.public_name ?? "",
        region: artist?.region ?? null,
        durationMs: t.duration_ms,
        explicit: t.explicit,
        lufs: t.lufs == null ? null : Number(t.lufs),
        genreId: t.genre_id,
        parentGenreId: g?.parent_id ?? g?.id ?? null,
        genreLabel: g
          ? g.parent_id
            ? `${genreById.get(g.parent_id)?.label ?? ""}, ${g.label}`
            : g.label
          : null,
        descriptorIds: t.track_descriptors.map((d) => d.descriptor_id),
        audioUrl: t.audio_path ? (urls.get(t.audio_path) ?? null) : null,
        gainDb: playbackGainDb({
          targetLufs: settings.loudnessTargetLufs,
          trackLufs: t.lufs == null ? null : Number(t.lufs),
          truePeakDb: t.true_peak == null ? null : Number(t.true_peak),
        }),
      };
    });

    // CUR-5 exposure: slots in versions published in the last 30 days, and qualified plays, per live artist.
    const artistOfTrack = new Map(catalogue.map((t) => [t.id, t.artistId]));
    const { data: liveArtists } = await sb
      .from("artists")
      .select("id,public_name,region,releases!inner(state)")
      .eq("releases.state", "live");
    const exposure = new Map<
      string,
      { artistId: string; name: string; region: string | null; slots: number; plays: number }
    >();
    for (const a of liveArtists ?? [])
      exposure.set(a.id, {
        artistId: a.id,
        name: a.public_name,
        region: a.region,
        slots: 0,
        plays: 0,
      });
    for (const v of allVersions ?? [])
      for (const pt of v.playlist_tracks) {
        const e = exposure.get(artistOfTrack.get(pt.track_id) ?? "");
        if (e) e.slots += 1;
      }
    for (const p of plays ?? []) {
      if (p.seconds_played < settings.playThresholdSeconds) continue;
      const e = exposure.get(artistOfTrack.get(p.track_id) ?? "");
      if (e) e.plays += 1;
    }

    const versions = [...playlist.playlist_versions]
      .sort((a, b) => b.version - a.version)
      .map((v) => ({
        id: v.id,
        version: v.version,
        publishedAt: v.published_at,
        trackIds: [...v.playlist_tracks]
          .sort((a, b) => a.position - b.position)
          .map((pt) => pt.track_id),
      }));
    const versionIds = new Set(versions.map((v) => v.id));
    const currentBySite = new Map<string, string>();
    for (const a of assignments ?? [])
      if (!currentBySite.has(a.site_id)) currentBySite.set(a.site_id, a.playlist_version_id);

    const skipFeedback: Record<string, Record<string, number>> = {};
    for (const s of skips ?? []) {
      skipFeedback[s.track_id] ??= {};
      skipFeedback[s.track_id]![s.reason] = (skipFeedback[s.track_id]![s.reason] ?? 0) + 1;
    }

    return {
      playlist: { id: playlist.id, name: playlist.name, curatedBy: playlist.curated_by },
      versions,
      catalogue,
      genres: genres ?? [],
      descriptors: descriptors ?? [],
      regions: regions ?? [],
      sites: (sites ?? []).map((s) => {
        const current = currentBySite.get(s.id);
        return {
          ...s,
          currentVersion:
            current && versionIds.has(current)
              ? (versions.find((v) => v.id === current)?.version ?? null)
              : null,
          playingOther: !!current && !versionIds.has(current),
        };
      }),
      exposure: [...exposure.values()].sort(
        (a, b) => a.slots - b.slots || a.name.localeCompare(b.name),
      ),
      rules: settings.playlistRules,
      skipFeedback,
    };
  });

export const publishVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    valid(
      z.object({
        playlistId: uuid,
        curatedBy: z
          .string()
          .trim()
          .min(1, "A playlist needs a named curator before it can be published.")
          .max(160),
        trackIds: z.array(uuid).min(1, "Add at least one song.").max(500),
        acknowledgeBreaks: z.boolean().default(false),
      }),
      d,
    ),
  )
  .handler(async ({ context, data }) => {
    const { requireRole, db, audit, getSettings } = await import("./auth.server");
    const { checkPlaylist } = await import("./playlist-rules");
    await requireRole(context.userId, "curator");
    const sb = await db();
    const settings = await getSettings();

    // Only live, playable tracks can go in (CAT-8, RTS-4, RTS-6).
    const { data: tracks } = await sb
      .from("tracks")
      .select("id,title,duration_ms,explicit,releases!inner(state,artists(id,public_name))")
      .in("id", data.trackIds)
      .eq("releases.state", "live")
      .is("taken_down_at", null)
      .is("flagged_at", null);
    const byId = new Map((tracks ?? []).map((t) => [t.id, t]));
    const missing = data.trackIds.filter((id) => !byId.has(id));
    if (missing.length)
      throw new Error(
        "Some songs are no longer live and can't be added. Remove them and try again.",
      );

    const issues = checkPlaylist(
      data.trackIds.map((id) => {
        const t = byId.get(id)!;
        return {
          id,
          title: t.title,
          artistId: t.releases.artists?.id ?? "",
          artistName: t.releases.artists?.public_name ?? "",
          durationMs: t.duration_ms,
          explicit: t.explicit,
        };
      }),
      settings.playlistRules,
    );
    const breaks = issues.filter((i) => i.severity === "break");
    if (breaks.length && !data.acknowledgeBreaks)
      throw new Error(`Rule breaks: ${breaks.map((b) => b.message).join(" ")}`);

    const { data: last } = await sb
      .from("playlist_versions")
      .select("version")
      .eq("playlist_id", data.playlistId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    const version = (last?.version ?? 0) + 1;
    const { data: row, error } = await sb
      .from("playlist_versions")
      .insert({
        playlist_id: data.playlistId,
        version,
        published_at: new Date().toISOString(),
        published_by: context.userId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    const { error: tracksError } = await sb.from("playlist_tracks").insert(
      data.trackIds.map((track_id, i) => ({
        playlist_version_id: row.id,
        position: i + 1,
        track_id,
      })),
    );
    if (tracksError) throw new Error(tracksError.message);
    await sb.from("playlists").update({ curated_by: data.curatedBy }).eq("id", data.playlistId);
    await audit({
      actor: context.userId,
      action: "playlist.publish",
      target: data.playlistId,
      after: {
        version,
        tracks: data.trackIds.length,
        curatedBy: data.curatedBy,
        acknowledgedBreaks: breaks.map((b) => b.message),
      },
    });
    return { versionId: row.id, version };
  });

/** CUR-3: assigning (or rolling back to) a version is a new assignment from now. */
export const assignVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    valid(z.object({ versionId: uuid, siteIds: z.array(uuid).min(1).max(200) }), d),
  )
  .handler(async ({ context, data }) => {
    const { requireRole, db, audit } = await import("./auth.server");
    await requireRole(context.userId, "curator");
    const sb = await db();
    const { data: version } = await sb
      .from("playlist_versions")
      .select("id,version,published_at,playlist_id")
      .eq("id", data.versionId)
      .single();
    if (!version?.published_at) throw new Error("Only a published version can be assigned.");
    const startsAt = new Date().toISOString();
    const { error } = await sb.from("site_assignments").insert(
      data.siteIds.map((site_id) => ({
        site_id,
        playlist_version_id: data.versionId,
        starts_at: startsAt,
        assigned_by: context.userId,
      })),
    );
    if (error) throw new Error(error.message);
    await audit({
      actor: context.userId,
      action: "playlist.assign",
      target: version.playlist_id,
      after: { version: version.version, sites: data.siteIds },
    });
    return { ok: true as const };
  });
