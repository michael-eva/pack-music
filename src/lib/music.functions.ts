import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { valid } from "./admin.functions";
import { isValidIsrc, isValidUpc, normaliseIsrc } from "./identifiers";

/**
 * The catalogue, managed by admins (curators can read it and tag tracks).
 * Stands in for MetaGen package ingestion until a sample package exists.
 */

const uuid = z.string().uuid();
type Sb = Awaited<ReturnType<typeof import("./auth.server").db>>;

function friendlyDbError(message: string) {
  if (message.includes("releases_upc_key")) return "That UPC is already on another release.";
  if (message.includes("tracks_isrc_key")) return "One of these ISRCs is already on another track.";
  if (message.includes("playlist_tracks"))
    return "That song is in a playlist, so it can't be deleted. Take it down instead.";
  return message;
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export const getMusicOptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireRole, db } = await import("./auth.server");
    await requireRole(context.userId, "curator");
    const sb = await db();
    const [{ data: regions }, { data: genres }, { data: descriptors }, { data: artists }] =
      await Promise.all([
        sb.from("regions").select("code,name").order("sort_order"),
        sb.from("genres").select("id,label,parent_id").is("retired_at", null).order("label"),
        sb.from("descriptors").select("id,facet,label").is("retired_at", null),
        sb.from("artists").select("id,name").order("name"),
      ]);
    return {
      regions: regions ?? [],
      genres: genres ?? [],
      descriptors: descriptors ?? [],
      artists: artists ?? [],
    };
  });

export const getCatalogue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireRole, db } = await import("./auth.server");
    await requireRole(context.userId, "curator");
    const sb = await db();
    const { data, error } = await sb
      .from("artists")
      .select(
        "id,name,region,photo_url,releases(id,title,type,state,artwork_url,created_at,tracks(id,title,taken_down_at))",
      )
      .order("name");
    if (error) throw new Error(error.message);
    return (data ?? []).map((a) => ({
      ...a,
      releases: [...a.releases].sort((x, y) => y.created_at.localeCompare(x.created_at)),
    }));
  });

export const getArtist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => valid(z.object({ id: uuid }), d))
  .handler(async ({ context, data }) => {
    const { requireRole, db } = await import("./auth.server");
    await requireRole(context.userId, "curator");
    const sb = await db();
    const { data: artist, error } = await sb
      .from("artists")
      .select("id,name,region,bio,links,photo_url,creator_id_url,releases(id,title,type,state)")
      .eq("id", data.id)
      .single();
    if (error) throw new Error("We couldn't find that artist.");
    return artist;
  });

export const getRelease = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => valid(z.object({ id: uuid }), d))
  .handler(async ({ context, data }) => {
    const { requireRole, db, getSettings } = await import("./auth.server");
    const { signedAudioUrls } = await import("./audio.server");
    const { playbackGainDb } = await import("./loudness");
    await requireRole(context.userId, "curator");
    const sb = await db();
    const { data: release, error } = await sb
      .from("releases")
      .select(
        "id,artist_id,title,type,upc,label,p_line,original_release_date,artwork_url,state,published_at,tracks(id,position,title,isrc,duration_ms,audio_path,explicit,genre_id,ai_declaration,lufs,true_peak,lra,story,taken_down_at,track_descriptors(descriptor_id))",
      )
      .eq("id", data.id)
      .single();
    if (error) throw new Error("We couldn't find that release.");
    const settings = await getSettings();
    const urls = await signedAudioUrls(release.tracks.map((t) => t.audio_path ?? ""));
    const { data: inPlaylists } = await sb
      .from("playlist_tracks")
      .select("track_id")
      .in(
        "track_id",
        release.tracks.map((t) => t.id).concat(["00000000-0000-0000-0000-000000000000"]),
      );
    const used = new Set((inPlaylists ?? []).map((p) => p.track_id));
    return {
      ...release,
      tracks: [...release.tracks]
        .sort((a, b) => a.position - b.position)
        .map(({ track_descriptors, ...t }) => ({
          ...t,
          lufs: t.lufs == null ? null : Number(t.lufs),
          true_peak: t.true_peak == null ? null : Number(t.true_peak),
          lra: t.lra == null ? null : Number(t.lra),
          descriptorIds: track_descriptors.map((d) => d.descriptor_id),
          audioUrl: t.audio_path ? (urls.get(t.audio_path) ?? null) : null,
          inPlaylist: used.has(t.id),
          gainDb: playbackGainDb({
            targetLufs: settings.loudnessTargetLufs,
            trackLufs: t.lufs == null ? null : Number(t.lufs),
            truePeakDb: t.true_peak == null ? null : Number(t.true_peak),
          }),
        })),
    };
  });

// ---------------------------------------------------------------------------
// Artists
// ---------------------------------------------------------------------------

const artistSchema = z.object({
  id: uuid.optional(),
  name: z.string().trim().min(1, "The artist needs a name.").max(160),
  region: z.string().max(60).nullable(),
  bio: z.string().max(4000).default(""),
  links: z.string().max(2000).default(""),
  photoUrl: z.string().url().max(1000).nullable(),
  creatorIdUrl: z.string().url("The Creator ID link must be a web address.").max(1000).nullable(),
});

export const saveArtist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => valid(artistSchema, d))
  .handler(async ({ context, data }) => {
    const { requireRole, db, audit } = await import("./auth.server");
    await requireRole(context.userId, "admin");
    const sb = await db();
    const row = {
      name: data.name,
      region: data.region || null,
      bio: data.bio,
      links: data.links,
      photo_url: data.photoUrl,
      creator_id_url: data.creatorIdUrl,
      updated_at: new Date().toISOString(),
    };
    const { data: saved, error } = data.id
      ? await sb.from("artists").update(row).eq("id", data.id).select("id").single()
      : await sb.from("artists").insert(row).select("id").single();
    if (error) throw new Error(friendlyDbError(error.message));
    await audit({
      actor: context.userId,
      action: data.id ? "artist.update" : "artist.create",
      target: saved.id,
      after: row,
    });
    return { id: saved.id };
  });

// ---------------------------------------------------------------------------
// Releases and tracks
// ---------------------------------------------------------------------------

const trackSchema = z.object({
  id: uuid.optional(),
  title: z.string().trim().min(1, "Every song needs a title.").max(300),
  isrc: z.string().trim().max(20).nullable(),
  explicit: z.boolean(),
  genreId: z.string().max(60).nullable(),
  aiDeclaration: z.enum(["no", "yes"]).nullable(),
  story: z.string().max(4000).default(""),
  descriptorIds: z.array(z.string().max(60)).max(40).default([]),
});

const releaseSchema = z.object({
  id: uuid.optional(),
  artistId: uuid,
  title: z.string().trim().min(1, "The release needs a title.").max(300),
  type: z.enum(["single", "ep", "album"]),
  upc: z.string().trim().max(20).nullable(),
  label: z.string().trim().max(200).nullable(),
  pLine: z.string().trim().max(300).nullable(),
  originalReleaseDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  artworkUrl: z.string().url().max(1000).nullable(),
  tracks: z.array(trackSchema).max(100),
});

export const saveRelease = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => valid(releaseSchema, d))
  .handler(async ({ context, data }) => {
    const { requireRole, db, audit } = await import("./auth.server");
    await requireRole(context.userId, "admin");
    const sb = await db();

    const upc = data.upc ? data.upc.replace(/\s/g, "") : null;
    if (upc && !isValidUpc(upc))
      throw new Error(
        "That UPC doesn't look right: it needs 12 or 13 digits with a valid check digit.",
      );
    const tracks = data.tracks.map((t) => ({ ...t, isrc: t.isrc ? normaliseIsrc(t.isrc) : null }));
    const badIsrc = tracks.find((t) => t.isrc && !isValidIsrc(t.isrc));
    if (badIsrc)
      throw new Error(
        `The ISRC for “${badIsrc.title}” doesn't look right. It's 12 characters, like AU-XXX-26-00001.`,
      );
    const seen = new Set<string>();
    for (const t of tracks) {
      if (!t.isrc) continue;
      if (seen.has(t.isrc)) throw new Error(`The ISRC ${t.isrc} is used twice on this release.`);
      seen.add(t.isrc);
    }

    const row = {
      artist_id: data.artistId,
      title: data.title,
      type: data.type,
      upc,
      label: data.label || null,
      p_line: data.pLine || null,
      original_release_date: data.originalReleaseDate,
      artwork_url: data.artworkUrl,
      updated_at: new Date().toISOString(),
    };
    const { data: saved, error } = data.id
      ? await sb.from("releases").update(row).eq("id", data.id).select("id,state").single()
      : await sb
          .from("releases")
          .insert({ ...row, created_by: context.userId })
          .select("id,state")
          .single();
    if (error) throw new Error(friendlyDbError(error.message));
    const releaseId = saved.id;

    // Tracks: remove the ones left out, then write the rest in order.
    const { data: existing } = await sb.from("tracks").select("id").eq("release_id", releaseId);
    const keep = new Set(tracks.map((t) => t.id).filter(Boolean));
    const removed = (existing ?? []).map((t) => t.id).filter((id) => !keep.has(id));
    if (removed.length) {
      const { error: delError } = await sb.from("tracks").delete().in("id", removed);
      if (delError) throw new Error(friendlyDbError(delError.message));
    }
    // Park positions first so reordering never trips the (release_id, position) unique key.
    if (keep.size) {
      for (const [i, id] of [...keep].entries())
        await sb
          .from("tracks")
          .update({ position: 10000 + i })
          .eq("id", id!);
    }
    const ids: string[] = [];
    for (const [i, t] of tracks.entries()) {
      const fields = {
        release_id: releaseId,
        position: i + 1,
        title: t.title,
        isrc: t.isrc,
        explicit: t.explicit,
        genre_id: t.genreId || null,
        ai_declaration: t.aiDeclaration,
        story: t.story,
      };
      const { data: tr, error: trError } = t.id
        ? await sb
            .from("tracks")
            .update(fields)
            .eq("id", t.id)
            .eq("release_id", releaseId)
            .select("id")
            .single()
        : await sb.from("tracks").insert(fields).select("id").single();
      if (trError) throw new Error(friendlyDbError(trError.message));
      ids.push(tr.id);
      await writeDescriptors(sb, tr.id, t.descriptorIds);
    }
    await audit({
      actor: context.userId,
      action: data.id ? "release.update" : "release.create",
      target: releaseId,
      after: { ...row, tracks: tracks.map((t) => t.title) },
    });
    return { id: releaseId, trackIds: ids };
  });

async function writeDescriptors(sb: Sb, trackId: string, descriptorIds: string[]) {
  await sb.from("track_descriptors").delete().eq("track_id", trackId);
  const unique = [...new Set(descriptorIds)];
  if (unique.length) {
    const { error } = await sb
      .from("track_descriptors")
      .insert(unique.map((descriptor_id) => ({ track_id: trackId, descriptor_id })));
    if (error)
      throw new Error("One of those tags isn't on the list any more. Refresh and try again.");
  }
}

/** Curators tag tracks with the business-fit layer (TAX-2). */
export const setTrackDescriptors = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    valid(z.object({ trackId: uuid, descriptorIds: z.array(z.string().max(60)).max(40) }), d),
  )
  .handler(async ({ context, data }) => {
    const { requireRole, db, audit } = await import("./auth.server");
    await requireRole(context.userId, "curator");
    const sb = await db();
    await writeDescriptors(sb, data.trackId, data.descriptorIds);
    await audit({
      actor: context.userId,
      action: "track.tag",
      target: data.trackId,
      after: data.descriptorIds,
    });
    return { ok: true as const };
  });

/** Signed upload URL. Audio is admin only and must belong to a release; artwork is for covers and photos. */
export const createUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    valid(
      z.object({
        bucket: z.enum(["audio", "artwork"]),
        scope: z.string().regex(/^[a-z0-9-]{1,60}$/),
        fileName: z.string().trim().min(1).max(200),
        size: z.number().int().min(1),
      }),
      d,
    ),
  )
  .handler(async ({ context, data }) => {
    const { requireRole, db } = await import("./auth.server");
    await requireRole(context.userId, data.bucket === "audio" ? "admin" : "curator");
    if (data.bucket === "audio" && data.scope.length !== 36)
      throw new Error("Save the release before adding audio.");
    const limit = data.bucket === "audio" ? 500 * 1024 * 1024 : 20 * 1024 * 1024;
    if (data.size > limit)
      throw new Error(
        data.bucket === "audio"
          ? "Audio files can be up to 500 MB each."
          : "Images can be up to 20 MB.",
      );
    const sb = await db();
    const safe = data.fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-120);
    const path = `${data.scope}/${crypto.randomUUID()}-${safe}`;
    const { data: signed, error } = await sb.storage.from(data.bucket).createSignedUploadUrl(path);
    if (error || !signed)
      throw new Error(error?.message ?? "We couldn't start the upload. Try again.");
    const publicUrl =
      data.bucket === "artwork"
        ? sb.storage.from("artwork").getPublicUrl(path).data.publicUrl
        : null;
    return { path, token: signed.token, publicUrl };
  });

/** After an audio upload: attach it to the track and measure loudness and length on the server. */
export const attachTrackAudio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    valid(z.object({ trackId: uuid, path: z.string().min(10).max(400) }), d),
  )
  .handler(async ({ context, data }) => {
    const { requireRole, db, audit } = await import("./auth.server");
    await requireRole(context.userId, "admin");
    const sb = await db();
    const { data: track } = await sb
      .from("tracks")
      .select("id,release_id,audio_path")
      .eq("id", data.trackId)
      .single();
    if (!track) throw new Error("We couldn't find that song.");
    if (!data.path.startsWith(`${track.release_id}/`))
      throw new Error("That file belongs to another release.");
    const measured = await measureAudio(sb, data.path);
    const { error } = await sb
      .from("tracks")
      .update({
        audio_path: data.path,
        lufs: measured.lufs,
        true_peak: measured.truePeak,
        lra: measured.lra,
        duration_ms: measured.durationMs ?? 0,
      })
      .eq("id", track.id);
    if (error) throw new Error(error.message);
    if (track.audio_path && track.audio_path !== data.path)
      await sb.storage.from("audio").remove([track.audio_path]);
    await audit({
      actor: context.userId,
      action: "track.audio",
      target: track.id,
      after: { path: data.path, ...measured },
    });
    return measured;
  });

/** Measures loudness to EBU R128 and duration. Uses the bundled ffmpeg-static binary,
 *  falling back to an ffmpeg on the PATH. Returns nulls if neither is available. */
async function measureAudio(sb: Sb, path: string) {
  const empty = {
    lufs: null as number | null,
    truePeak: null as number | null,
    lra: null as number | null,
    durationMs: null as number | null,
  };
  try {
    const { spawnSync } = await import("node:child_process");
    const { writeFileSync, rmSync, mkdtempSync } = await import("node:fs");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    const bundled = (await import("ffmpeg-static").catch(() => null))?.default;
    const ffmpeg = typeof bundled === "string" ? bundled : "ffmpeg";
    const { data, error } = await sb.storage.from("audio").download(path);
    if (error || !data) return empty;
    const dir = mkdtempSync(join(tmpdir(), "pack-audio-"));
    const file = join(dir, path.split("/").pop() ?? "audio");
    writeFileSync(file, Buffer.from(await data.arrayBuffer()));
    try {
      const run = spawnSync(
        ffmpeg,
        [
          "-hide_banner",
          "-nostats",
          "-i",
          file,
          "-af",
          "loudnorm=print_format=json",
          "-f",
          "null",
          "-",
        ],
        { encoding: "utf8" },
      );
      const text = run.stderr ?? "";
      const d = /Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/.exec(text);
      const durationMs = d
        ? Math.round((Number(d[1]) * 3600 + Number(d[2]) * 60 + Number(d[3])) * 1000)
        : null;
      const start = text.lastIndexOf("{");
      if (run.error || start < 0) return { ...empty, durationMs };
      const json = JSON.parse(text.slice(start, text.lastIndexOf("}") + 1));
      const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : null);
      return {
        lufs: num(json.input_i),
        truePeak: num(json.input_tp),
        lra: num(json.input_lra),
        durationMs,
      };
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  } catch {
    return empty;
  }
}

/** What stops a release going live. Checked by the server on publish. */
export function publishProblems(tracks: { title: string; audio_path: string | null }[]): string[] {
  if (!tracks.length) return ["Add at least one song."];
  const problems: string[] = [];
  for (const t of tracks) {
    if (!t.title.trim()) problems.push("Every song needs a title.");
    if (!t.audio_path) problems.push(`“${t.title || "Untitled"}” has no audio yet.`);
  }
  return problems;
}

export const setReleaseState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    valid(z.object({ id: uuid, state: z.enum(["draft", "live", "withdrawn"]) }), d),
  )
  .handler(async ({ context, data }) => {
    const { requireRole, db, audit } = await import("./auth.server");
    await requireRole(context.userId, "admin");
    const sb = await db();
    const { data: release } = await sb
      .from("releases")
      .select("id,state,published_at,tracks(title,audio_path)")
      .eq("id", data.id)
      .single();
    if (!release) throw new Error("We couldn't find that release.");
    if (data.state === "live") {
      const problems = publishProblems(release.tracks);
      if (problems.length) throw new Error(`Not ready to publish: ${problems.join(" ")}`);
    }
    const { error } = await sb
      .from("releases")
      .update({
        state: data.state,
        published_at:
          data.state === "live"
            ? (release.published_at ?? new Date().toISOString())
            : release.published_at,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await audit({
      actor: context.userId,
      action: `release.${data.state}`,
      target: data.id,
      before: { state: release.state },
      after: { state: data.state },
    });
    return { ok: true as const };
  });

/** Takes one song off every playlist and player straight away, or puts it back (RTS-4). */
export const setTrackTakedown = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    valid(
      z.object({
        trackId: uuid,
        takenDown: z.boolean(),
        reason: z.string().trim().max(500).optional(),
      }),
      d,
    ),
  )
  .handler(async ({ context, data }) => {
    const { requireRole, db, audit } = await import("./auth.server");
    await requireRole(context.userId, "admin");
    const sb = await db();
    const { error } = await sb
      .from("tracks")
      .update({ taken_down_at: data.takenDown ? new Date().toISOString() : null })
      .eq("id", data.trackId);
    if (error) throw new Error(error.message);
    await audit({
      actor: context.userId,
      action: data.takenDown ? "track.takedown" : "track.restore",
      target: data.trackId,
      ...(data.reason ? { reason: data.reason } : {}),
    });
    return { ok: true as const };
  });
