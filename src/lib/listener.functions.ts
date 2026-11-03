import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * The listener app. Every function needs a signed-in listener (curators and
 * admins pass too). Only live releases and tracks that haven't been taken down
 * are ever returned or playable. Responses carry public catalogue fields only:
 * never another person's email or account id.
 */

export type ListenTrack = {
  id: string;
  title: string;
  durationMs: number;
  explicit: boolean;
  artistId: string;
  artist: string;
  artistRegion: string | null;
  releaseId: string;
  releaseTitle: string;
  artworkUrl: string | null;
};

export type PlaylistCard = {
  id: string;
  name: string;
  description: string;
  coverUrl: string | null;
  curatedBy: string;
  trackCount: number;
};

export type ReleaseCard = {
  id: string;
  title: string;
  type: "single" | "ep" | "album";
  artworkUrl: string | null;
  artistId: string;
  artist: string;
  year: number | null;
};

const id = z.string().uuid();

const TRACK_SELECT =
  "id,title,duration_ms,explicit,position,genre_id,releases!inner(id,title,artwork_url,state,artists!inner(id,name,region,regions(name)))";

type TrackRow = {
  id: string;
  title: string;
  duration_ms: number;
  explicit: boolean;
  position: number;
  genre_id: string | null;
  releases: {
    id: string;
    title: string;
    artwork_url: string | null;
    state: string;
    artists: { id: string; name: string; region: string | null; regions: { name: string } | null };
  };
};

function toTrack(t: TrackRow): ListenTrack {
  return {
    id: t.id,
    title: t.title,
    durationMs: t.duration_ms,
    explicit: t.explicit,
    artistId: t.releases.artists.id,
    artist: t.releases.artists.name,
    artistRegion: t.releases.artists.regions?.name ?? null,
    releaseId: t.releases.id,
    releaseTitle: t.releases.title,
    artworkUrl: t.releases.artwork_url,
  };
}

async function listenerDb(userId: string) {
  const { db, requireRole } = await import("./auth.server");
  await requireRole(userId, "listener", "curator");
  return db();
}

type Sb = Awaited<ReturnType<typeof listenerDb>>;

/** Playable tracks by id, in no particular order. */
async function playableTracks(sb: Sb, ids: string[]): Promise<Map<string, ListenTrack>> {
  if (!ids.length) return new Map();
  const { data, error } = await sb
    .from("tracks")
    .select(TRACK_SELECT)
    .in("id", [...new Set(ids)])
    .is("taken_down_at", null)
    .eq("releases.state", "live");
  if (error) throw new Error(error.message);
  return new Map(((data ?? []) as unknown as TrackRow[]).map((t) => [t.id, toTrack(t)]));
}

/** The latest published version of each playlist, with its ordered track ids. */
async function latestVersions(sb: Sb, playlistIds: string[]) {
  const out = new Map<string, { versionId: string; trackIds: string[] }>();
  if (!playlistIds.length) return out;
  const { data: versions, error } = await sb
    .from("playlist_versions")
    .select("id,playlist_id,version")
    .in("playlist_id", playlistIds)
    .not("published_at", "is", null)
    .order("version", { ascending: false });
  if (error) throw new Error(error.message);
  for (const v of versions ?? []) {
    if (!out.has(v.playlist_id)) out.set(v.playlist_id, { versionId: v.id, trackIds: [] });
  }
  const versionIds = [...out.values()].map((v) => v.versionId);
  if (versionIds.length) {
    const { data: rows } = await sb
      .from("playlist_tracks")
      .select("playlist_version_id,position,track_id")
      .in("playlist_version_id", versionIds)
      .order("position");
    const byVersion = new Map([...out.values()].map((v) => [v.versionId, v]));
    for (const r of rows ?? []) byVersion.get(r.playlist_version_id)?.trackIds.push(r.track_id);
  }
  return out;
}

async function playlistCards(
  sb: Sb,
  rows: {
    id: string;
    name: string;
    description: string;
    cover_url: string | null;
    curated_by: string;
  }[],
): Promise<PlaylistCard[]> {
  const versions = await latestVersions(
    sb,
    rows.map((r) => r.id),
  );
  const allIds = [...versions.values()].flatMap((v) => v.trackIds);
  const playable = await playableTracks(sb, allIds);
  return rows
    .filter((r) => versions.has(r.id))
    .map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      coverUrl: r.cover_url,
      curatedBy: r.curated_by,
      trackCount: versions.get(r.id)!.trackIds.filter((t) => playable.has(t)).length,
    }));
}

function releaseCard(r: {
  id: string;
  title: string;
  type: "single" | "ep" | "album";
  artwork_url: string | null;
  original_release_date: string | null;
  published_at: string | null;
  artists: { id: string; name: string } | null;
}): ReleaseCard {
  const date = r.original_release_date ?? r.published_at;
  return {
    id: r.id,
    title: r.title,
    type: r.type,
    artworkUrl: r.artwork_url,
    artistId: r.artists?.id ?? "",
    artist: r.artists?.name ?? "",
    year: date ? new Date(date).getFullYear() : null,
  };
}

const RELEASE_SELECT =
  "id,title,type,artwork_url,original_release_date,published_at,artists(id,name)";

/** Home: featured playlists in the curators' order, newest releases, artists by region. */
export const getHome = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = await listenerDb(context.userId);
    const [{ data: featured }, { data: releases }, { data: artists }] = await Promise.all([
      sb
        .from("playlists")
        .select("id,name,description,cover_url,curated_by")
        .eq("is_featured", true)
        .order("featured_order"),
      sb
        .from("releases")
        .select(RELEASE_SELECT)
        .eq("state", "live")
        .order("published_at", { ascending: false })
        .limit(12),
      sb
        .from("artists")
        .select(
          "id,name,photo_url,region,regions(name,sort_order),releases!inner(state,artwork_url)",
        )
        .eq("releases.state", "live")
        .order("name"),
    ]);

    const byRegion = new Map<
      string,
      {
        region: string;
        order: number;
        artists: { id: string; name: string; imageUrl: string | null }[];
      }
    >();
    for (const a of artists ?? []) {
      const key = a.region ?? "elsewhere";
      if (!byRegion.has(key))
        byRegion.set(key, {
          region: a.regions?.name ?? "Elsewhere",
          order: a.regions?.sort_order ?? 999,
          artists: [],
        });
      byRegion.get(key)!.artists.push({
        id: a.id,
        name: a.name,
        imageUrl: a.photo_url ?? a.releases[0]?.artwork_url ?? null,
      });
    }

    return {
      featured: await playlistCards(sb, featured ?? []),
      newReleases: (releases ?? []).map(releaseCard),
      regions: [...byRegion.values()].sort((a, b) => a.order - b.order),
    };
  });

export const getPlaylist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ id }).parse(data))
  .handler(async ({ context, data }) => {
    const sb = await listenerDb(context.userId);
    const { data: p } = await sb
      .from("playlists")
      .select("id,name,description,cover_url,curated_by")
      .eq("id", data.id)
      .maybeSingle();
    const version = p ? (await latestVersions(sb, [p.id])).get(p.id) : undefined;
    if (!p || !version) throw new Error("This playlist isn't available.");
    const playable = await playableTracks(sb, version.trackIds);
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      coverUrl: p.cover_url,
      curatedBy: p.curated_by,
      tracks: version.trackIds.map((t) => playable.get(t)).filter((t): t is ListenTrack => !!t),
    };
  });

export const getRelease = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ id }).parse(data))
  .handler(async ({ context, data }) => {
    const sb = await listenerDb(context.userId);
    const { data: r } = await sb
      .from("releases")
      .select(`${RELEASE_SELECT},label,p_line`)
      .eq("id", data.id)
      .eq("state", "live")
      .maybeSingle();
    if (!r) throw new Error("This release isn't available.");
    const { data: rows } = await sb
      .from("tracks")
      .select(TRACK_SELECT)
      .eq("release_id", r.id)
      .is("taken_down_at", null)
      .eq("releases.state", "live")
      .order("position");
    return {
      ...releaseCard(r),
      pLine: r.p_line,
      tracks: ((rows ?? []) as unknown as TrackRow[]).map(toTrack),
    };
  });

export const getArtist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ id }).parse(data))
  .handler(async ({ context, data }) => {
    const sb = await listenerDb(context.userId);
    const { data: a } = await sb
      .from("artists")
      .select("id,name,bio,links,photo_url,creator_id_url,regions(name)")
      .eq("id", data.id)
      .maybeSingle();
    if (!a) throw new Error("We couldn't find this artist.");
    const [{ data: releases }, { data: rows }] = await Promise.all([
      sb
        .from("releases")
        .select(RELEASE_SELECT)
        .eq("artist_id", a.id)
        .eq("state", "live")
        .order("original_release_date", { ascending: false, nullsFirst: false }),
      sb
        .from("tracks")
        .select(TRACK_SELECT)
        .eq("releases.artist_id", a.id)
        .eq("releases.state", "live")
        .is("taken_down_at", null)
        .order("release_id")
        .order("position"),
    ]);
    const cards = (releases ?? []).map(releaseCard);
    return {
      id: a.id,
      name: a.name,
      bio: a.bio,
      links: a.links
        .split(/[\s,]+/)
        .map((l) => l.trim())
        .filter(Boolean),
      photoUrl: a.photo_url ?? cards[0]?.artworkUrl ?? null,
      creatorIdUrl: a.creator_id_url,
      region: a.regions?.name ?? null,
      releases: cards,
      tracks: ((rows ?? []) as unknown as TrackRow[]).map(toTrack),
    };
  });

/** Genres and regions for the search filters. */
export const getSearchFilters = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = await listenerDb(context.userId);
    const [{ data: genres }, { data: regions }] = await Promise.all([
      sb.from("genres").select("id,label,parent_id").is("retired_at", null).order("label"),
      sb.from("regions").select("code,name").order("sort_order"),
    ]);
    return { genres: genres ?? [], regions: regions ?? [] };
  });

/** Plain text search over songs, artists, releases and playlists. Results are alphabetical, never ranked. */
export const search = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        q: z.string().trim().max(100).default(""),
        genre: z.string().max(60).optional(),
        region: z.string().max(60).optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const sb = await listenerDb(context.userId);
    const term = data.q.replace(/[%_,()]/g, " ").trim();
    if (!term && !data.genre && !data.region) {
      return { tracks: [], artists: [], releases: [], playlists: [] };
    }
    const like = `%${term}%`;

    let genreIds: string[] | null = null;
    if (data.genre) {
      const { data: g } = await sb
        .from("genres")
        .select("id")
        .or(`id.eq.${data.genre},parent_id.eq.${data.genre}`);
      genreIds = (g ?? []).map((x) => x.id);
    }

    let tracksQ = sb
      .from("tracks")
      .select(TRACK_SELECT)
      .is("taken_down_at", null)
      .eq("releases.state", "live")
      .order("title")
      .limit(40);
    if (term) tracksQ = tracksQ.ilike("title", like);
    if (genreIds) tracksQ = tracksQ.in("genre_id", genreIds.length ? genreIds : ["-"]);
    if (data.region) tracksQ = tracksQ.eq("releases.artists.region", data.region);

    let artistsQ = sb
      .from("artists")
      .select("id,name,photo_url,regions(name),releases!inner(state,artwork_url)")
      .eq("releases.state", "live")
      .order("name")
      .limit(20);
    if (term) artistsQ = artistsQ.ilike("name", like);
    if (data.region) artistsQ = artistsQ.eq("region", data.region);

    let releasesQ = sb
      .from("releases")
      .select(
        "id,title,type,artwork_url,original_release_date,published_at,artists!inner(id,name,region)",
      )
      .eq("state", "live")
      .order("title")
      .limit(20);
    if (term) releasesQ = releasesQ.ilike("title", like);
    if (data.region) releasesQ = releasesQ.eq("artists.region", data.region);

    const playlistsQ = term
      ? sb
          .from("playlists")
          .select("id,name,description,cover_url,curated_by")
          .ilike("name", like)
          .order("name")
          .limit(20)
      : null;

    const [tracks, artists, releases, playlists] = await Promise.all([
      tracksQ,
      genreIds ? Promise.resolve({ data: [] }) : artistsQ,
      genreIds ? Promise.resolve({ data: [] }) : releasesQ,
      playlistsQ && !data.region && !genreIds ? playlistsQ : Promise.resolve({ data: [] }),
    ]);

    return {
      tracks: ((tracks.data ?? []) as unknown as TrackRow[]).map(toTrack),
      artists: (
        (artists.data ?? []) as {
          id: string;
          name: string;
          photo_url: string | null;
          regions: { name: string } | null;
          releases: { artwork_url: string | null }[];
        }[]
      ).map((a) => ({
        id: a.id,
        name: a.name,
        region: a.regions?.name ?? null,
        imageUrl: a.photo_url ?? a.releases[0]?.artwork_url ?? null,
      })),
      releases: ((releases.data ?? []) as Parameters<typeof releaseCard>[0][]).map(releaseCard),
      playlists: await playlistCards(
        sb,
        (playlists.data ?? []) as {
          id: string;
          name: string;
          description: string;
          cover_url: string | null;
          curated_by: string;
        }[],
      ),
    };
  });

/**
 * Signed audio links plus the levelling gain for each track (PLY-3). Only
 * playable tracks get a link. Links last three hours; the player refreshes after two.
 */
export const getTrackSources = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ trackIds: z.array(id).min(1).max(200) }).parse(data))
  .handler(async ({ context, data }) => {
    const sb = await listenerDb(context.userId);
    const { getSettings } = await import("./auth.server");
    const { signedAudioUrls } = await import("./audio.server");
    const { playbackGainDb } = await import("./loudness");
    const [{ data: rows, error }, settings] = await Promise.all([
      sb
        .from("tracks")
        .select("id,audio_path,lufs,true_peak,releases!inner(state)")
        .in("id", data.trackIds)
        .is("taken_down_at", null)
        .eq("releases.state", "live"),
      getSettings(),
    ]);
    if (error) throw new Error(error.message);
    const urls = await signedAudioUrls((rows ?? []).map((r) => r.audio_path ?? ""));
    return (rows ?? [])
      .filter((r) => r.audio_path && urls.has(r.audio_path))
      .map((r) => ({
        trackId: r.id,
        url: urls.get(r.audio_path!)!,
        gainDb: playbackGainDb({
          targetLufs: Number(settings.loudnessTargetLufs ?? -14),
          trackLufs: r.lufs == null ? null : Number(r.lufs),
          truePeakDb: r.true_peak == null ? null : Number(r.true_peak),
        }),
      }));
  });

// ---------------------------------------------------------------------------
// Saves: a listener's own library. Nobody else ever sees whose list it is (LIS-7).
// ---------------------------------------------------------------------------

export const listSaves = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = await listenerDb(context.userId);
    const { data } = await sb
      .from("saves")
      .select("track_id,saved_at")
      .eq("user_id", context.userId)
      .order("saved_at", { ascending: false });
    const playable = await playableTracks(
      sb,
      (data ?? []).map((s) => s.track_id),
    );
    return (data ?? [])
      .map((s) => {
        const track = playable.get(s.track_id);
        return track ? { ...track, savedAt: s.saved_at } : null;
      })
      .filter((t): t is ListenTrack & { savedAt: string } => !!t);
  });

export const savedIds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = await listenerDb(context.userId);
    const { data } = await sb.from("saves").select("track_id").eq("user_id", context.userId);
    return (data ?? []).map((s) => s.track_id);
  });

export const saveTrack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ trackId: id }).parse(data))
  .handler(async ({ context, data }) => {
    const sb = await listenerDb(context.userId);
    const playable = await playableTracks(sb, [data.trackId]);
    if (!playable.has(data.trackId)) throw new Error("This song isn't available.");
    const { error } = await sb
      .from("saves")
      .upsert(
        { user_id: context.userId, track_id: data.trackId },
        { onConflict: "user_id,track_id", ignoreDuplicates: true },
      );
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const removeSave = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ trackId: id }).parse(data))
  .handler(async ({ context, data }) => {
    const sb = await listenerDb(context.userId);
    await sb.from("saves").delete().eq("user_id", context.userId).eq("track_id", data.trackId);
    return { ok: true as const };
  });
