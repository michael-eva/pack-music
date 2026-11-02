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
 * Month-end (PAY-6): a person runs a dry-run, reviews totals and exceptions,
 * then approves to post. Approval recomputes from the same plays and the
 * settings captured at dry-run, and refuses if anything moved since.
 * Months are calendar months in UTC for the pilot.
 */

const monthSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "Pick a month like 2026-10"),
});

function monthBounds(month: string) {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1));
  return {
    start: start.toISOString(),
    end: end.toISOString(),
    date: start.toISOString().slice(0, 10),
  };
}

type Snapshot = {
  artistShareBp: number;
  playThresholdSeconds: number;
  payoutThresholdCents: number;
  testMode: boolean;
};

async function computeFor(month: string, snapshot?: Snapshot) {
  const { db, getSettings } = await import("./auth.server");
  const { computeMonth } = await import("./ledger/engine");
  const sb = await db();
  const settings =
    snapshot ??
    (({ artistShareBp, playThresholdSeconds, payoutThresholdCents, testMode }) => ({
      artistShareBp,
      playThresholdSeconds,
      payoutThresholdCents,
      testMode,
    }))(await getSettings());
  const { start, end } = monthBounds(month);

  const plays: { site_id: string; track_id: string; seconds_played: number }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb
      .from("play_events")
      .select("site_id,track_id,seconds_played")
      .gte("started_at", start)
      .lt("started_at", end)
      .order("id")
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    plays.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }

  // A site has a pot for the month if it existed by then, or was played in it.
  const playedSites = new Set(plays.map((p) => p.site_id));
  const { data: siteRows } = await sb
    .from("sites")
    .select("id,name,fee_cents,created_at")
    .order("name");
  const sites = (siteRows ?? []).filter((s) => s.created_at < end || playedSites.has(s.id));

  const trackIds = [...new Set(plays.map((p) => p.track_id))];
  const { data: trackRows } = trackIds.length
    ? await sb
        .from("tracks")
        .select("id,title,flagged_at,releases(title,artists(public_name))")
        .in("id", trackIds)
    : { data: [] };
  const { data: sets } = trackIds.length
    ? await sb
        .from("split_sets")
        .select("track_id,confirmed_at,created_at,splits(person_id,share_bp)")
        .in("track_id", trackIds)
        .not("confirmed_at", "is", null)
        .order("created_at", { ascending: false })
    : { data: [] };
  const latest = new Map<string, { personId: string; shareBp: number }[]>();
  for (const s of sets ?? []) {
    if (!latest.has(s.track_id))
      latest.set(
        s.track_id,
        s.splits.map((x) => ({ personId: x.person_id, shareBp: x.share_bp })),
      );
  }
  const tracks = new Map(
    (trackRows ?? []).map((t) => [
      t.id,
      { splits: latest.get(t.id) ?? null, held: !!t.flagged_at },
    ]),
  );

  const result = computeMonth({
    sites: sites.map((s) => ({ siteId: s.id, feeCents: Number(s.fee_cents) })),
    plays: plays.map((p) => ({
      siteId: p.site_id,
      trackId: p.track_id,
      secondsPlayed: p.seconds_played,
    })),
    tracks,
    settings,
  });

  const personIds = [...new Set(result.entries.map((e) => e.personId))];
  const { data: people } = personIds.length
    ? await sb.from("people").select("id,name,email,user_id").in("id", personIds)
    : { data: [] };
  return {
    settings,
    result,
    names: {
      sites: Object.fromEntries(sites.map((s) => [s.id, s.name])),
      tracks: Object.fromEntries(
        (trackRows ?? []).map((t) => [
          t.id,
          {
            title: t.title,
            artist: t.releases?.artists?.public_name ?? "",
            release: t.releases?.title ?? "",
          },
        ]),
      ),
      people: Object.fromEntries(
        (people ?? []).map((p) => [
          p.id,
          { name: p.name, email: p.email, hasAccount: !!p.user_id },
        ]),
      ),
    },
    rawPlays: plays.length,
  };
}

async function describe(
  month: string,
  computed: Awaited<ReturnType<typeof computeFor>>,
  run: { id: string; state: string; created_at: string; approved_at: string | null } | null,
) {
  const { db } = await import("./auth.server");
  const sb = await db();
  const { date } = monthBounds(month);
  const { result, names, settings } = computed;

  // Balances: everything already posted for each person before this month, plus this run (PAY-7).
  const personIds = Object.keys(names.people);
  const { data: posted } = personIds.length
    ? await sb
        .from("ledger_entries")
        .select("person_id,cents,type,month")
        .in("person_id", personIds)
    : { data: [] };
  const people = personIds.map((id) => {
    const thisMonth = result.entries.filter((e) => e.personId === id);
    const accrued = thisMonth.filter((e) => e.type === "accrual").reduce((a, e) => a + e.cents, 0);
    const held = thisMonth.filter((e) => e.type === "hold").reduce((a, e) => a + e.cents, 0);
    const earlier = (posted ?? []).filter(
      (p) =>
        p.person_id === id &&
        p.month !== date &&
        (p.type === "accrual" ||
          p.type === "adjustment" ||
          p.type === "release" ||
          p.type === "payout"),
    );
    const balance = earlier.reduce((a, p) => a + Number(p.cents), 0) + accrued;
    return {
      personId: id,
      ...names.people[id]!,
      accruedCents: accrued,
      heldCents: held,
      balanceCents: balance,
      wouldBePaid: balance >= settings.payoutThresholdCents,
    };
  });

  return {
    month,
    run,
    settings,
    pots: result.pots.map((p) => ({ ...p, siteName: names.sites[p.siteId] ?? p.siteId })),
    entries: result.entries.map((e) => ({
      ...e,
      siteName: names.sites[e.siteId] ?? "",
      trackTitle: names.tracks[e.trackId]?.title ?? "",
      artistName: names.tracks[e.trackId]?.artist ?? "",
      personName: names.people[e.personId]?.name ?? "",
      artistPoolCents: result.pots.find((p) => p.siteId === e.siteId)?.artistPoolCents ?? 0,
    })),
    exceptions: result.exceptions.map((x) => ({
      ...x,
      siteName: names.sites[x.siteId] ?? "",
      trackTitle: "trackId" in x ? (names.tracks[x.trackId]?.title ?? "") : null,
    })),
    people: people.sort((a, b) => b.accruedCents - a.accruedCents),
    unclaimed: people.filter((p) => !p.hasAccount),
    reconciliation: result.reconciliation,
    rawPlays: computed.rawPlays,
  };
}

export const getMonth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => valid(monthSchema, d))
  .handler(async ({ context, data }) => {
    const { requireRole, db } = await import("./auth.server");
    await requireRole(context.userId, "admin");
    const sb = await db();
    const { date } = monthBounds(data.month);
    const { data: runs } = await sb
      .from("month_runs")
      .select("*")
      .eq("month", date)
      .order("created_at", { ascending: false });
    const run = runs?.find((r) => r.state === "approved") ?? runs?.[0] ?? null;
    if (!run) return { month: data.month, run: null, report: null };
    const snapshot = (run.settings_snapshot as { settings?: Snapshot }).settings;
    const computed = await computeFor(data.month, snapshot);
    return {
      month: data.month,
      run: {
        id: run.id,
        state: run.state,
        created_at: run.created_at,
        approved_at: run.approved_at,
      },
      report: await describe(data.month, computed, run),
    };
  });

export const runDryRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => valid(monthSchema, d))
  .handler(async ({ context, data }) => {
    const { requireRole, db, audit } = await import("./auth.server");
    await requireRole(context.userId, "admin");
    const sb = await db();
    const { date } = monthBounds(data.month);
    const { data: approved } = await sb
      .from("month_runs")
      .select("id")
      .eq("month", date)
      .eq("state", "approved")
      .maybeSingle();
    if (approved)
      throw new Error(
        "This month is already approved and locked. Corrections are posted as adjustments, not a re-run.",
      );

    const computed = await computeFor(data.month);
    const { result, settings } = computed;
    const { data: run, error } = await sb
      .from("month_runs")
      .insert({
        month: date,
        state: "dry_run",
        created_by: context.userId,
        settings_snapshot: {
          settings,
          reconciliation: result.reconciliation,
          entryCount: result.entries.length,
        } as never,
      })
      .select("id,state,created_at,approved_at")
      .single();
    if (error) throw new Error(error.message);
    if (result.pots.length) {
      await sb.from("site_pots").insert(
        result.pots.map((p) => ({
          run_id: run.id,
          site_id: p.siteId,
          fee_cents: p.feeCents,
          artist_pool_cents: p.artistPoolCents,
          pack_cents: p.packCents,
          qualified_plays: p.qualifiedPlays,
        })),
      );
    }
    await audit({
      actor: context.userId,
      action: "ledger.dry_run",
      target: data.month,
      after: result.reconciliation,
    });
    return describe(data.month, computed, run);
  });

export const approveRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => valid(z.object({ runId: z.string().uuid() }), d))
  .handler(async ({ context, data }) => {
    const { requireRole, db, audit } = await import("./auth.server");
    await requireRole(context.userId, "admin");
    const sb = await db();
    const { data: run } = await sb.from("month_runs").select("*").eq("id", data.runId).single();
    if (!run) throw new Error("Run not found.");
    if (run.state === "approved") throw new Error("This month is already approved and locked.");
    const { data: other } = await sb
      .from("month_runs")
      .select("id")
      .eq("month", run.month)
      .eq("state", "approved")
      .maybeSingle();
    if (other)
      throw new Error(
        "This month is already approved and locked. Re-running an approved month is refused.",
      );

    const stored = run.settings_snapshot as {
      settings: Snapshot;
      reconciliation: { accruedCents: number; heldCents: number; artistPoolCents: number };
      entryCount: number;
    };
    const month = run.month.slice(0, 7);
    const computed = await computeFor(month, stored.settings);
    const r = computed.result.reconciliation;
    if (
      r.accruedCents !== stored.reconciliation.accruedCents ||
      r.heldCents !== stored.reconciliation.heldCents ||
      r.artistPoolCents !== stored.reconciliation.artistPoolCents ||
      computed.result.entries.length !== stored.entryCount
    ) {
      throw new Error(
        "Plays or splits changed since this dry-run. Run the dry-run again and review it before approving.",
      );
    }
    if (r.differenceCents !== 0)
      throw new Error("The run doesn't reconcile to $0.00, so it can't be posted.");

    // Lock first: the unique index on approved months makes a double approve impossible.
    const { error: lockError } = await sb
      .from("month_runs")
      .update({
        state: "approved",
        approved_by: context.userId,
        approved_at: new Date().toISOString(),
      })
      .eq("id", run.id)
      .eq("state", "dry_run");
    if (lockError) {
      if (lockError.code === "23505") throw new Error("This month is already approved and locked.");
      throw new Error(lockError.message);
    }
    const rows = computed.result.entries.map((e) => ({
      run_id: run.id,
      type: e.type,
      person_id: e.personId,
      track_id: e.trackId,
      site_id: e.siteId,
      month: run.month,
      cents: e.cents,
      plays: e.plays,
      pot_plays: e.potPlays,
      share_bp: e.shareBp,
    }));
    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await sb.from("ledger_entries").insert(rows.slice(i, i + 500));
      if (error) throw new Error(`Posting failed: ${error.message}`);
    }
    await audit({
      actor: context.userId,
      action: "ledger.approve",
      target: month,
      after: { entries: rows.length, ...r },
    });
    return { posted: rows.length };
  });

/** PAY-13: play log for rights reporting, one row per play. */
export const playLogCsv = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => valid(monthSchema, d))
  .handler(async ({ context, data }) => {
    const { requireRole, db, getSettings } = await import("./auth.server");
    await requireRole(context.userId, "admin");
    const sb = await db();
    const settings = await getSettings();
    const { start, end } = monthBounds(data.month);
    const { data: rows, error } = await sb
      .from("play_events")
      .select(
        "id,started_at,seconds_played,sites(name),tracks(title,isrc,releases(title,upc,artists(public_name)))",
      )
      .gte("started_at", start)
      .lt("started_at", end)
      .order("started_at")
      .limit(100000);
    if (error) throw new Error(error.message);
    const esc = (v: unknown) => `"${String(v ?? "").replaceAll('"', '""')}"`;
    const lines = [
      [
        "play_id",
        "started_at",
        "site",
        "track",
        "isrc",
        "artist",
        "release",
        "upc",
        "seconds_played",
        "qualified",
      ].join(","),
      ...(rows ?? []).map((r) =>
        [
          r.id,
          r.started_at,
          r.sites?.name,
          r.tracks?.title,
          r.tracks?.isrc,
          r.tracks?.releases?.artists?.public_name,
          r.tracks?.releases?.title,
          r.tracks?.releases?.upc,
          r.seconds_played,
          r.seconds_played >= settings.playThresholdSeconds ? "yes" : "no",
        ]
          .map(esc)
          .join(","),
      ),
    ];
    return { filename: `pack-play-log-${data.month}.csv`, csv: lines.join("\n") };
  });
