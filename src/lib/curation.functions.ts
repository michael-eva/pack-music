import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { valid } from "./admin.functions";

/**
 * Curation (CUR). A person picks every song: filters only narrow the list.
 * A published version is never edited; changes are a new version (CUR-3).
 * Featuring and cover are playlist fields and change without a new version.
 */

const uuid = z.string().uuid();

export const listPlaylists = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireRole, db } = await import("./auth.server");
    const caller = await requireRole(context.userId, "curator");
    const sb = await db();
    const { data: playlists, error } = await sb
      .from("playlists")
      .select(
        "id,name,curated_by,cover_url,is_featured,featured_order,created_at,playlist_versions(id,version,published_at,playlist_tracks(position))",
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return {
      defaultCuratedBy: `${caller.displayName ?? caller.email.split("@")[0]} & The Pack`,
      playlists: (playlists ?? []).map((p) => {
        const latest =
          [...p.playlist_versions]
            .sort((a, b) => b.version - a.version)
            .find((v) => v.published_at) ?? null;
        return {
          id: p.id,
          name: p.name,
          curatedBy: p.curated_by,
          coverUrl: p.cover_url,
          featured: p.is_featured,
          featuredOrder: p.featured_order,
          latestVersion: latest?.version ?? null,
          trackCount: latest?.playlist_tracks.length ?? 0,
          publishedAt: latest?.published_at ?? null,
        };
      }),
    };
  });

export const createPlaylist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    valid(
      z.object({
        name: z.string().trim().min(1, "The playlist needs a name.").max(160),
        curatedBy: z.string().trim().min(1, "Say who curated it.").max(160),
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

/** Name, description, cover and featuring. Doesn't change the running order, so no new version. */
export const updatePlaylistDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    valid(
      z.object({
        id: uuid,
        name: z.string().trim().min(1, "The playlist needs a name.").max(160),
        description: z.string().trim().max(1000),
        coverUrl: z.string().url().max(1000).nullable(),
        featured: z.boolean(),
        featuredOrder: z.number().int().min(0).max(999),
      }),
      d,
    ),
  )
  .handler(async ({ context, data }) => {
    const { requireRole, db, audit } = await import("./auth.server");
    await requireRole(context.userId, "curator");
    const sb = await db();
    if (data.featured) {
      const { data: published } = await sb
        .from("playlist_versions")
        .select("id")
        .eq("playlist_id", data.id)
        .not("published_at", "is", null)
        .limit(1);
      if (!published?.length)
        throw new Error("Publish the playlist before featuring it on the listener home.");
    }
    const { data: before } = await sb
      .from("playlists")
      .select("name,description,cover_url,is_featured,featured_order")
      .eq("id", data.id)
      .single();
    const after = {
      name: data.name,
      description: data.description,
      cover_url: data.coverUrl,
      is_featured: data.featured,
      featured_order: data.featuredOrder,
    };
    const { error } = await sb.from("playlists").update(after).eq("id", data.id);
    if (error) throw new Error(error.message);
    await audit({
      actor: context.userId,
      action: "playlist.details",
      target: data.id,
      before,
      after,
    });
    return { ok: true as const };
  });

/** Only a playlist that was never published can be deleted; published ones keep their history. */
export const deletePlaylist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => valid(z.object({ id: uuid }), d))
  .handler(async ({ context, data }) => {
    const { requireRole, db, audit } = await import("./auth.server");
    await requireRole(context.userId, "curator");
    const sb = await db();
    const { data: published } = await sb
      .from("playlist_versions")
      .select("id")
      .eq("playlist_id", data.id)
      .not("published_at", "is", null)
      .limit(1);
    if (published?.length)
      throw new Error(
        "This playlist has been published, so it can't be deleted. Stop featuring it instead.",
      );
    const { data: before } = await sb.from("playlists").select("name").eq("id", data.id).single();
    const { error } = await sb.from("playlists").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await audit({ actor: context.userId, action: "playlist.delete", target: data.id, before });
    return { ok: true as const };
  });

/** Everything the builder needs in one call: the catalogue of live tracks, versions and exposure. */
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

    const { data: playlist, error } = await sb
      .from("playlists")
      .select(
        "id,name,description,cover_url,curated_by,is_featured,featured_order,playlist_versions(id,version,published_at,playlist_tracks(position,track_id))",
      )
      .eq("id", data.id)
      .single();
    if (error) throw new Error("We couldn't find that playlist.");

    const [
      { data: tracks },
      { data: genres },
      { data: descriptors },
      { data: regions },
      { data: latestVersions },
      { data: liveArtists },
    ] = await Promise.all([
      sb
        .from("tracks")
        .select(
          "id,title,duration_ms,explicit,lufs,true_peak,genre_id,audio_path,track_descriptors(descriptor_id),releases!inner(id,title,state,artwork_url,artists(id,name,region))",
        )
        .eq("releases.state", "live")
        .is("taken_down_at", null)
        .not("audio_path", "is", null),
      sb.from("genres").select("id,label,parent_id").is("retired_at", null),
      sb.from("descriptors").select("id,facet,label").is("retired_at", null),
      sb.from("regions").select("code,name").order("sort_order"),
      sb
        .from("playlist_versions")
        .select("playlist_id,version,published_at,playlist_tracks(track_id)")
        .not("published_at", "is", null),
      sb
        .from("artists")
        .select("id,name,region,releases!inner(state)")
        .eq("releases.state", "live"),
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
        artistName: artist?.name ?? "",
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

    // CUR-5 exposure: slots per live artist across the current version of every published playlist.
    const artistOfTrack = new Map(catalogue.map((t) => [t.id, t.artistId]));
    const latestByPlaylist = new Map<string, { version: number; trackIds: string[] }>();
    for (const v of latestVersions ?? []) {
      const prev = latestByPlaylist.get(v.playlist_id);
      if (!prev || v.version > prev.version)
        latestByPlaylist.set(v.playlist_id, {
          version: v.version,
          trackIds: v.playlist_tracks.map((p) => p.track_id),
        });
    }
    const exposure = new Map<
      string,
      { artistId: string; name: string; region: string | null; slots: number }
    >();
    for (const a of liveArtists ?? [])
      exposure.set(a.id, { artistId: a.id, name: a.name, region: a.region, slots: 0 });
    for (const v of latestByPlaylist.values())
      for (const tid of v.trackIds) {
        const e = exposure.get(artistOfTrack.get(tid) ?? "");
        if (e) e.slots += 1;
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

    return {
      playlist: {
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        coverUrl: playlist.cover_url,
        curatedBy: playlist.curated_by,
        featured: playlist.is_featured,
        featuredOrder: playlist.featured_order,
      },
      versions,
      catalogue,
      genres: genres ?? [],
      descriptors: descriptors ?? [],
      regions: regions ?? [],
      exposure: [...exposure.values()].sort(
        (a, b) => a.slots - b.slots || a.name.localeCompare(b.name),
      ),
      rules: settings.playlistRules,
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

    // Only live, playable tracks can go in.
    const { data: tracks } = await sb
      .from("tracks")
      .select("id,title,duration_ms,explicit,releases!inner(state,artists(id,name))")
      .in("id", data.trackIds)
      .eq("releases.state", "live")
      .is("taken_down_at", null)
      .not("audio_path", "is", null);
    const byId = new Map((tracks ?? []).map((t) => [t.id, t]));
    if (data.trackIds.some((id) => !byId.has(id)))
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
          artistName: t.releases.artists?.name ?? "",
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
