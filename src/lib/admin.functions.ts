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
 * Admin console: dashboard, review queue, sites, users, policy and audit.
 * Every handler re-checks the caller's role. Curators may read the review
 * queue and edit business-fit tags; only admins decide, take down or configure.
 */

const uuid = z.string().uuid();

// ---------------------------------------------------------------------------
// Pure helpers (no server imports, safe in the client bundle)
// ---------------------------------------------------------------------------

type GateInput = {
  release: {
    rights_status: string | null;
    rights_confirmed_at: string | null;
    splits_confirmed_at: string | null;
  };
  tracks: {
    id: string;
    title: string;
    ai_declaration: string | null;
    splitTotal: number;
    splitConfirmed: boolean;
  }[];
  issues: { outcome: string; cleared_at: string | null; code: string }[];
  acceptedAi: string[];
};

/** RTS-2: every gate that must close before a release can be approved. */
export function openGates(input: GateInput): string[] {
  const gates: string[] = [];
  const { release } = input;
  if (!release.rights_status || !release.rights_confirmed_at)
    gates.push("The artist hasn't declared their rights position.");
  else if (release.rights_status === "major_label")
    gates.push("Major-label releases can't be approved (RTS-1).");
  for (const t of input.tracks) {
    if (!t.ai_declaration) gates.push(`“${t.title}” has no AI declaration.`);
    else if (!input.acceptedAi.includes(t.ai_declaration))
      gates.push(`“${t.title}”: AI answer “${t.ai_declaration}” isn't on the accepted list.`);
  }
  if (!release.splits_confirmed_at) gates.push("The artist hasn't confirmed who gets paid.");
  for (const t of input.tracks) {
    if (t.splitTotal !== 10000)
      gates.push(`“${t.title}”: splits total ${t.splitTotal / 100}%, not 100%.`);
    else if (!t.splitConfirmed) gates.push(`“${t.title}”: the latest split hasn't been confirmed.`);
  }
  for (const i of input.issues) {
    if (!i.cleared_at && (i.outcome === "reject" || i.outcome === "hold"))
      gates.push(`Check ${i.code} is still open.`);
  }
  if (input.tracks.length === 0) gates.push("The release has no tracks.");
  return gates;
}

/** Site state from its heartbeat and player hours (VEN-5). Times are Perth local. */
export function siteState(
  lastHeartbeat: string | null,
  playerStart: string,
  playerEnd: string,
  now = new Date(),
) {
  const fresh = lastHeartbeat
    ? now.getTime() - new Date(lastHeartbeat).getTime() < 2 * 60_000
    : false;
  if (fresh) return "on_air" as const;
  const hm = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Perth",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
  const inHours = hm >= playerStart.slice(0, 5) && hm < playerEnd.slice(0, 5);
  return inHours ? ("silent" as const) : ("offline" as const);
}

// ---------------------------------------------------------------------------
// Dashboard (ADM-1)
// ---------------------------------------------------------------------------

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireRole, db } = await import("./auth.server");
    await requireRole(context.userId, "curator");
    const sb = await db();
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 86400_000).toISOString();
    const weekAgo = new Date(now.getTime() - 7 * 86400_000).toISOString();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
      .toISOString()
      .slice(0, 10);
    const lastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
      .toISOString()
      .slice(0, 10);

    const [releases, sites, plays, skips, runs] = await Promise.all([
      sb.from("releases").select("state").in("state", ["in_review", "held", "needs_attention"]),
      sb.from("sites").select("id,name,last_heartbeat_at,player_start,player_end"),
      sb.from("play_events").select("id", { count: "exact", head: true }).gte("started_at", dayAgo),
      sb.from("skips").select("reason").gte("created_at", weekAgo),
      sb
        .from("month_runs")
        .select("month,state,created_at")
        .in("month", [monthStart, lastMonth])
        .order("created_at", { ascending: false }),
    ]);
    const count = (s: string) => (releases.data ?? []).filter((r) => r.state === s).length;
    const siteRows = (sites.data ?? []).map((s) => ({
      ...s,
      state: siteState(s.last_heartbeat_at, s.player_start, s.player_end, now),
    }));
    const reasons: Record<string, number> = {};
    for (const s of skips.data ?? []) reasons[s.reason] = (reasons[s.reason] ?? 0) + 1;
    const runFor = (m: string) => {
      const forMonth = (runs.data ?? []).filter((r) => r.month === m);
      return forMonth.find((r) => r.state === "approved")?.state ?? forMonth[0]?.state ?? null;
    };
    return {
      inReview: count("in_review"),
      held: count("held"),
      needsAttention: count("needs_attention"),
      sitesOnAir: siteRows.filter((s) => s.state === "on_air").length,
      sitesSilent: siteRows.filter((s) => s.state === "silent").map((s) => s.name),
      siteCount: siteRows.length,
      plays24h: plays.count ?? 0,
      skipReasons: reasons,
      ledger: {
        thisMonth: monthStart,
        thisMonthState: runFor(monthStart),
        lastMonth,
        lastMonthState: runFor(lastMonth),
      },
    };
  });

// ---------------------------------------------------------------------------
// Review queue (D2, ADM-2, RTS)
// ---------------------------------------------------------------------------

export const listReviewQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireRole, db } = await import("./auth.server");
    await requireRole(context.userId, "curator");
    const sb = await db();
    const { data, error } = await sb
      .from("releases")
      .select("id,title,type,state,version,submitted_at,artists(public_name)")
      .in("state", ["in_review", "held", "needs_attention"])
      .order("submitted_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({ ...r, artistName: r.artists?.public_name ?? "" }));
  });

export const getReleaseForReview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => valid(z.object({ id: uuid }), d))
  .handler(async ({ context, data }) => {
    const { requireRole, db, getSettings } = await import("./auth.server");
    const { signedAudioUrls } = await import("./audio.server");
    const { playbackGainDb } = await import("./loudness");
    const caller = await requireRole(context.userId, "curator");
    const sb = await db();
    const settings = await getSettings();

    const { data: release, error } = await sb
      .from("releases")
      .select("*,artists(id,public_name,region,cohort,user_id)")
      .eq("id", data.id)
      .single();
    if (error) throw new Error("We couldn't find that release.");

    const [
      { data: tracks },
      { data: issues },
      { data: events },
      { data: descriptors },
      { data: genres },
    ] = await Promise.all([
      sb
        .from("tracks")
        .select("*,track_descriptors(descriptor_id)")
        .eq("release_id", data.id)
        .order("position"),
      sb.from("release_issues").select("*").eq("release_id", data.id).order("created_at"),
      sb.from("release_events").select("*").eq("release_id", data.id).order("created_at"),
      sb.from("descriptors").select("id,facet,label").is("retired_at", null).order("facet"),
      sb.from("genres").select("id,label,parent_id"),
    ]);
    const trackIds = (tracks ?? []).map((t) => t.id);
    const { data: sets } = trackIds.length
      ? await sb
          .from("split_sets")
          .select(
            "id,track_id,confirmed_at,created_at,splits(person_id,role,share_bp,people(name,user_id,email))",
          )
          .in("track_id", trackIds)
          .order("created_at", { ascending: false })
      : { data: [] };
    const latestSet = new Map<string, NonNullable<typeof sets>[number]>();
    for (const s of sets ?? []) if (!latestSet.has(s.track_id)) latestSet.set(s.track_id, s);

    const urls = await signedAudioUrls((tracks ?? []).map((t) => t.audio_path ?? ""));
    const genreLabel = new Map((genres ?? []).map((g) => [g.id, g]));
    const genreName = (id: string | null) => {
      const g = id ? genreLabel.get(id) : null;
      if (!g) return null;
      const parent = g.parent_id ? genreLabel.get(g.parent_id) : null;
      return parent ? `${parent.label}, ${g.label}` : g.label;
    };

    const trackRows = (tracks ?? []).map((t) => {
      const set = latestSet.get(t.id);
      const splits = (set?.splits ?? []).map((s) => ({
        personId: s.person_id,
        name: s.people?.name ?? "",
        role: s.role,
        shareBp: s.share_bp,
        hasAccount: !!s.people?.user_id,
      }));
      return {
        id: t.id,
        position: t.position,
        title: t.title,
        isrc: t.isrc,
        durationMs: t.duration_ms,
        aiDeclaration: t.ai_declaration,
        lufs: t.lufs == null ? null : Number(t.lufs),
        truePeak: t.true_peak == null ? null : Number(t.true_peak),
        genre: genreName(t.genre_id),
        explicit: t.explicit,
        flaggedAt: t.flagged_at,
        flagReason: t.flag_reason,
        takenDownAt: t.taken_down_at,
        descriptorIds: t.track_descriptors.map((d) => d.descriptor_id),
        audioUrl: t.audio_path ? (urls.get(t.audio_path) ?? null) : null,
        gainDb: playbackGainDb({
          targetLufs: settings.loudnessTargetLufs,
          trackLufs: t.lufs == null ? null : Number(t.lufs),
          truePeakDb: t.true_peak == null ? null : Number(t.true_peak),
        }),
        splits,
        splitTotal: splits.reduce((a, s) => a + s.shareBp, 0),
        splitConfirmed: !!set?.confirmed_at,
      };
    });

    const gates = openGates({
      release,
      tracks: trackRows.map((t) => ({
        id: t.id,
        title: t.title,
        ai_declaration: t.aiDeclaration,
        splitTotal: t.splitTotal,
        splitConfirmed: t.splitConfirmed,
      })),
      issues: issues ?? [],
      acceptedAi: settings.acceptedAiAnswers,
    });

    return {
      canDecide: caller.roles.includes("admin"),
      release: {
        id: release.id,
        title: release.title,
        type: release.type,
        state: release.state,
        version: release.version,
        upc: release.upc,
        label: release.label,
        pLine: release.p_line,
        artworkUrl: release.artwork_url,
        rightsStatus: release.rights_status,
        rightsConfirmedAt: release.rights_confirmed_at,
        splitsConfirmedAt: release.splits_confirmed_at,
        packReleaseDate: release.pack_release_date,
        reviewNote: release.review_note,
        artistName: release.artists?.public_name ?? "",
        artistRegion: release.artists?.region ?? null,
        cohort: release.artists?.cohort ?? null,
      },
      tracks: trackRows,
      issues: issues ?? [],
      events: events ?? [],
      descriptors: descriptors ?? [],
      gates,
      acceptedAi: settings.acceptedAiAnswers,
    };
  });

export const decideRelease = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    valid(
      z
        .object({
          id: uuid,
          decision: z.enum(["approve", "hold", "reject"]),
          reason: z.string().trim().max(2000).default(""),
          listened: z.array(uuid).default([]),
        })
        .refine((v) => v.decision === "approve" || v.reason.length > 0, {
          message: "Hold and Reject need a reason.",
        }),
      d,
    ),
  )
  .handler(async ({ context, data }) => {
    const { requireRole, db, audit, getSettings } = await import("./auth.server");
    await requireRole(context.userId, "admin");
    const sb = await db();
    const { data: release } = await sb.from("releases").select("*").eq("id", data.id).single();
    if (!release) throw new Error("We couldn't find that release.");
    // CAT-4: decisions only from a reviewable state.
    if (!["in_review", "held", "needs_attention"].includes(release.state)) {
      throw new Error(
        `This release is ${release.state.replace("_", " ")}, so it can't be decided now.`,
      );
    }

    let next: "live" | "scheduled" | "held" | "rejected";
    if (data.decision === "approve") {
      const settings = await getSettings();
      const [{ data: tracks }, { data: issues }] = await Promise.all([
        sb.from("tracks").select("id,title,ai_declaration").eq("release_id", data.id),
        sb.from("release_issues").select("outcome,cleared_at,code").eq("release_id", data.id),
      ]);
      const ids = (tracks ?? []).map((t) => t.id);
      const { data: sets } = ids.length
        ? await sb
            .from("split_sets")
            .select("track_id,confirmed_at,created_at,splits(share_bp)")
            .in("track_id", ids)
            .order("created_at", { ascending: false })
        : { data: [] };
      const latest = new Map<string, { confirmed: boolean; total: number }>();
      for (const s of sets ?? []) {
        if (!latest.has(s.track_id))
          latest.set(s.track_id, {
            confirmed: !!s.confirmed_at,
            total: s.splits.reduce((a, x) => a + x.share_bp, 0),
          });
      }
      const gates = openGates({
        release,
        tracks: (tracks ?? []).map((t) => ({
          id: t.id,
          title: t.title,
          ai_declaration: t.ai_declaration,
          splitTotal: latest.get(t.id)?.total ?? 0,
          splitConfirmed: latest.get(t.id)?.confirmed ?? false,
        })),
        issues: issues ?? [],
        acceptedAi: settings.acceptedAiAnswers,
      });
      const unheard = (tracks ?? []).filter((t) => !data.listened.includes(t.id));
      if (unheard.length)
        gates.push(
          `Nothing is approved unheard: listen to ${unheard.map((t) => `“${t.title}”`).join(", ")}.`,
        );
      if (gates.length) throw new Error(`Can't approve yet. ${gates.join(" ")}`);
      const today = new Date().toISOString().slice(0, 10);
      next = release.pack_release_date && release.pack_release_date > today ? "scheduled" : "live";
    } else {
      next = data.decision === "hold" ? "held" : "rejected";
    }

    const now = new Date().toISOString();
    const { error } = await sb
      .from("releases")
      .update({
        state: next,
        reviewed_by: context.userId,
        reviewed_at: now,
        review_note: data.reason || null,
      })
      .eq("id", data.id)
      .eq("state", release.state);
    if (error) throw new Error(error.message);
    await sb.from("release_events").insert({
      release_id: data.id,
      from_state: release.state,
      to_state: next,
      actor: context.userId,
      reason: data.reason || null,
    });
    await audit({
      actor: context.userId,
      action: `release.${data.decision}`,
      target: data.id,
      before: { state: release.state },
      after: { state: next },
      reason: data.reason,
    });
    return { state: next };
  });

export const clearIssue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    valid(z.object({ issueId: uuid, note: z.string().trim().min(1).max(1000) }), d),
  )
  .handler(async ({ context, data }) => {
    const { requireRole, db, audit } = await import("./auth.server");
    await requireRole(context.userId, "admin");
    const sb = await db();
    const { data: issue } = await sb
      .from("release_issues")
      .select("*")
      .eq("id", data.issueId)
      .single();
    if (!issue) throw new Error("Issue not found.");
    if (issue.outcome === "reject")
      throw new Error(
        "A rejected check is fixed by the artist sending a new version, not cleared here.",
      );
    await sb
      .from("release_issues")
      .update({ cleared_at: new Date().toISOString() })
      .eq("id", data.issueId);
    await audit({
      actor: context.userId,
      action: "release.clear_issue",
      target: issue.release_id,
      before: issue,
      reason: data.note,
    });
    return { ok: true as const };
  });

export const setTrackDescriptors = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    valid(
      z.object({
        trackIds: z.array(uuid).min(1).max(200),
        descriptorIds: z.array(z.string().max(60)).max(40),
        mode: z.enum(["replace", "add"]).default("replace"),
      }),
      d,
    ),
  )
  .handler(async ({ context, data }) => {
    const { requireRole, db, audit } = await import("./auth.server");
    await requireRole(context.userId, "curator");
    const sb = await db();
    if (data.mode === "replace")
      await sb.from("track_descriptors").delete().in("track_id", data.trackIds);
    const rows = data.trackIds.flatMap((track_id) =>
      data.descriptorIds.map((descriptor_id) => ({ track_id, descriptor_id })),
    );
    if (rows.length) {
      const { error } = await sb
        .from("track_descriptors")
        .upsert(rows, { onConflict: "track_id,descriptor_id", ignoreDuplicates: true });
      if (error) throw new Error(error.message);
    }
    await audit({
      actor: context.userId,
      action: "tracks.tag",
      target: data.trackIds.join(","),
      after: data.descriptorIds,
    });
    return { ok: true as const };
  });

/** RTS-4 takedown and RTS-6 disputed AI declaration. Both leave every playlist and player at once. */
export const moderateTrack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    valid(
      z.object({
        trackId: uuid,
        action: z.enum(["takedown", "flag", "unflag", "restore"]),
        reason: z.string().trim().min(1).max(1000),
      }),
      d,
    ),
  )
  .handler(async ({ context, data }) => {
    const { requireRole, db, audit } = await import("./auth.server");
    await requireRole(context.userId, "admin");
    const sb = await db();
    const now = new Date().toISOString();
    const patch =
      data.action === "takedown"
        ? { taken_down_at: now }
        : data.action === "restore"
          ? { taken_down_at: null }
          : data.action === "flag"
            ? { flagged_at: now, flag_reason: data.reason }
            : { flagged_at: null, flag_reason: null };
    const { data: before } = await sb
      .from("tracks")
      .select("taken_down_at,flagged_at,flag_reason")
      .eq("id", data.trackId)
      .single();
    const { error } = await sb.from("tracks").update(patch).eq("id", data.trackId);
    if (error) throw new Error(error.message);
    await audit({
      actor: context.userId,
      action: `track.${data.action}`,
      target: data.trackId,
      before,
      after: patch,
      reason: data.reason,
    });
    return { ok: true as const };
  });

// ---------------------------------------------------------------------------
// Sites (D4, ADM-5)
// ---------------------------------------------------------------------------

export const listSites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireRole, db } = await import("./auth.server");
    await requireRole(context.userId, "admin");
    const sb = await db();
    const now = new Date();
    const perthMidnight = new Date(
      new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Perth" }).format(now) +
        "T00:00:00+08:00",
    ).toISOString();
    const weekAgo = new Date(now.getTime() - 7 * 86400_000).toISOString();
    const [{ data: sites }, { data: assignments }, { data: skips }, { data: regions }] =
      await Promise.all([
        sb.from("sites").select("*,businesses(name,owner_user_id)").order("name"),
        sb
          .from("site_assignments")
          .select("site_id,starts_at,playlist_versions(version,playlists(name))")
          .lte("starts_at", now.toISOString())
          .order("starts_at", { ascending: false }),
        sb.from("skips").select("site_id,reason,created_at").gte("created_at", weekAgo),
        sb.from("regions").select("code,name").order("sort_order"),
      ]);
    const current = new Map<string, { playlist: string; version: number }>();
    for (const a of assignments ?? []) {
      if (!current.has(a.site_id) && a.playlist_versions) {
        current.set(a.site_id, {
          playlist: a.playlist_versions.playlists?.name ?? "",
          version: a.playlist_versions.version,
        });
      }
    }
    const reasons: Record<string, number> = {};
    for (const s of skips ?? []) reasons[s.reason] = (reasons[s.reason] ?? 0) + 1;
    return {
      sites: (sites ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        businessName: s.businesses?.name ?? "",
        hasOwner: !!s.businesses?.owner_user_id,
        address: s.address,
        region: s.region,
        shortCode: s.short_code,
        playerHours: `${s.player_start.slice(0, 5)}–${s.player_end.slice(0, 5)}`,
        lastHeartbeatAt: s.last_heartbeat_at,
        state: siteState(s.last_heartbeat_at, s.player_start, s.player_end, now),
        assignment: current.get(s.id) ?? null,
        skipsToday: (skips ?? []).filter((k) => k.site_id === s.id && k.created_at >= perthMidnight)
          .length,
      })),
      skipReasons: reasons,
      regions: regions ?? [],
    };
  });

export const createSite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    valid(
      z.object({
        businessName: z.string().trim().min(1).max(160),
        siteName: z.string().trim().min(1).max(160),
        address: z.string().trim().max(300).default(""),
        region: z.string().max(60).nullable(),
        businessType: z.string().trim().max(60).default("Café"),
        ownerEmail: z.string().trim().email().max(255),
      }),
      d,
    ),
  )
  .handler(async ({ context, data }) => {
    const { requireRole, db, audit, getSettings } = await import("./auth.server");
    await requireRole(context.userId, "admin");
    const sb = await db();
    const settings = await getSettings();
    const { data: business, error } = await sb
      .from("businesses")
      .insert({ name: data.businessName })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    const shortCode = await uniqueShortCode(data.siteName);
    const { data: site, error: siteError } = await sb
      .from("sites")
      .insert({
        business_id: business.id,
        name: data.siteName,
        address: data.address,
        region: data.region,
        business_type: data.businessType,
        short_code: shortCode,
        fee_cents: settings.siteFeeCents,
      })
      .select("id")
      .single();
    if (siteError) throw new Error(siteError.message);
    const { data: invite } = await sb
      .from("invites")
      .insert({
        email: data.ownerEmail.toLowerCase(),
        role: "business_owner",
        business_id: business.id,
        created_by: context.userId,
      })
      .select("token")
      .single();
    await audit({
      actor: context.userId,
      action: "site.create",
      target: site.id,
      after: { ...data, shortCode },
    });
    return { siteId: site.id, shortCode, inviteToken: invite?.token ?? null };
  });

async function uniqueShortCode(name: string) {
  const { db } = await import("./auth.server");
  const sb = await db();
  const letters = name.toLowerCase().replace(/[^a-z]/g, "");
  const candidates = [
    letters.slice(0, 3),
    letters.slice(0, 4),
    letters.slice(0, 5),
    letters.slice(0, 6),
  ].filter((c) => c.length >= 3);
  for (let i = 0; i < 20; i++) {
    const base = candidates[i] ?? "";
    const code =
      base.length >= 3 && i < candidates.length
        ? base
        : Array.from(
            { length: 4 },
            () => "abcdefghjkmnpqrstuvwxyz"[Math.floor(Math.random() * 23)],
          ).join("");
    const { data } = await sb.from("sites").select("id").eq("short_code", code).maybeSingle();
    if (!data) return code;
  }
  throw new Error("Couldn't make a unique short link. Try again.");
}

// ---------------------------------------------------------------------------
// Users and invites (D1, ADM-3, ADM-8, ACC-3)
// ---------------------------------------------------------------------------

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireRole, db } = await import("./auth.server");
    await requireRole(context.userId, "admin");
    const sb = await db();
    const [
      { data: profiles },
      { data: roles },
      { data: memberships },
      { data: artists },
      { data: businesses },
      { data: invites },
    ] = await Promise.all([
      sb
        .from("profiles")
        .select("user_id,email,display_name,deactivated_at,created_at")
        .order("created_at"),
      sb.from("user_roles").select("user_id,role"),
      sb.from("memberships").select("user_id,class"),
      sb.from("artists").select("user_id,public_name,cohort"),
      sb.from("businesses").select("owner_user_id,name"),
      sb
        .from("invites")
        .select("id,token,email,role,cohort,used_at,expires_at,created_at,businesses(name)")
        .is("used_at", null)
        .order("created_at", { ascending: false }),
    ]);
    const rolesOf = (id: string) =>
      (roles ?? []).filter((r) => r.user_id === id).map((r) => r.role);
    const people = (profiles ?? []).map((p) => {
      const r = rolesOf(p.user_id);
      const artist = (artists ?? []).find((a) => a.user_id === p.user_id);
      const business = (businesses ?? []).find((b) => b.owner_user_id === p.user_id);
      const needsMembership = r.includes("artist") || r.includes("business_owner");
      const member = (memberships ?? []).some((m) => m.user_id === p.user_id);
      return {
        kind: "user" as const,
        id: p.user_id,
        name: artist?.public_name ?? business?.name ?? p.display_name ?? p.email,
        email: p.email,
        roles: r,
        cohort: artist?.cohort ?? null,
        status: p.deactivated_at
          ? "Deactivated"
          : needsMembership && !member
            ? "Membership pending"
            : "Joined",
        deactivated: !!p.deactivated_at,
      };
    });
    const pending = (invites ?? []).map((i) => ({
      kind: "invite" as const,
      id: i.id,
      token: i.token,
      name: i.businesses?.name ?? i.email,
      email: i.email,
      roles: [i.role],
      cohort: i.cohort,
      status: new Date(i.expires_at) < new Date() ? "Invite expired" : "Invited",
      deactivated: false,
    }));
    const cohorts = [
      ...new Set([...people, ...pending].map((p) => p.cohort).filter((c): c is string => !!c)),
    ];
    return { rows: [...pending, ...people], cohorts };
  });

export const createInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    valid(
      z
        .object({
          email: z.string().trim().email().max(255),
          role: z.enum(["artist", "business_owner", "curator"]),
          cohort: z.string().trim().max(80).optional(),
          businessName: z.string().trim().max(160).optional(),
        })
        .refine((v) => v.role !== "business_owner" || !!v.businessName, {
          message: "A business invite needs the business name.",
        }),
      d,
    ),
  )
  .handler(async ({ context, data }) => {
    const { requireRole, db, audit } = await import("./auth.server");
    await requireRole(context.userId, "admin");
    const sb = await db();
    let businessId: string | null = null;
    if (data.role === "business_owner") {
      const { data: existing } = await sb
        .from("businesses")
        .select("id")
        .eq("name", data.businessName!)
        .is("owner_user_id", null)
        .maybeSingle();
      businessId =
        existing?.id ??
        (await sb.from("businesses").insert({ name: data.businessName! }).select("id").single())
          .data!.id;
    }
    const { data: invite, error } = await sb
      .from("invites")
      .insert({
        email: data.email.toLowerCase(),
        role: data.role,
        cohort: data.cohort || null,
        business_id: businessId,
        created_by: context.userId,
      })
      .select("id,token")
      .single();
    if (error) throw new Error(error.message);
    await audit({
      actor: context.userId,
      action: "invite.create",
      target: invite.id,
      after: {
        email: data.email,
        role: data.role,
        cohort: data.cohort,
        businessName: data.businessName,
      },
    });
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
    const { data: fresh } = await sb
      .from("invites")
      .insert({
        email: old.email,
        role: old.role,
        cohort: old.cohort,
        business_id: old.business_id,
        site_id: old.site_id,
        created_by: context.userId,
      })
      .select("id,token")
      .single();
    await audit({
      actor: context.userId,
      action: "invite.resend",
      target: fresh!.id,
      before: { invite: old.id },
    });
    return { token: fresh!.token };
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
// Policy settings (D5, ADM-4)
// ---------------------------------------------------------------------------

export const getPolicy = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { requireRole, db } = await import("./auth.server");
    await requireRole(context.userId, "admin");
    const sb = await db();
    const [{ data: rows }, { data: profiles }] = await Promise.all([
      sb.from("settings").select("key,value,changed_by,changed_at"),
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
  test_mode: z.boolean(),
  site_fee_cents: z.number().int().min(0).max(1_000_000),
  artist_share_bp: z.number().int().min(0).max(10000),
  play_threshold_seconds: z.number().int().min(1).max(600),
  payout_threshold_cents: z.number().int().min(0).max(1_000_000),
  loudness_target_lufs: z.number().min(-30).max(-5),
  accepted_ai_answers: z.array(z.enum(["no", "yes"])).min(1),
  playlist_rules: z.object({
    noArtistTwiceInARow: z.boolean(),
    repeatWindowMinutes: z.number().int().min(0).max(1440),
  }),
  feature_flags: z.record(z.boolean()),
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
