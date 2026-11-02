import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Artist studio (C2 to C8). Every handler resolves the caller's own artist row
 * first and scopes every read and write to it. Ids from the browser are only
 * ever used after checking they belong to that artist.
 */

type Sb = Awaited<ReturnType<typeof import("./auth.server").db>>;

async function ownArtist(userId: string) {
  const { requireRole, db } = await import("./auth.server");
  await requireRole(userId, "artist");
  const sb = await db();
  const { data: artist } = await sb.from("artists").select("*").eq("user_id", userId).maybeSingle();
  if (!artist)
    throw new Error(
      "We couldn't find your artist profile. Message the co-op and we'll sort it out.",
    );
  return { sb, artist };
}

async function ownRelease(sb: Sb, artistId: string, releaseId: string) {
  const { data: release } = await sb
    .from("releases")
    .select("*")
    .eq("id", releaseId)
    .eq("artist_id", artistId)
    .maybeSingle();
  if (!release) throw new Error("That release isn't one of yours.");
  return release;
}

/** People rows that are this artist's own account (statements are built from these). */
async function ownPeopleIds(sb: Sb, userId: string) {
  const { data } = await sb.from("people").select("id").eq("user_id", userId);
  return (data ?? []).map((p) => p.id);
}

async function logTransition(
  sb: Sb,
  releaseId: string,
  from: string | null,
  to: string,
  actor: string,
  reason?: string,
) {
  await sb.from("release_events").insert({
    release_id: releaseId,
    from_state: from as never,
    to_state: to as never,
    actor,
    reason: reason ?? null,
  });
}

function monthStart(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

// ---------------------------------------------------------------------------
// Dashboard and profile
// ---------------------------------------------------------------------------

export const getStudio = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getSettings } = await import("./auth.server");
    const { sb, artist } = await ownArtist(context.userId);
    const settings = await getSettings();
    const { data: releases } = await sb
      .from("releases")
      .select("id,title,type,state,artwork_url,version,created_at,pack_release_date")
      .eq("artist_id", artist.id)
      .order("created_at", { ascending: false });

    // Plays this month across this artist's tracks (counts only, never listeners: LIS-7).
    const releaseIds = (releases ?? []).map((r) => r.id);
    let playsThisMonth = 0;
    let businessesThisMonth = 0;
    if (releaseIds.length) {
      const { data: tracks } = await sb.from("tracks").select("id").in("release_id", releaseIds);
      const trackIds = (tracks ?? []).map((t) => t.id);
      if (trackIds.length) {
        const { data: plays } = await sb
          .from("play_events")
          .select("site_id,seconds_played")
          .in("track_id", trackIds)
          .gte("started_at", monthStart().toISOString())
          .gte("seconds_played", settings.playThresholdSeconds);
        playsThisMonth = plays?.length ?? 0;
        businessesThisMonth = new Set((plays ?? []).map((p) => p.site_id)).size;
      }
    }

    // Latest posted month on the ledger, from approved runs only.
    const peopleIds = await ownPeopleIds(sb, context.userId);
    let lastPosted: { month: string; cents: number } | null = null;
    let balanceCents = 0;
    if (peopleIds.length) {
      const { data: entries } = await sb
        .from("ledger_entries")
        .select("month,cents,type,month_runs!inner(state)")
        .in("person_id", peopleIds)
        .eq("month_runs.state", "approved");
      const accruals = (entries ?? []).filter((e) => e.type !== "hold");
      balanceCents = accruals.reduce((a, e) => a + Number(e.cents), 0);
      const months = [...new Set(accruals.map((e) => e.month))].sort();
      const latest = months.at(-1);
      if (latest) {
        lastPosted = {
          month: latest,
          cents: accruals
            .filter((e) => e.month === latest)
            .reduce((a, e) => a + Number(e.cents), 0),
        };
      }
    }

    const profileComplete = Boolean(
      artist.public_name && artist.legal_name && artist.region && artist.bio,
    );
    return {
      artist: { id: artist.id, publicName: artist.public_name, region: artist.region },
      releases: releases ?? [],
      playsThisMonth,
      businessesThisMonth,
      lastPosted,
      balanceCents,
      payoutThresholdCents: settings.payoutThresholdCents,
      profileComplete,
    };
  });

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { sb, artist } = await ownArtist(context.userId);
    const { data: regions } = await sb.from("regions").select("code,name").order("sort_order");
    return {
      profile: {
        publicName: artist.public_name,
        legalName: artist.legal_name,
        region: artist.region ?? "",
        bio: artist.bio,
        links: artist.links,
      },
      regions: regions ?? [],
    };
  });

const profileSchema = z.object({
  publicName: z.string().trim().min(1, "Add the name listeners will see").max(120),
  legalName: z.string().trim().min(1, "Add your legal name. Only The Pack sees it").max(200),
  region: z.string().trim().min(1, "Choose your home region"),
  bio: z.string().trim().max(2000),
  links: z.string().trim().max(1000),
});

export const saveProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => profileSchema.parse(data))
  .handler(async ({ context, data }) => {
    const { audit } = await import("./auth.server");
    const { sb, artist } = await ownArtist(context.userId);
    const { data: region } = await sb
      .from("regions")
      .select("code")
      .eq("code", data.region)
      .maybeSingle();
    if (!region) throw new Error("Choose a region from the list.");
    const { error } = await sb
      .from("artists")
      .update({
        public_name: data.publicName,
        legal_name: data.legalName,
        region: data.region,
        bio: data.bio,
        links: data.links,
      })
      .eq("id", artist.id);
    if (error) throw new Error(error.message);
    // Keep the person record that gets paid in step with the legal name.
    await sb.from("people").update({ name: data.legalName }).eq("user_id", context.userId);
    await audit({ actor: context.userId, action: "artist.profile.save", target: artist.id });
    return { ok: true as const };
  });

export const getAgreement = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { sb } = await ownArtist(context.userId);
    const { data: doc } = await sb
      .from("documents")
      .select("id,title,version,summary,body,href")
      .eq("kind", "artist_agreement")
      .eq("is_current", true)
      .single();
    const { data: acceptance } = await sb
      .from("acceptances")
      .select("accepted_at")
      .eq("user_id", context.userId)
      .eq("document_id", doc!.id)
      .maybeSingle();
    return {
      document: { ...doc!, summary: (doc!.summary ?? []) as { heading: string; body: string }[] },
      acceptedAt: acceptance?.accepted_at ?? null,
    };
  });

// ---------------------------------------------------------------------------
// Releases
// ---------------------------------------------------------------------------

export const getReleaseOptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { sb } = await ownArtist(context.userId);
    const { data: genres } = await sb
      .from("genres")
      .select("id,label,parent_id")
      .is("retired_at", null)
      .order("label");
    const { data: me } = await sb
      .from("people")
      .select("id,name,email,ipi")
      .eq("user_id", context.userId)
      .limit(1)
      .maybeSingle();
    return { genres: genres ?? [], self: me ?? null };
  });

export const getRelease = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const { sb, artist } = await ownArtist(context.userId);
    const release = await ownRelease(sb, artist.id, data.id);
    const [{ data: tracks }, { data: issues }, { data: events }] = await Promise.all([
      sb
        .from("tracks")
        .select(
          "id,position,title,version_title,isrc,iswc,explicit,language,genre_id,ai_declaration,story,audio_path,duration_ms,lufs,true_peak,lra",
        )
        .eq("release_id", release.id)
        .order("position"),
      sb
        .from("release_issues")
        .select("id,code,outcome,message,fixed_by,track_id,cleared_at")
        .eq("release_id", release.id)
        .is("cleared_at", null),
      sb
        .from("release_events")
        .select("from_state,to_state,reason,created_at")
        .eq("release_id", release.id)
        .order("id"),
    ]);
    const trackIds = (tracks ?? []).map((t) => t.id);
    const { data: sets } = trackIds.length
      ? await sb
          .from("split_sets")
          .select(
            "id,track_id,confirmed_at,created_at,splits(person_id,role,share_bp,people(id,name,email,ipi,user_id))",
          )
          .in("track_id", trackIds)
          .order("created_at", { ascending: false })
      : { data: [] };
    // Only the latest split set per track counts (ART-5).
    const latest = new Map<string, NonNullable<typeof sets>[number]>();
    for (const set of sets ?? []) if (!latest.has(set.track_id)) latest.set(set.track_id, set);

    return {
      release,
      tracks: (tracks ?? []).map((t) => {
        const set = latest.get(t.id);
        return {
          ...t,
          lufs: t.lufs === null ? null : Number(t.lufs),
          true_peak: t.true_peak === null ? null : Number(t.true_peak),
          splitsConfirmedAt: set?.confirmed_at ?? null,
          splits: (set?.splits ?? []).map((s) => ({
            personId: s.person_id,
            name: s.people?.name ?? "",
            email: s.people?.email ?? "",
            ipi: s.people?.ipi ?? "",
            role: s.role,
            shareBp: s.share_bp,
            hasAccount: Boolean(s.people?.user_id),
          })),
        };
      }),
      issues: issues ?? [],
      events: events ?? [],
    };
  });

const EDITABLE = new Set(["draft", "needs_attention", "held", "rejected"]);

const contributorSchema = z.object({
  personId: z.string().uuid().nullable(),
  name: z.string().trim().min(1, "Every person who gets paid needs a name").max(200),
  email: z.string().trim().email().max(255).or(z.literal("")),
  ipi: z.string().trim().max(20),
  role: z.string().trim().min(1).max(120),
  shareBp: z.number().int().min(1).max(10000),
});

const trackSchema = z.object({
  id: z.string().uuid().nullable(),
  title: z.string().trim().max(300),
  versionTitle: z.string().trim().max(300),
  isrc: z.string().trim().max(20),
  iswc: z.string().trim().max(20),
  explicit: z.boolean().nullable(),
  language: z.string().trim().min(2).max(10),
  genreId: z.string().trim().max(60),
  aiDeclaration: z.enum(["no", "yes"]).nullable(),
  story: z.string().max(5000),
  audioPath: z.string().max(400).nullable(),
  contributors: z.array(contributorSchema).max(30),
});

const releaseSchema = z.object({
  id: z.string().uuid().nullable(),
  title: z.string().trim().min(1, "Give the release a title").max(300),
  type: z.enum(["single", "ep", "album"]),
  upc: z.string().trim().max(20),
  originalReleaseDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .or(z.literal("")),
  packReleaseDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .or(z.literal("")),
  label: z.string().trim().max(200),
  pLine: z.string().trim().max(300),
  artworkUrl: z.string().max(1000).nullable(),
  rightsStatus: z
    .enum(["unsigned", "independent_label", "distributor", "major_label", "unknown"])
    .nullable(),
  rightsConfirmed: z.boolean(),
  tracks: z.array(trackSchema).max(60),
});

export type ReleaseDraft = z.infer<typeof releaseSchema>;

/** Saves a draft. Masters and loudness readings are measured here, never taken from the browser. */
export const saveRelease = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => releaseSchema.parse(data))
  .handler(async ({ context, data }) => {
    const { audit } = await import("./auth.server");
    const { sb, artist } = await ownArtist(context.userId);
    const now = new Date().toISOString();
    const fields = {
      title: data.title,
      type: data.type,
      upc: data.upc.replace(/\s/g, "") || null,
      original_release_date: data.originalReleaseDate || null,
      pack_release_date: data.packReleaseDate || null,
      label: data.label || null,
      p_line: data.pLine || null,
      rights_status: data.rightsStatus,
      rights_confirmed_at: data.rightsConfirmed ? now : null,
    };

    let releaseId = data.id;
    if (releaseId) {
      const release = await ownRelease(sb, artist.id, releaseId);
      if (!EDITABLE.has(release.state))
        throw new Error("This release is with The Pack now, so it can't be changed here.");
      const artworkUrl = checkedArtworkUrl(data.artworkUrl, releaseId) ?? release.artwork_url;
      const { error } = await sb
        .from("releases")
        .update({ ...fields, artwork_url: artworkUrl })
        .eq("id", releaseId);
      if (error) throw new Error(friendlyDbError(error.message));
    } else {
      const { data: created, error } = await sb
        .from("releases")
        .insert({ ...fields, artist_id: artist.id, state: "draft" })
        .select("id")
        .single();
      if (error) throw new Error(friendlyDbError(error.message));
      releaseId = created.id;
      await logTransition(sb, releaseId, null, "draft", context.userId);
    }

    // Tracks: update by id, insert new ones, remove ones that were taken out.
    const { data: existing } = await sb
      .from("tracks")
      .select("id,audio_path")
      .eq("release_id", releaseId);
    const existingById = new Map((existing ?? []).map((t) => [t.id, t]));
    const keep = new Set(data.tracks.map((t) => t.id).filter(Boolean));
    const removed = (existing ?? []).filter((t) => !keep.has(t.id)).map((t) => t.id);
    if (removed.length) {
      const { error } = await sb.from("tracks").delete().in("id", removed);
      if (error)
        throw new Error("A song that has already been played can't be removed from its release.");
    }
    // Free the positions first so reordering never collides with the unique (release, position) rule.
    for (const [index, t] of data.tracks.entries()) {
      if (t.id && existingById.has(t.id))
        await sb
          .from("tracks")
          .update({ position: 1000 + index })
          .eq("id", t.id);
    }

    const ownPeople = new Set(await ownPeopleIds(sb, context.userId));
    const releasePeople = new Set<string>();
    if (existing?.length) {
      const { data: prior } = await sb
        .from("split_sets")
        .select("splits(person_id)")
        .in(
          "track_id",
          existing.map((t) => t.id),
        );
      for (const set of prior ?? [])
        for (const s of set.splits ?? []) releasePeople.add(s.person_id);
    }

    for (const [index, t] of data.tracks.entries()) {
      if (t.audioPath && !t.audioPath.startsWith(`${releaseId}/`))
        throw new Error("That audio file belongs to another release.");
      const before = t.id ? existingById.get(t.id) : undefined;
      if (t.id && !before) throw new Error("That song isn't part of this release.");
      const row = {
        position: index + 1,
        title: t.title,
        version_title: t.versionTitle || null,
        isrc: t.isrc ? t.isrc.replace(/[\s-]/g, "").toUpperCase() : null,
        iswc: t.iswc || null,
        explicit: t.explicit ?? false,
        language: t.language,
        genre_id: t.genreId || null,
        ai_declaration: t.aiDeclaration,
        ai_declared_at: t.aiDeclaration ? now : null,
        story: t.story,
        audio_path: t.audioPath,
      };
      let trackId = t.id;
      if (trackId) {
        const { error } = await sb.from("tracks").update(row).eq("id", trackId);
        if (error) throw new Error(friendlyDbError(error.message));
      } else {
        const { data: created, error } = await sb
          .from("tracks")
          .insert({ ...row, release_id: releaseId })
          .select("id")
          .single();
        if (error) throw new Error(friendlyDbError(error.message));
        trackId = created.id;
      }

      if (t.audioPath && t.audioPath !== before?.audio_path) {
        const measured = await measureAudio(sb, t.audioPath);
        await sb
          .from("tracks")
          .update({
            lufs: measured.lufs,
            true_peak: measured.truePeak,
            lra: measured.lra,
            duration_ms: measured.durationMs ?? 0,
          })
          .eq("id", trackId);
      }

      await saveSplits(sb, trackId, t.contributors, ownPeople, releasePeople);
    }

    await audit({ actor: context.userId, action: "release.save", target: releaseId });
    return { id: releaseId };
  });

/** Writes a new split set only when the splits changed: a change is new and dated, never an edit (ART-5). */
async function saveSplits(
  sb: Sb,
  trackId: string,
  contributors: z.infer<typeof contributorSchema>[],
  ownPeople: Set<string>,
  releasePeople: Set<string>,
) {
  const resolved: { personId: string; role: string; shareBp: number }[] = [];
  for (const c of contributors) {
    let personId: string | null = null;
    if (c.personId) {
      if (!ownPeople.has(c.personId) && !releasePeople.has(c.personId))
        throw new Error("One of the people on this song can't be used here.");
      personId = c.personId;
    } else if (c.ipi) {
      // People are matched by identifier, never by typed name (CAT-7).
      const { data } = await sb.from("people").select("id").eq("ipi", c.ipi).maybeSingle();
      personId = data?.id ?? null;
    } else if (c.email) {
      const { data } = await sb
        .from("people")
        .select("id")
        .eq("email", c.email.toLowerCase())
        .limit(1)
        .maybeSingle();
      personId = data?.id ?? null;
    }
    if (!personId) {
      const { data, error } = await sb
        .from("people")
        .insert({ name: c.name, email: c.email ? c.email.toLowerCase() : null, ipi: c.ipi || null })
        .select("id")
        .single();
      if (error) throw new Error(friendlyDbError(error.message));
      personId = data.id;
    }
    releasePeople.add(personId);
    if (resolved.some((r) => r.personId === personId))
      throw new Error(
        `${c.name} is listed twice on the same song. Combine their shares into one line.`,
      );
    resolved.push({ personId, role: c.role, shareBp: c.shareBp });
  }

  const { data: latest } = await sb
    .from("split_sets")
    .select("id,splits(person_id,role,share_bp)")
    .eq("track_id", trackId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const key = (rows: { personId: string; role: string; shareBp: number }[]) =>
    JSON.stringify([...rows].sort((a, b) => a.personId.localeCompare(b.personId)));
  const previous = (latest?.splits ?? []).map((s) => ({
    personId: s.person_id,
    role: s.role,
    shareBp: s.share_bp,
  }));
  if (latest && key(previous) === key(resolved)) return;
  if (!resolved.length && !latest) return;

  const { data: set, error } = await sb
    .from("split_sets")
    .insert({ track_id: trackId })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  if (resolved.length) {
    const { error: splitError } = await sb.from("splits").insert(
      resolved.map((r) => ({
        split_set_id: set.id,
        person_id: r.personId,
        role: r.role,
        share_bp: r.shareBp,
      })),
    );
    if (splitError) throw new Error(splitError.message);
  }
}

function checkedArtworkUrl(url: string | null, releaseId: string) {
  if (!url) return null;
  return url.includes(`/storage/v1/object/public/artwork/${releaseId}/`) ? url : null;
}

function friendlyDbError(message: string) {
  if (message.includes("releases_upc_key"))
    return "That UPC is already on another release in The Pack. Check the number, or message the co-op if it's a re-release.";
  if (message.includes("tracks_isrc_key"))
    return "One of these ISRCs is already in The Pack catalogue. Check the numbers, or message the co-op if it's a re-release.";
  return message;
}

/** Measures loudness to EBU R128 and duration, if ffmpeg is installed (ING-10). */
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
    const { data, error } = await sb.storage.from("audio").download(path);
    if (error || !data) return empty;
    const dir = mkdtempSync(join(tmpdir(), "pack-audio-"));
    const file = join(dir, path.split("/").pop() ?? "audio");
    writeFileSync(file, Buffer.from(await data.arrayBuffer()));
    try {
      const probe = spawnSync(
        "ffprobe",
        ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file],
        { encoding: "utf8" },
      );
      const seconds = Number(probe.stdout?.trim());
      const run = spawnSync(
        "ffmpeg",
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
        {
          encoding: "utf8",
        },
      );
      const text = run.stderr ?? "";
      const start = text.lastIndexOf("{");
      if (run.error || start < 0)
        return {
          ...empty,
          durationMs: Number.isFinite(seconds) ? Math.round(seconds * 1000) : null,
        };
      const json = JSON.parse(text.slice(start, text.lastIndexOf("}") + 1));
      const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : null);
      return {
        lufs: num(json.input_i),
        truePeak: num(json.input_tp),
        lra: num(json.input_lra),
        durationMs: Number.isFinite(seconds) ? Math.round(seconds * 1000) : null,
      };
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  } catch {
    return empty;
  }
}

export const createUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        releaseId: z.string().uuid(),
        bucket: z.enum(["audio", "artwork"]),
        fileName: z.string().trim().min(1).max(200),
        size: z.number().int().min(1),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { sb, artist } = await ownArtist(context.userId);
    const release = await ownRelease(sb, artist.id, data.releaseId);
    if (!EDITABLE.has(release.state))
      throw new Error("This release is with The Pack now, so files can't be changed here.");
    const limit = data.bucket === "audio" ? 500 * 1024 * 1024 : 20 * 1024 * 1024;
    if (data.size > limit)
      throw new Error(
        data.bucket === "audio"
          ? "Audio files can be up to 500 MB each."
          : "Artwork can be up to 20 MB.",
      );
    const safe = data.fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-120);
    const path = `${release.id}/${crypto.randomUUID()}-${safe}`;
    const { data: signed, error } = await sb.storage.from(data.bucket).createSignedUploadUrl(path);
    if (error || !signed)
      throw new Error(error?.message ?? "We couldn't start the upload. Try again.");
    const publicUrl =
      data.bucket === "artwork"
        ? sb.storage.from("artwork").getPublicUrl(path).data.publicUrl
        : null;
    return { path, token: signed.token, publicUrl };
  });

/** Runs the checks and moves the release on (ING-4, ING-5, CAT-4). */
export const submitRelease = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const { getSettings, audit } = await import("./auth.server");
    const { checkRelease, stateAfterChecks } = await import("./release-checks");
    const { sb, artist } = await ownArtist(context.userId);
    const release = await ownRelease(sb, artist.id, data.id);
    if (!EDITABLE.has(release.state)) throw new Error("This release has already been sent.");

    // ART-3 and ACC-9: the agreement and membership come before any release enters review.
    const { data: agreement } = await sb
      .from("documents")
      .select("id")
      .eq("kind", "artist_agreement")
      .eq("is_current", true)
      .single();
    const { data: accepted } = await sb
      .from("acceptances")
      .select("id")
      .eq("user_id", context.userId)
      .eq("document_id", agreement!.id)
      .maybeSingle();
    if (!accepted)
      throw new Error("Please read and accept the Artist Agreement before you send a release.");
    const { data: membership } = await sb
      .from("memberships")
      .select("id")
      .eq("user_id", context.userId)
      .limit(1)
      .maybeSingle();
    if (!membership) throw new Error("Please join the co-op before you send a release.");

    // ART-4 and RTS-1: a rights position is required, and major-label releases can't go on The Pack.
    if (!release.rights_status || !release.rights_confirmed_at) {
      throw new Error(
        "Tell us your rights position and confirm you're free to distribute these recordings.",
      );
    }
    if (release.rights_status === "major_label") {
      throw new Error(
        "The Pack can only play music by unsigned and independent artists, so a major-label release can't go on The Pack.",
      );
    }

    const settings = await getSettings();
    const [{ data: tracks }, { data: genres }] = await Promise.all([
      sb
        .from("tracks")
        .select("id,position,title,isrc,explicit,audio_path,ai_declaration,genre_id,lufs")
        .eq("release_id", release.id),
      sb.from("genres").select("id").is("retired_at", null),
    ]);
    const trackIds = (tracks ?? []).map((t) => t.id);
    const { data: sets } = trackIds.length
      ? await sb
          .from("split_sets")
          .select("track_id,created_at,splits(share_bp)")
          .in("track_id", trackIds)
          .order("created_at", { ascending: false })
      : { data: [] };
    const splitsByTrack = new Map<string, { shareBp: number }[]>();
    for (const set of sets ?? []) {
      if (!splitsByTrack.has(set.track_id))
        splitsByTrack.set(
          set.track_id,
          (set.splits ?? []).map((s) => ({ shareBp: s.share_bp })),
        );
    }

    const isrcs = (tracks ?? []).map((t) => t.isrc).filter((v): v is string => Boolean(v));
    const { data: clashes } = isrcs.length
      ? await sb.from("tracks").select("isrc").in("isrc", isrcs).neq("release_id", release.id)
      : { data: [] };
    const { data: upcClash } = release.upc
      ? await sb.from("releases").select("upc").eq("upc", release.upc).neq("id", release.id)
      : { data: [] };

    const issues = checkRelease(
      {
        title: release.title,
        upc: release.upc,
        tracks: (tracks ?? []).map((t) => ({
          id: t.id,
          position: t.position,
          title: t.title,
          isrc: t.isrc,
          explicit: t.explicit,
          audioPath: t.audio_path,
          aiDeclaration: t.ai_declaration,
          genreId: t.genre_id,
          lufs: t.lufs === null ? null : Number(t.lufs),
          splits: splitsByTrack.get(t.id) ?? [],
        })),
      },
      {
        acceptedAiAnswers: settings.acceptedAiAnswers,
        genreIds: new Set((genres ?? []).map((g) => g.id)),
        existingIsrcs: new Set((clashes ?? []).map((c) => c.isrc!).filter(Boolean)),
        existingUpcs: new Set((upcClash ?? []).map((r) => r.upc!).filter(Boolean)),
      },
    );

    const now = new Date().toISOString();
    await sb
      .from("release_issues")
      .update({ cleared_at: now })
      .eq("release_id", release.id)
      .is("cleared_at", null);
    if (issues.length) {
      await sb.from("release_issues").insert(
        issues.map((i) => ({
          release_id: release.id,
          track_id: i.trackId ?? null,
          code: i.code,
          outcome: i.outcome,
          message: i.message,
          fixed_by: i.fixedBy,
        })),
      );
    }

    // A corrected release is a new version of the same release (ING-7).
    const version = release.state === "draft" ? release.version : release.version + 1;
    const next = stateAfterChecks(issues);
    await logTransition(
      sb,
      release.id,
      release.state,
      "received",
      context.userId,
      version > release.version ? `Version ${version}` : undefined,
    );
    await logTransition(sb, release.id, "received", "checking", context.userId);
    await logTransition(sb, release.id, "checking", next, context.userId);
    await sb
      .from("releases")
      .update({ state: next, version, submitted_at: now })
      .eq("id", release.id);
    await audit({
      actor: context.userId,
      action: "release.submit",
      target: release.id,
      after: { state: next, version, issues: issues.map((i) => i.code) },
    });
    return { state: next, issues: issues.length };
  });

export const confirmSplits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ releaseId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const { audit } = await import("./auth.server");
    const { sb, artist } = await ownArtist(context.userId);
    const release = await ownRelease(sb, artist.id, data.releaseId);
    const { data: tracks } = await sb
      .from("tracks")
      .select("id,title")
      .eq("release_id", release.id);
    if (!tracks?.length) throw new Error("This release has no songs yet.");
    const now = new Date().toISOString();
    for (const track of tracks) {
      const { data: set } = await sb
        .from("split_sets")
        .select("id,splits(share_bp)")
        .eq("track_id", track.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const total = (set?.splits ?? []).reduce((a, s) => a + s.share_bp, 0);
      if (!set || total !== 10000)
        throw new Error(
          `The splits for “${track.title}” need to total 100% before you can confirm them.`,
        );
      await sb
        .from("split_sets")
        .update({ confirmed_at: now, confirmed_by: context.userId })
        .eq("id", set.id);
    }
    await sb.from("releases").update({ splits_confirmed_at: now }).eq("id", release.id);
    await audit({ actor: context.userId, action: "release.splits.confirm", target: release.id });
    return { ok: true as const };
  });

/** "Something's wrong": pauses the release and tells the co-op (ART-5). */
export const reportSplitProblem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        releaseId: z.string().uuid(),
        reason: z.string().trim().min(3, "Tell us what looks wrong").max(2000),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { audit } = await import("./auth.server");
    const { sb, artist } = await ownArtist(context.userId);
    const release = await ownRelease(sb, artist.id, data.releaseId);
    if (["live", "withdrawn", "taken_down", "rejected"].includes(release.state)) {
      throw new Error("This release can't be paused from here. Message the co-op and we'll help.");
    }
    await sb.from("release_issues").insert({
      release_id: release.id,
      code: "E480",
      outcome: "hold",
      message: `You told us something's wrong with who gets paid: “${data.reason}”. A person at The Pack will get in touch.`,
      fixed_by: "The Pack",
    });
    if (release.state !== "held") {
      await sb
        .from("releases")
        .update({ state: "held", splits_confirmed_at: null })
        .eq("id", release.id);
      await logTransition(sb, release.id, release.state, "held", context.userId, data.reason);
    }
    await audit({
      actor: context.userId,
      action: "release.splits.problem",
      target: release.id,
      reason: data.reason,
    });
    return { ok: true as const };
  });

/** DAT-2: an artist can withdraw their own release. Ledger history stays. */
export const withdrawRelease = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ releaseId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const { audit } = await import("./auth.server");
    const { sb, artist } = await ownArtist(context.userId);
    const release = await ownRelease(sb, artist.id, data.releaseId);
    if (["withdrawn", "taken_down"].includes(release.state))
      throw new Error("This release is already off The Pack.");
    await sb.from("releases").update({ state: "withdrawn" }).eq("id", release.id);
    await logTransition(
      sb,
      release.id,
      release.state,
      "withdrawn",
      context.userId,
      "Withdrawn by the artist",
    );
    await audit({
      actor: context.userId,
      action: "release.withdraw",
      target: release.id,
      before: { state: release.state },
    });
    return { ok: true as const };
  });

// ---------------------------------------------------------------------------
// Earnings and data
// ---------------------------------------------------------------------------

/** C8: built only from approved ledger entries for the caller's own person rows (PAY-9). */
export const getStatement = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) =>
    z
      .object({
        month: z
          .string()
          .regex(/^\d{4}-\d{2}-01$/)
          .optional(),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    const { getSettings } = await import("./auth.server");
    const { sb } = await ownArtist(context.userId);
    const settings = await getSettings();
    const peopleIds = await ownPeopleIds(sb, context.userId);
    const empty = {
      months: [] as string[],
      month: null as string | null,
      lines: [] as StatementLine[],
      monthCents: 0,
      heldCents: 0,
      balanceCents: 0,
      payoutThresholdCents: settings.payoutThresholdCents,
      testMode: settings.testMode,
      artistShareBp: settings.artistShareBp,
      playThresholdSeconds: settings.playThresholdSeconds,
    };
    if (!peopleIds.length) return empty;

    const { data: all } = await sb
      .from("ledger_entries")
      .select(
        "id,type,month,cents,plays,pot_plays,share_bp,track_id,site_id,month_runs!inner(state)",
      )
      .in("person_id", peopleIds)
      .eq("month_runs.state", "approved");
    const entries = all ?? [];
    const months = [...new Set(entries.map((e) => e.month))].sort().reverse();
    const month = data.month && months.includes(data.month) ? data.month : (months[0] ?? null);
    const balanceCents = entries
      .filter((e) => e.type !== "hold")
      .reduce((a, e) => a + Number(e.cents), 0);
    if (!month) return { ...empty, balanceCents };

    const monthEntries = entries.filter((e) => e.month === month);
    const trackIds = [
      ...new Set(monthEntries.map((e) => e.track_id).filter((v): v is string => Boolean(v))),
    ];
    const siteIds = [
      ...new Set(monthEntries.map((e) => e.site_id).filter((v): v is string => Boolean(v))),
    ];
    const [{ data: tracks }, { data: sites }, { data: pots }, { data: songTotals }] =
      await Promise.all([
        trackIds.length
          ? sb.from("tracks").select("id,title").in("id", trackIds)
          : Promise.resolve({ data: [] as { id: string; title: string }[] }),
        siteIds.length
          ? sb.from("sites").select("id,name,fee_cents").in("id", siteIds)
          : Promise.resolve({ data: [] as { id: string; name: string; fee_cents: number }[] }),
        siteIds.length
          ? sb
              .from("site_pots")
              .select("site_id,fee_cents,artist_pool_cents,month_runs!inner(month,state)")
              .in("site_id", siteIds)
              .eq("month_runs.month", month)
              .eq("month_runs.state", "approved")
          : Promise.resolve({
              data: [] as { site_id: string; fee_cents: number; artist_pool_cents: number }[],
            }),
        // The song's total at that site, across every contributor: an amount, never a name.
        trackIds.length
          ? sb
              .from("ledger_entries")
              .select("track_id,site_id,cents,month_runs!inner(state)")
              .in("track_id", trackIds)
              .eq("month", month)
              .eq("month_runs.state", "approved")
          : Promise.resolve({
              data: [] as { track_id: string | null; site_id: string | null; cents: number }[],
            }),
      ]);
    const title = new Map((tracks ?? []).map((t) => [t.id, t.title]));
    const siteName = new Map((sites ?? []).map((s) => [s.id, s.name]));
    const pot = new Map((pots ?? []).map((p) => [p.site_id, p]));
    const songTotal = new Map<string, number>();
    for (const row of songTotals ?? []) {
      const key = `${row.site_id}:${row.track_id}`;
      songTotal.set(key, (songTotal.get(key) ?? 0) + Number(row.cents));
    }

    const lines: StatementLine[] = monthEntries
      .map((e) => ({
        id: e.id,
        type: e.type,
        business: siteName.get(e.site_id ?? "") ?? "A business",
        song: title.get(e.track_id ?? "") ?? "A song",
        plays: e.plays,
        potPlays: e.pot_plays,
        songTotalCents: songTotal.get(`${e.site_id}:${e.track_id}`) ?? Number(e.cents),
        shareBp: e.share_bp ?? 10000,
        cents: Number(e.cents),
        feeCents: Number(pot.get(e.site_id ?? "")?.fee_cents ?? 0),
        artistPoolCents: Number(pot.get(e.site_id ?? "")?.artist_pool_cents ?? 0),
      }))
      .sort((a, b) => a.business.localeCompare(b.business) || b.cents - a.cents);

    return {
      ...empty,
      months,
      month,
      lines,
      monthCents: lines.filter((l) => l.type !== "hold").reduce((a, l) => a + l.cents, 0),
      heldCents: lines.filter((l) => l.type === "hold").reduce((a, l) => a + l.cents, 0),
      balanceCents,
    };
  });

export type StatementLine = {
  id: string;
  type: string;
  business: string;
  song: string;
  plays: number;
  potPlays: number;
  songTotalCents: number;
  shareBp: number;
  cents: number;
  feeCents: number;
  artistPoolCents: number;
};

/** DAT-1: everything The Pack holds about this artist, in open formats. */
export const exportMyData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { audit } = await import("./auth.server");
    const { sb, artist } = await ownArtist(context.userId);
    const peopleIds = await ownPeopleIds(sb, context.userId);
    const [
      { data: profile },
      { data: releases },
      { data: acceptances },
      { data: memberships },
      { data: ledger },
    ] = await Promise.all([
      sb.from("profiles").select("*").eq("user_id", context.userId).maybeSingle(),
      sb
        .from("releases")
        .select(
          "*, tracks(*, split_sets(*, splits(*, people(name,email,ipi,isni)))), release_events(*)",
        )
        .eq("artist_id", artist.id),
      sb
        .from("acceptances")
        .select("accepted_at, documents(kind,version,title)")
        .eq("user_id", context.userId),
      sb
        .from("memberships")
        .select("class,accepted_at, documents(version,title)")
        .eq("user_id", context.userId),
      peopleIds.length
        ? sb
            .from("ledger_entries")
            .select(
              "type,month,cents,plays,pot_plays,share_bp,created_at, tracks(title,isrc), sites(name), month_runs(state)",
            )
            .in("person_id", peopleIds)
        : Promise.resolve({ data: [] }),
    ]);
    await audit({ actor: context.userId, action: "artist.export", target: artist.id });
    return {
      exportedAt: new Date().toISOString(),
      note: "Everything The Pack holds about you. Your original audio files are linked by their storage path.",
      profile,
      artist,
      releases: releases ?? [],
      agreements: acceptances ?? [],
      memberships: memberships ?? [],
      ledger: ledger ?? [],
    };
  });
