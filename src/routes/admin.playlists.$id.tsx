import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { LevelledPreview } from "@/components/app/LevelledPreview";
import {
  Badge,
  Button,
  Check,
  Field,
  Input,
  Loading,
  Notice,
  Panel,
  Select,
  errorMessage,
  formatDuration,
} from "@/components/app/ui";
import {
  deletePlaylist,
  getBuilder,
  publishVersion,
  updatePlaylistDetails,
} from "@/lib/curation.functions";
import { ImageUpload } from "@/components/admin/upload";
import { checkPlaylist } from "@/lib/playlist-rules";

export const Route = createFileRoute("/admin/playlists/$id")({ component: Builder });

const FACETS: Record<string, string> = {
  setting: "Setting",
  energy: "Energy",
  time: "Time of day",
  vocals: "Vocals",
  tempo: "Tempo",
};

type Filters = {
  text: string;
  parentGenre: string;
  genre: string;
  region: string;
  descriptors: string[];
  explicit: "exclude" | "any";
  lufsMin: string;
  lufsMax: string;
};

const NO_FILTERS: Filters = {
  text: "",
  parentGenre: "",
  genre: "",
  region: "",
  descriptors: [],
  explicit: "exclude",
  lufsMin: "",
  lufsMax: "",
};

/** D3: filter, pick by hand, check the rules as you go, preview levelled, publish a version, feature it. */
function Builder() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const q = useQuery({
    queryKey: ["admin", "builder", id],
    queryFn: () => getBuilder({ data: { id } }),
  });
  const [draft, setDraft] = useState<string[] | null>(null);
  const [curatedBy, setCuratedBy] = useState("");
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [ack, setAck] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (q.data && draft === null) {
      setDraft(q.data.versions[0]?.trackIds ?? []);
      setCuratedBy(q.data.playlist.curatedBy);
    }
  }, [q.data, draft]);

  const byId = useMemo(() => new Map((q.data?.catalogue ?? []).map((t) => [t.id, t])), [q.data]);
  const list = (draft ?? [])
    .map((tid) => byId.get(tid))
    .filter((t): t is NonNullable<typeof t> => !!t);
  const dropped = (draft ?? []).length - list.length;
  const issues = q.data ? checkPlaylist(list, q.data.rules) : [];
  const breaks = issues.filter((i) => i.severity === "break");
  const flagged = new Set(issues.flatMap((i) => i.positions));

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "builder", id] });
    queryClient.invalidateQueries({ queryKey: ["admin", "playlists"] });
  };

  const publish = useMutation({
    mutationFn: () =>
      publishVersion({
        data: {
          playlistId: id,
          curatedBy,
          trackIds: list.map((t) => t.id),
          acknowledgeBreaks: ack,
        },
      }),
    onSuccess: (r) => {
      setMessage({
        tone: "ok",
        text: `Published version ${r.version}. Listeners hear it straight away.`,
      });
      setAck(false);
      refresh();
    },
    onError: (e) => setMessage({ tone: "error", text: errorMessage(e) }),
  });
  if (q.isPending || draft === null) return <Loading />;
  if (q.isError) return <Notice tone="error">{errorMessage(q.error)}</Notice>;
  const d = q.data;

  const parents = d.genres.filter((g) => !g.parent_id);
  const subs = d.genres.filter(
    (g) => g.parent_id && (!filters.parentGenre || g.parent_id === filters.parentGenre),
  );
  const inDraft = new Set(draft);
  const matches = d.catalogue.filter((t) => {
    if (
      filters.text &&
      !`${t.title} ${t.artistName}`.toLowerCase().includes(filters.text.toLowerCase())
    )
      return false;
    if (filters.parentGenre && t.parentGenreId !== filters.parentGenre) return false;
    if (filters.genre && t.genreId !== filters.genre) return false;
    if (filters.region && t.region !== filters.region) return false;
    if (filters.explicit === "exclude" && t.explicit) return false;
    if (filters.descriptors.some((x) => !t.descriptorIds.includes(x))) return false;
    if (filters.lufsMin && (t.lufs == null || t.lufs < Number(filters.lufsMin))) return false;
    if (filters.lufsMax && (t.lufs == null || t.lufs > Number(filters.lufsMax))) return false;
    return true;
  });
  const regionName = new Map(d.regions.map((r) => [r.code, r.name]));
  const total = list.reduce((a, t) => a + t.durationMs, 0);
  const move = (i: number, by: number) => {
    const next = [...draft];
    const [x] = next.splice(i, 1);
    next.splice(i + by, 0, x!);
    setDraft(next);
  };
  const latest = d.versions[0];
  const unchanged =
    !!latest &&
    latest.trackIds.join() === list.map((t) => t.id).join() &&
    curatedBy === d.playlist.curatedBy;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            to="/admin/playlists"
            className="font-mono text-xs uppercase tracking-[0.2em] underline"
          >
            ‹ All playlists
          </Link>
          <h1 className="mt-2 text-4xl">{d.playlist.name}</h1>
          <p className="mt-1 text-sm text-ink/70">
            {latest
              ? `Published up to v${latest.version}. Editing makes a new version.`
              : "Draft, not published yet."}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[17rem_minmax(0,1fr)_minmax(0,1fr)]">
        <Panel title="Filters" kicker="Filters narrow. A person picks.">
          <div className="space-y-3">
            <Field label="Search">
              <Input
                value={filters.text}
                onChange={(e) => setFilters({ ...filters, text: e.target.value })}
                placeholder="Title or artist"
              />
            </Field>
            <Field label="Genre">
              <Select
                value={filters.parentGenre}
                onChange={(e) => setFilters({ ...filters, parentGenre: e.target.value, genre: "" })}
              >
                <option value="">Any</option>
                {parents.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Sub-genre">
              <Select
                value={filters.genre}
                onChange={(e) => setFilters({ ...filters, genre: e.target.value })}
              >
                <option value="">Any</option>
                {subs.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Artist's region">
              <Select
                value={filters.region}
                onChange={(e) => setFilters({ ...filters, region: e.target.value })}
              >
                <option value="">Any</option>
                {d.regions.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </Field>
            {Object.keys(FACETS).map((facet) => (
              <div key={facet}>
                <p className="text-xs font-bold uppercase tracking-widest">{FACETS[facet]}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {d.descriptors
                    .filter((x) => x.facet === facet)
                    .map((x) => {
                      const on = filters.descriptors.includes(x.id);
                      return (
                        <button
                          key={x.id}
                          type="button"
                          onClick={() =>
                            setFilters({
                              ...filters,
                              descriptors: on
                                ? filters.descriptors.filter((y) => y !== x.id)
                                : [...filters.descriptors, x.id],
                            })
                          }
                          className={`rounded-full border-2 border-ink px-2 py-0.5 text-[0.7rem] font-bold ${on ? "bg-electric text-paper" : "bg-paper"}`}
                        >
                          {x.label}
                        </button>
                      );
                    })}
                </div>
              </div>
            ))}
            <div className="grid grid-cols-2 gap-2">
              <Field label="LUFS from">
                <Input
                  type="number"
                  step="0.5"
                  value={filters.lufsMin}
                  onChange={(e) => setFilters({ ...filters, lufsMin: e.target.value })}
                />
              </Field>
              <Field label="to">
                <Input
                  type="number"
                  step="0.5"
                  value={filters.lufsMax}
                  onChange={(e) => setFilters({ ...filters, lufsMax: e.target.value })}
                />
              </Field>
            </div>
            <Check
              checked={filters.explicit === "any"}
              onChange={(v) => setFilters({ ...filters, explicit: v ? "any" : "exclude" })}
            >
              Include explicit lyrics
            </Check>
            <Button size="sm" variant="ghost" onClick={() => setFilters(NO_FILTERS)}>
              Clear filters
            </Button>
          </div>
        </Panel>

        <Panel title={`Matches (${matches.length})`} kicker="Live songs only">
          <ul className="divide-y divide-ink/15">
            {matches.map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-2.5">
                <LevelledPreview url={t.audioUrl} gainDb={t.gainDb} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">
                    {t.title} {t.explicit ? <Badge className="bg-pink text-paper">E</Badge> : null}
                  </p>
                  <p className="truncate text-xs text-ink/70">
                    {t.artistName} ·{" "}
                    {t.region ? (regionName.get(t.region) ?? t.region) : "No region"} ·{" "}
                    {formatDuration(t.durationMs)}
                    {t.genreLabel ? ` · ${t.genreLabel}` : ""}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={inDraft.has(t.id) ? "ghost" : "primary"}
                  onClick={() => setDraft([...draft, t.id])}
                >
                  {inDraft.has(t.id) ? "Add again" : "Add"}
                </Button>
              </li>
            ))}
          </ul>
          {matches.length === 0 ? (
            <p className="text-sm text-ink/60">Nothing matches these filters.</p>
          ) : null}
        </Panel>

        <div className="space-y-6">
          <Panel
            title="Running order"
            kicker={`${list.length} songs · ${formatDuration(total)} before it loops`}
          >
            <Field label="Curated by" hint="Required. Shown as “Curated by …” wherever this plays.">
              <Input value={curatedBy} onChange={(e) => setCuratedBy(e.target.value)} />
            </Field>
            <ol className="mt-4 space-y-1.5">
              {list.map((t, i) => (
                <li
                  key={`${t.id}-${i}`}
                  className={`flex items-center gap-2 rounded-lg border-2 px-2 py-1.5 ${flagged.has(i) ? "border-ember bg-ember-100" : "border-transparent"}`}
                >
                  <span className="w-6 font-mono text-xs">{i + 1}.</span>
                  <LevelledPreview url={t.audioUrl} gainDb={t.gainDb} />
                  <span className="min-w-0 flex-1 truncate text-sm">
                    <span className="font-bold">{t.title}</span> · {t.artistName}
                  </span>
                  <span className="font-mono text-xs">{formatDuration(t.durationMs)}</span>
                  <button
                    type="button"
                    aria-label="Move up"
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                    className="px-1 disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label="Move down"
                    disabled={i === list.length - 1}
                    onClick={() => move(i, 1)}
                    className="px-1 disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    aria-label="Remove"
                    onClick={() => setDraft(draft.filter((_, j) => j !== i))}
                    className="px-1 font-bold text-ember"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ol>
            {list.length === 0 ? (
              <p className="mt-3 text-sm text-ink/60">Add songs from the matches.</p>
            ) : null}
            {dropped > 0 ? (
              <p className="mt-2 text-xs text-ember">
                {dropped} song(s) from the last version are no longer live and were left out.
              </p>
            ) : null}

            <div className="mt-4 space-y-2">
              <div className="flex flex-wrap gap-2">
                <Badge
                  className={
                    issues.some((i) => i.kind === "artist_twice")
                      ? "bg-ember text-paper"
                      : "bg-green"
                  }
                >
                  No artist twice in a row
                </Badge>
                <Badge
                  className={
                    issues.some((i) => i.kind === "repeat_window" || i.kind === "loop_short")
                      ? "bg-ember text-paper"
                      : "bg-green"
                  }
                >
                  No repeat in {Math.round(d.rules.repeatWindowMinutes / 60)} hours
                </Badge>
              </div>
              {issues.map((i, n) => (
                <p
                  key={n}
                  className={`text-sm ${i.severity === "break" ? "font-bold text-ember" : "text-ink/75"}`}
                >
                  {i.severity === "break" ? "Rule break: " : "Note: "}
                  {i.message}
                </p>
              ))}
            </div>

            <div className="mt-5 space-y-3 border-t-2 border-ink/15 pt-4">
              {breaks.length ? (
                <Check checked={ack} onChange={setAck}>
                  I've seen the rule breaks and want to publish anyway.
                </Check>
              ) : null}
              <Button
                variant="ember"
                disabled={
                  !list.length ||
                  !curatedBy.trim() ||
                  (breaks.length > 0 && !ack) ||
                  unchanged ||
                  publish.isPending
                }
                onClick={() => publish.mutate()}
              >
                Publish as v{(latest?.version ?? 0) + 1}
              </Button>
              {!curatedBy.trim() ? (
                <p className="text-xs text-ember">
                  A playlist can't publish without a named curator.
                </p>
              ) : null}
              {unchanged ? (
                <p className="text-xs text-ink/60">No changes since v{latest!.version}.</p>
              ) : null}
            </div>
          </Panel>

          <DetailsPanel
            key={`${d.playlist.id}-${d.versions.length}`}
            playlist={d.playlist}
            published={d.versions.some((v) => v.publishedAt)}
            onSaved={refresh}
          />
        </div>
      </div>

      {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}

      <Panel
        title="Exposure across published playlists"
        kicker="Shown so no artist is favoured by accident. Information only, never a ranking."
      >
        <ul className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
          {d.exposure.map((e) => (
            <li key={e.artistId} className="rounded-xl border-2 border-ink bg-paper px-3 py-2">
              <p className="font-bold">{e.name}</p>
              <p className="text-xs text-ink/70">
                {e.region ? (regionName.get(e.region) ?? e.region) : "No region"} · {e.slots} slot
                {e.slots === 1 ? "" : "s"}
              </p>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

type Details = {
  id: string;
  name: string;
  description: string;
  coverUrl: string | null;
  featured: boolean;
  featuredOrder: number;
};

/** Name, description, cover and the listener-home spot. Saved straight away: no new version needed. */
function DetailsPanel({
  playlist,
  published,
  onSaved,
}: {
  playlist: Details & { curatedBy: string };
  published: boolean;
  onSaved: () => void;
}) {
  const navigate = useNavigate();
  const [form, setForm] = useState<Details>({
    id: playlist.id,
    name: playlist.name,
    description: playlist.description,
    coverUrl: playlist.coverUrl,
    featured: playlist.featured,
    featuredOrder: playlist.featuredOrder,
  });
  const save = useMutation({
    mutationFn: () => updatePlaylistDetails({ data: form }),
    onSuccess: onSaved,
  });
  const remove = useMutation({
    mutationFn: () => deletePlaylist({ data: { id: playlist.id } }),
    onSuccess: () => navigate({ to: "/admin/playlists" }),
  });
  return (
    <Panel title="Details" kicker="Saved straight away, no new version">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <Field label="Name">
          <Input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>
        <Field label="Description" hint="Shown to listeners under the title.">
          <Input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Slow coffee, big windows, the local songs turned low."
          />
        </Field>
        <ImageUpload
          label="Cover"
          scope="playlists"
          value={form.coverUrl}
          onChange={(coverUrl) => setForm({ ...form, coverUrl })}
        />
        <Check checked={form.featured} onChange={(featured) => setForm({ ...form, featured })}>
          Featured on the listener home
        </Check>
        {form.featured ? (
          <Field label="Order on the home page" hint="Lower numbers show first.">
            <Input
              type="number"
              min={0}
              max={999}
              value={form.featuredOrder}
              onChange={(e) =>
                setForm({ ...form, featuredOrder: Math.round(Number(e.target.value)) })
              }
            />
          </Field>
        ) : null}
        {!published && form.featured ? (
          <p className="text-xs text-ember">Publish a version first, then it can be featured.</p>
        ) : null}
        {save.isError ? <Notice tone="error">{errorMessage(save.error)}</Notice> : null}
        {save.isSuccess && !save.isPending ? <Notice tone="ok">Saved.</Notice> : null}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={save.isPending}>
            Save details
          </Button>
          {!published ? (
            <Button
              variant="danger"
              disabled={remove.isPending}
              onClick={() => {
                if (window.confirm(`Delete “${playlist.name}”? It has never been published.`))
                  remove.mutate();
              }}
            >
              Delete playlist
            </Button>
          ) : null}
        </div>
        {remove.isError ? <Notice tone="error">{errorMessage(remove.error)}</Notice> : null}
      </form>
    </Panel>
  );
}
