import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Listener pages (A1 to A3) and saves (LIS-3, LIS-4).
 * Public functions return public fields only: never a listener, an email or
 * an artist's legal name (LIS-7, ART-1).
 */

const ON_AIR_WINDOW_MS = 2 * 60 * 1000;
const code = z.string().trim().min(1).max(40);

type PublicTrack = {
  trackId: string;
  title: string;
  artistId: string;
  artist: string;
  artistRegion: string | null;
  artworkUrl: string | null;
};

async function loadSite(shortCode: string) {
  const { db } = await import("./auth.server");
  const sb = await db();
  const { data: site } = await sb
    .from("sites")
    .select(
      "id,name,business_type,opening_hours,vibe,short_code,last_heartbeat_at,regions(name),businesses(name)",
    )
    .eq("short_code", shortCode.toLowerCase())
    .maybeSingle();
  return { sb, site };
}

const TRACK_PUBLIC = "id,title,releases(artwork_url,artists(id,public_name,regions(name)))";

function toPublic(t: {
  id: string;
  title: string;
  releases: {
    artwork_url: string | null;
    artists: { id: string; public_name: string; regions: { name: string } | null } | null;
  } | null;
}): PublicTrack {
  return {
    trackId: t.id,
    title: t.title,
    artistId: t.releases?.artists?.id ?? "",
    artist: t.releases?.artists?.public_name ?? "",
    artistRegion: t.releases?.artists?.regions?.name ?? null,
    artworkUrl: t.releases?.artwork_url ?? null,
  };
}

/** A1, polled every few seconds: what's on now at a site, or what played recently (LIS-1, VEN-6). */
export const getNowPlaying = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({ code }).parse(data))
  .handler(async ({ data }) => {
    const { sb, site } = await loadSite(data.code);
    if (!site) return { found: false as const };

    const onAirSince = Date.now() - ON_AIR_WINDOW_MS;
    const heartbeating =
      !!site.last_heartbeat_at && new Date(site.last_heartbeat_at).getTime() > onAirSince;
    const { data: np } = await sb
      .from("now_playing")
      .select(`started_at,tracks(${TRACK_PUBLIC}),playlist_versions(playlists(curated_by))`)
      .eq("site_id", site.id)
      .maybeSingle();

    const current =
      heartbeating && np?.tracks
        ? { ...toPublic(np.tracks), curatedBy: np.playlist_versions?.playlists?.curated_by ?? null }
        : null;

    // Recent plays: the last five distinct tracks.
    const { data: plays } = await sb
      .from("play_events")
      .select(`started_at,tracks(${TRACK_PUBLIC})`)
      .eq("site_id", site.id)
      .order("started_at", { ascending: false })
      .limit(50);
    const recent: (PublicTrack & { playedAt: string })[] = [];
    for (const p of plays ?? []) {
      if (
        !p.tracks ||
        recent.some((r) => r.trackId === p.tracks!.id) ||
        p.tracks.id === current?.trackId
      )
        continue;
      recent.push({ ...toPublic(p.tracks), playedAt: p.started_at });
      if (recent.length === 5) break;
    }

    return {
      found: true as const,
      site: {
        code: site.short_code,
        name: site.businesses?.name ?? site.name,
        type: site.business_type,
        region: site.regions?.name ?? null,
      },
      onAir: !!current,
      current,
      recent,
    };
  });

/** A3: a business's own page (LIS-5). Recent artists by name only, never who visited. */
export const getPlace = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({ code }).parse(data))
  .handler(async ({ data }) => {
    const { sb, site } = await loadSite(data.code);
    if (!site) return { found: false as const };
    const { data: plays } = await sb
      .from("play_events")
      .select("tracks(releases(artists(id,public_name,regions(name))))")
      .eq("site_id", site.id)
      .order("started_at", { ascending: false })
      .limit(500);
    const artists: { id: string; name: string; region: string | null }[] = [];
    for (const p of plays ?? []) {
      const a = p.tracks?.releases?.artists;
      if (!a || artists.some((x) => x.id === a.id)) continue;
      artists.push({ id: a.id, name: a.public_name, region: a.regions?.name ?? null });
      if (artists.length === 10) break;
    }
    return {
      found: true as const,
      site: {
        code: site.short_code,
        name: site.businesses?.name ?? site.name,
        type: site.business_type,
        region: site.regions?.name ?? null,
        openingHours: site.opening_hours,
        vibe: site.vibe,
      },
      recentArtists: artists,
    };
  });

/** A2: public artist page. Live releases only, track details only, no audio (LIS-2). */
export const getArtistPage = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({ artistId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { db } = await import("./auth.server");
    const sb = await db();
    const { data: artist } = await sb
      .from("artists")
      .select("id,public_name,bio,links,photo_url,creator_id_url,regions(name)")
      .eq("id", data.artistId)
      .maybeSingle();
    if (!artist) return { found: false as const };
    const { data: releases } = await sb
      .from("releases")
      .select("id,title,type,artwork_url,tracks(id,title,position,duration_ms,taken_down_at)")
      .eq("artist_id", artist.id)
      .eq("state", "live")
      .order("created_at", { ascending: false });
    return {
      found: true as const,
      artist: {
        id: artist.id,
        name: artist.public_name,
        bio: artist.bio,
        links: artist.links,
        photoUrl: artist.photo_url,
        creatorIdUrl: artist.creator_id_url,
        region: artist.regions?.name ?? null,
      },
      releases: (releases ?? []).map((r) => ({
        id: r.id,
        title: r.title,
        type: r.type,
        artworkUrl: r.artwork_url,
        tracks: (r.tracks ?? [])
          .filter((t) => !t.taken_down_at)
          .sort((a, b) => a.position - b.position)
          .map((t) => ({ id: t.id, title: t.title, durationMs: t.duration_ms })),
      })),
    };
  });

/** LIS-3: save a song, tagged with where it was heard. */
export const saveTrack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z.object({ trackId: z.string().uuid(), code: code.optional() }).parse(data),
  )
  .handler(async ({ context, data }) => {
    const { db } = await import("./auth.server");
    const sb = await db();
    await ensureListener(context.userId, String(context.claims.email ?? ""));
    const { data: track } = await sb
      .from("tracks")
      .select("id")
      .eq("id", data.trackId)
      .maybeSingle();
    if (!track) throw new Error("We couldn't find that song.");
    let siteId: string | null = null;
    if (data.code) {
      const { data: site } = await sb
        .from("sites")
        .select("id")
        .eq("short_code", data.code.toLowerCase())
        .maybeSingle();
      siteId = site?.id ?? null;
    }
    const { error } = await sb
      .from("saves")
      .upsert(
        { user_id: context.userId, track_id: data.trackId, site_id: siteId },
        { onConflict: "user_id,track_id", ignoreDuplicates: true },
      );
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/** Saving is the first thing a new listener does, so make sure their profile exists (LIS-6). */
async function ensureListener(userId: string, email: string) {
  const { db } = await import("./auth.server");
  const sb = await db();
  const { data } = await sb.from("profiles").select("user_id").eq("user_id", userId).maybeSingle();
  if (data) return;
  await sb.from("profiles").insert({ user_id: userId, email: email.toLowerCase() });
  await sb
    .from("user_roles")
    .upsert({ user_id: userId, role: "listener" }, { onConflict: "user_id,role" });
}

/** LIS-4: "Heard somewhere real". Only ever the caller's own saves. */
export const listSaves = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { db } = await import("./auth.server");
    const sb = await db();
    const { data, error } = await sb
      .from("saves")
      .select(`saved_at,tracks(${TRACK_PUBLIC}),sites(name,short_code,businesses(name))`)
      .eq("user_id", context.userId)
      .order("saved_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? [])
      .filter((s) => s.tracks)
      .map((s) => ({
        ...toPublic(s.tracks!),
        savedAt: s.saved_at,
        place: s.sites
          ? { name: s.sites.businesses?.name ?? s.sites.name, code: s.sites.short_code }
          : null,
      }));
  });

export const removeSave = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ trackId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const { db } = await import("./auth.server");
    const sb = await db();
    await sb.from("saves").delete().eq("user_id", context.userId).eq("track_id", data.trackId);
    return { ok: true as const };
  });

/** Which of these tracks the caller has already saved, so the button can say "Saved". */
export const savedState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ trackId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const { db } = await import("./auth.server");
    const sb = await db();
    const { data: row } = await sb
      .from("saves")
      .select("saved_at,sites(name,businesses(name))")
      .eq("user_id", context.userId)
      .eq("track_id", data.trackId)
      .maybeSingle();
    return row
      ? {
          savedAt: row.saved_at,
          place: row.sites ? (row.sites.businesses?.name ?? row.sites.name) : null,
        }
      : null;
  });
