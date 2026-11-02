import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  Badge,
  Button,
  Field,
  Input,
  Loading,
  Notice,
  Panel,
  StateBadge,
  Table,
  Td,
  Textarea,
  errorMessage,
  formatDuration,
} from "@/components/app/ui";
import {
  clearIssue,
  decideRelease,
  getReleaseForReview,
  moderateTrack,
  setTrackDescriptors,
} from "@/lib/admin.functions";
import { dbToLinear } from "@/lib/loudness";

export const Route = createFileRoute("/admin/review/$id")({ component: ReviewRelease });

const RIGHTS: { value: string; label: string }[] = [
  { value: "unsigned", label: "Independent" },
  { value: "independent_label", label: "Label-signed (independent)" },
  { value: "distributor", label: "Distributor" },
  { value: "major_label", label: "Major label" },
  { value: "unknown", label: "Unknown" },
];

const FACETS: Record<string, string> = {
  setting: "Setting",
  energy: "Energy",
  time: "Time of day",
  vocals: "Vocals",
  tempo: "Tempo",
};

function ReviewRelease() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const q = useQuery({
    queryKey: ["admin", "review", id],
    queryFn: () => getReleaseForReview({ data: { id } }),
  });
  const [listened, setListened] = useState<Set<string>>(new Set());
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    setListened(new Set());
    setReason("");
    setMessage(null);
  }, [id]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "review", id] });
    queryClient.invalidateQueries({ queryKey: ["admin", "queue"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
  };

  const decide = useMutation({
    mutationFn: (decision: "approve" | "hold" | "reject") =>
      decideRelease({ data: { id, decision, reason, listened: [...listened] } }),
    onSuccess: (r) => {
      setMessage({ tone: "ok", text: `Done. The release is now ${r.state}.` });
      refresh();
    },
    onError: (e) => setMessage({ tone: "error", text: errorMessage(e) }),
  });

  if (q.isPending) return <Loading />;
  if (q.isError) return <Notice tone="error">{errorMessage(q.error)}</Notice>;
  const { release, tracks, issues, gates, canDecide, descriptors } = q.data;
  const unheard = tracks.filter((t) => !listened.has(t.id));
  const reviewable = ["in_review", "held", "needs_attention"].includes(release.state);
  const approveBlock =
    gates[0] ?? (unheard.length ? `Listen to “${unheard[0]!.title}” first.` : null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start gap-5">
        {release.artworkUrl ? (
          <img
            src={release.artworkUrl}
            alt=""
            className="h-28 w-28 rounded-xl border-2 border-ink object-cover"
          />
        ) : null}
        <div>
          <h2 className="text-3xl">
            {release.title}{" "}
            <span className="text-ink/60">
              ({release.type.toUpperCase()}), version {release.version}
            </span>
          </h2>
          <p className="mt-1 text-sm">
            {release.artistName}
            {release.cohort ? ` · ${release.cohort}` : ""} · UPC {release.upc ?? "none"}
            {release.packReleaseDate ? ` · goes live on The Pack ${release.packReleaseDate}` : ""}
          </p>
          <div className="mt-2">
            <StateBadge state={release.state} />
          </div>
        </div>
      </div>

      <CheckStrip tracks={tracks} issues={issues} gates={gates} />

      <Panel
        title="Tracks"
        kicker="Play each one. Preview uses the same levelling a business hears."
      >
        <Table head={["", "#", "Track", "AI", "LUFS", "Genre", "Explicit", "Length", ""]}>
          {tracks.map((t) => (
            <tr key={t.id} className={t.takenDownAt || t.flaggedAt ? "bg-pink-100" : ""}>
              <Td>
                <ListenButton
                  url={t.audioUrl}
                  gainDb={t.gainDb}
                  durationMs={t.durationMs}
                  heard={listened.has(t.id)}
                  onHeard={() => setListened((s) => new Set(s).add(t.id))}
                />
              </Td>
              <Td>{t.position}</Td>
              <Td>
                <span className="font-bold">{t.title}</span>
                <span className="block font-mono text-[0.7rem] text-ink/60">{t.isrc}</span>
                {t.takenDownAt ? (
                  <Badge className="mt-1 bg-ink text-paper">Taken down</Badge>
                ) : null}
                {t.flaggedAt ? (
                  <Badge className="mt-1 bg-pink text-paper">AI declaration disputed</Badge>
                ) : null}
              </Td>
              <Td>
                {t.aiDeclaration ? (
                  q.data.acceptedAi.includes(t.aiDeclaration) ? (
                    t.aiDeclaration === "no" ? (
                      "No"
                    ) : (
                      "Yes"
                    )
                  ) : (
                    <Badge className="bg-pink text-paper">{t.aiDeclaration}</Badge>
                  )
                ) : (
                  <Badge className="bg-pink text-paper">Missing</Badge>
                )}
              </Td>
              <Td className="font-mono">{t.lufs ?? "—"}</Td>
              <Td>{t.genre ?? "—"}</Td>
              <Td>{t.explicit ? "Yes" : "No"}</Td>
              <Td className="font-mono">{formatDuration(t.durationMs)}</Td>
              <Td>
                {canDecide ? (
                  <ModerateTrack
                    trackId={t.id}
                    takenDown={!!t.takenDownAt}
                    flagged={!!t.flaggedAt}
                    onDone={refresh}
                  />
                ) : null}
              </Td>
            </tr>
          ))}
        </Table>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Rights" kicker="From the artist's own declaration">
          <div className="flex flex-wrap gap-2">
            {RIGHTS.map((r) => (
              <Badge
                key={r.value}
                className={
                  release.rightsStatus === r.value
                    ? r.value === "major_label"
                      ? "bg-pink text-paper"
                      : "bg-green"
                    : "bg-paper text-ink/50"
                }
              >
                {r.label}
              </Badge>
            ))}
          </div>
          <p className="mt-3 text-sm text-ink/70">
            {release.rightsConfirmedAt
              ? `Declared ${new Date(release.rightsConfirmedAt).toLocaleDateString("en-AU")}.`
              : "Not declared yet."}{" "}
            Any label negotiation is the artist's, not The Pack's. No permission letter is needed or
            recorded (RTS-3).
          </p>
          {release.label ? (
            <p className="mt-2 text-sm">
              Label: {release.label}
              {release.pLine ? ` · ${release.pLine}` : ""}
            </p>
          ) : null}
        </Panel>

        <Panel
          title="Who gets paid"
          kicker={
            release.splitsConfirmedAt
              ? `Confirmed by the artist ${new Date(release.splitsConfirmedAt).toLocaleDateString("en-AU")}`
              : "Not confirmed by the artist yet"
          }
        >
          <div className="space-y-3 text-sm">
            {tracks.map((t) => (
              <div key={t.id}>
                <p className="font-bold">
                  {t.title}{" "}
                  {t.splitTotal === 10000 ? null : (
                    <Badge className="bg-pink text-paper">{t.splitTotal / 100}%</Badge>
                  )}
                  {t.splitConfirmed ? null : <Badge className="bg-yellow">Unconfirmed</Badge>}
                </p>
                <p className="text-ink/75">
                  {t.splits
                    .map(
                      (s) =>
                        `${s.name} (${s.role}) ${s.shareBp / 100}%${s.hasAccount ? "" : ", held until they join"}`,
                    )
                    .join(" · ") || "No splits"}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <TagEditor
        tracks={tracks.map((t) => ({ id: t.id, title: t.title, descriptorIds: t.descriptorIds }))}
        descriptors={descriptors}
        onSaved={refresh}
      />

      {issues.length ? <IssueList issues={issues} canClear={canDecide} onDone={refresh} /> : null}

      <Panel title="Decision" kicker="Every action is logged">
        {!canDecide ? (
          <Notice>
            Curators can review and tag, but only an admin can approve, hold or reject.
          </Notice>
        ) : !reviewable ? (
          <Notice>
            This release is {release.state.replace("_", " ")}, so there's nothing to decide.
          </Notice>
        ) : (
          <div className="space-y-4">
            <Field
              label="Reason"
              hint="Required for Hold and Reject. The artist sees it in plain words."
            >
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="What should the artist know?"
              />
            </Field>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="green"
                disabled={!!approveBlock || decide.isPending}
                onClick={() => decide.mutate("approve")}
              >
                Approve
              </Button>
              <Button
                variant="yellow"
                disabled={!reason.trim() || decide.isPending}
                onClick={() => decide.mutate("hold")}
              >
                Hold
              </Button>
              <Button
                variant="danger"
                disabled={!reason.trim() || decide.isPending}
                onClick={() => decide.mutate("reject")}
              >
                Reject
              </Button>
            </div>
            {approveBlock ? (
              <p className="text-sm font-bold text-ember">
                Approve is off: {approveBlock}
                {gates.length + unheard.length > 1
                  ? ` (+${gates.length + unheard.length - 1} more)`
                  : ""}
              </p>
            ) : null}
          </div>
        )}
        {message ? (
          <div className="mt-4">
            <Notice tone={message.tone}>{message.text}</Notice>
          </div>
        ) : null}
      </Panel>

      {q.data.events.length ? (
        <Panel title="History">
          <ul className="space-y-1 text-sm">
            {q.data.events.map((e) => (
              <li key={e.id}>
                <span className="font-mono text-xs text-ink/60">
                  {new Date(e.created_at).toLocaleString("en-AU")}
                </span>{" "}
                {e.from_state ? `${e.from_state} → ` : ""}
                {e.to_state}
                {e.reason ? ` · ${e.reason}` : ""}
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}

type Track = {
  id: string;
  title: string;
  aiDeclaration: string | null;
  lufs: number | null;
  splitTotal: number;
  splitConfirmed: boolean;
};

/** ADM-2: what passed, and what needed a person, in one strip. */
function CheckStrip({
  tracks,
  issues,
  gates,
}: {
  tracks: Track[];
  issues: { outcome: string; cleared_at: string | null }[];
  gates: string[];
}) {
  const items: { label: string; ok: boolean }[] = [
    { label: "Audio present", ok: tracks.length > 0 },
    {
      label: tracks.every((t) => t.aiDeclaration === "no")
        ? "AI: No, all tracks"
        : "AI answers need a look",
      ok: tracks.every((t) => t.aiDeclaration === "no"),
    },
    {
      label: tracks.every((t) => t.lufs != null) ? "Loudness on every track" : "Loudness missing",
      ok: tracks.every((t) => t.lufs != null),
    },
    {
      label: tracks.every((t) => t.splitTotal === 10000)
        ? "Splits total 100%"
        : "Splits don't total 100%",
      ok: tracks.every((t) => t.splitTotal === 10000),
    },
  ];
  const holds = issues.filter((i) => i.outcome === "hold");
  if (holds.length)
    items.push({
      label: `${holds.filter((h) => h.cleared_at).length} of ${holds.length} holds cleared`,
      ok: holds.every((h) => h.cleared_at),
    });
  items.push({
    label: gates.length
      ? `${gates.length} gate${gates.length > 1 ? "s" : ""} open`
      : "All gates closed",
    ok: gates.length === 0,
  });
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((i) => (
        <Badge key={i.label} className={i.ok ? "bg-green" : "bg-yellow"}>
          {i.ok ? "✓" : "!"} {i.label}
        </Badge>
      ))}
    </div>
  );
}

/**
 * Levelled playback that also records that the reviewer heard the track:
 * 30 seconds of listening, or reaching the end (RTS-2: nothing approved unheard).
 */
let stopOther: (() => void) | null = null;

function ListenButton({
  url,
  gainDb,
  durationMs,
  heard,
  onHeard,
}: {
  url: string | null;
  gainDb: number;
  durationMs: number;
  heard: boolean;
  onHeard: () => void;
}) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const el = useRef<HTMLAudioElement | null>(null);
  const ctx = useRef<AudioContext | null>(null);
  const listenedSeconds = useRef(0);
  const lastTime = useRef(0);

  useEffect(() => () => el.current?.pause(), []);

  function stop() {
    el.current?.pause();
    setPlaying(false);
  }

  async function play() {
    if (!url) return;
    stopOther?.();
    if (!el.current) {
      const audio = new Audio();
      audio.crossOrigin = "anonymous";
      audio.src = url;
      const context = new AudioContext();
      const gain = context.createGain();
      gain.gain.value = dbToLinear(gainDb);
      context.createMediaElementSource(audio).connect(gain).connect(context.destination);
      audio.ontimeupdate = () => {
        const delta = audio.currentTime - lastTime.current;
        if (delta > 0 && delta < 2) listenedSeconds.current += delta;
        lastTime.current = audio.currentTime;
        setProgress(audio.duration ? audio.currentTime / audio.duration : 0);
        if (listenedSeconds.current >= 30) onHeard();
      };
      audio.onended = () => {
        setPlaying(false);
        onHeard();
      };
      el.current = audio;
      ctx.current = context;
    }
    await ctx.current!.resume();
    await el.current.play();
    stopOther = stop;
    setPlaying(true);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={!url}
        onClick={() => (playing ? stop() : play())}
        aria-label={playing ? "Stop" : `Play, levelled ${gainDb} dB`}
        className="press inline-flex h-9 items-center gap-1 rounded-full bg-ink px-3 text-xs font-bold text-paper disabled:opacity-40"
      >
        {playing ? "■" : "▶"}
        <span className="font-mono text-[0.65rem] text-cyan">
          {gainDb > 0 ? "+" : ""}
          {gainDb} dB
        </span>
      </button>
      <span className="w-14">
        {heard ? (
          <Badge className="bg-green">Heard</Badge>
        ) : (
          <span
            className="block h-1.5 w-full rounded bg-ink/15"
            title={`${Math.round(durationMs / 1000)} s`}
          >
            <span
              className="block h-1.5 rounded bg-electric"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </span>
        )}
      </span>
    </div>
  );
}

function ModerateTrack({
  trackId,
  takenDown,
  flagged,
  onDone,
}: {
  trackId: string;
  takenDown: boolean;
  flagged: boolean;
  onDone: () => void;
}) {
  const [open, setOpen] = useState<null | "takedown" | "flag" | "unflag" | "restore">(null);
  const [reason, setReason] = useState("");
  const m = useMutation({
    mutationFn: () => moderateTrack({ data: { trackId, action: open!, reason } }),
    onSuccess: () => {
      setOpen(null);
      setReason("");
      onDone();
    },
  });
  if (open) {
    return (
      <div className="w-56 space-y-2">
        <Input
          placeholder="Reason (required)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="danger"
            disabled={!reason.trim() || m.isPending}
            onClick={() => m.mutate()}
          >
            Confirm
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setOpen(null)}>
            Cancel
          </Button>
        </div>
        {m.isError ? <p className="text-xs text-ember">{errorMessage(m.error)}</p> : null}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      <Button size="sm" variant="ghost" onClick={() => setOpen(takenDown ? "restore" : "takedown")}>
        {takenDown ? "Restore" : "Take down"}
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setOpen(flagged ? "unflag" : "flag")}>
        {flagged ? "Clear flag" : "Flag AI answer"}
      </Button>
    </div>
  );
}

/** TAX-2: business-fit tags, set by curators. Bulk: tick tracks, then apply. */
function TagEditor({
  tracks,
  descriptors,
  onSaved,
}: {
  tracks: { id: string; title: string; descriptorIds: string[] }[];
  descriptors: { id: string; facet: string; label: string }[];
  onSaved: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tags, setTags] = useState<Set<string>>(new Set());
  const save = useMutation({
    mutationFn: (mode: "replace" | "add") =>
      setTrackDescriptors({ data: { trackIds: [...selected], descriptorIds: [...tags], mode } }),
    onSuccess: () => {
      setSelected(new Set());
      setTags(new Set());
      onSaved();
    },
  });
  const label = new Map(descriptors.map((d) => [d.id, d.label]));
  const toggle = (set: Set<string>, id: string) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  };
  const facets = [...new Set(descriptors.map((d) => d.facet))];

  return (
    <Panel title="Business-fit tags" kicker="Curator layer: what a business owner would ask for">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <ul className="space-y-2 text-sm">
          {tracks.map((t) => (
            <li key={t.id}>
              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-electric"
                  checked={selected.has(t.id)}
                  onChange={() => setSelected((s) => toggle(s, t.id))}
                />
                <span>
                  <span className="font-bold">{t.title}</span>
                  <span className="block text-xs text-ink/70">
                    {t.descriptorIds.map((d) => label.get(d) ?? d).join(" · ") || "No tags yet"}
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
        <div className="space-y-3">
          {facets.map((f) => (
            <div key={f}>
              <p className="mono-kicker text-ink/60">{FACETS[f] ?? f}</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {descriptors
                  .filter((d) => d.facet === f)
                  .map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setTags((s) => toggle(s, d.id))}
                      className={`rounded-full border-2 border-ink px-2.5 py-0.5 text-xs font-bold ${tags.has(d.id) ? "bg-electric text-paper" : "bg-paper"}`}
                    >
                      {d.label}
                    </button>
                  ))}
              </div>
            </div>
          ))}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              size="sm"
              disabled={!selected.size || !tags.size || save.isPending}
              onClick={() => save.mutate("add")}
            >
              Add to {selected.size || "selected"} track{selected.size === 1 ? "" : "s"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={!selected.size || save.isPending}
              onClick={() => save.mutate("replace")}
            >
              Replace tags
            </Button>
          </div>
          {save.isError ? <p className="text-xs text-ember">{errorMessage(save.error)}</p> : null}
        </div>
      </div>
    </Panel>
  );
}

function IssueList({
  issues,
  canClear,
  onDone,
}: {
  issues: {
    id: string;
    code: string;
    outcome: string;
    message: string;
    fixed_by: string;
    cleared_at: string | null;
  }[];
  canClear: boolean;
  onDone: () => void;
}) {
  const [note, setNote] = useState<Record<string, string>>({});
  const clear = useMutation({
    mutationFn: (issueId: string) => clearIssue({ data: { issueId, note: note[issueId] ?? "" } }),
    onSuccess: onDone,
  });
  const tone = { reject: "bg-pink text-paper", hold: "bg-yellow", warn: "bg-cyan-200" } as Record<
    string,
    string
  >;
  return (
    <Panel title="Checks" kicker="Every error has a code, a plain message and who fixes it">
      <ul className="space-y-3">
        {issues.map((i) => (
          <li key={i.id} className="rounded-xl border-2 border-ink bg-paper p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={tone[i.outcome] ?? ""}>
                {i.outcome === "reject"
                  ? "Can't continue"
                  : i.outcome === "hold"
                    ? "On hold"
                    : "Note"}
              </Badge>
              <span className="font-mono text-xs">
                {i.code} · fixed by {i.fixed_by}
              </span>
              {i.cleared_at ? <Badge className="bg-green">Cleared</Badge> : null}
            </div>
            <p className="mt-2">{i.message}</p>
            {canClear && i.outcome === "hold" && !i.cleared_at ? (
              <div className="mt-2 flex flex-wrap gap-2">
                <Input
                  className="!mt-0 max-w-sm"
                  placeholder="Note on how you checked it"
                  value={note[i.id] ?? ""}
                  onChange={(e) => setNote({ ...note, [i.id]: e.target.value })}
                />
                <Button
                  size="sm"
                  variant="yellow"
                  disabled={!note[i.id]?.trim() || clear.isPending}
                  onClick={() => clear.mutate(i.id)}
                >
                  Clear hold
                </Button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </Panel>
  );
}
