import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { useMe } from "@/components/app/guard";
import { LevelledPreview } from "@/components/app/LevelledPreview";
import { ImageUpload, uploadFile } from "@/components/admin/upload";
import {
  Badge,
  Button,
  Check,
  Field,
  Input,
  Loading,
  Notice,
  PageTitle,
  Panel,
  Select,
  StateBadge,
  Textarea,
  errorMessage,
  formatDuration,
} from "@/components/app/ui";
import { isValidIsrc, isValidUpc } from "@/lib/identifiers";
import {
  attachTrackAudio,
  getMusicOptions,
  getRelease,
  saveRelease,
  setReleaseState,
  setTrackDescriptors,
  setTrackTakedown,
} from "@/lib/music.functions";

export const Route = createFileRoute("/admin/music/releases/$id")({
  validateSearch: z.object({ artist: z.string().uuid().optional() }),
  component: ReleaseEditor,
});

type TrackForm = {
  key: string;
  id?: string;
  title: string;
  isrc: string;
  explicit: boolean;
  genreId: string;
  aiDeclaration: "" | "no" | "yes";
  story: string;
  descriptorIds: string[];
  // From the server, read-only here.
  audioUrl: string | null;
  hasAudio: boolean;
  durationMs: number;
  lufs: number | null;
  truePeak: number | null;
  gainDb: number;
  takenDown: boolean;
  inPlaylist: boolean;
};

type Form = {
  artistId: string;
  title: string;
  type: "single" | "ep" | "album";
  upc: string;
  label: string;
  pLine: string;
  originalReleaseDate: string;
  artworkUrl: string | null;
  tracks: TrackForm[];
};

const FACETS: Record<string, string> = {
  setting: "Setting",
  energy: "Energy",
  time: "Time of day",
  vocals: "Vocals",
  tempo: "Tempo",
};

let keySeq = 0;
const newKey = () => `t${++keySeq}`;

function blankTrack(): TrackForm {
  return {
    key: newKey(),
    title: "",
    isrc: "",
    explicit: false,
    genreId: "",
    aiDeclaration: "",
    story: "",
    descriptorIds: [],
    audioUrl: null,
    hasAudio: false,
    durationMs: 0,
    lufs: null,
    truePeak: null,
    gainDb: 0,
    takenDown: false,
    inPlaylist: false,
  };
}

type ReleaseData = Awaited<ReturnType<typeof getRelease>>;

function toForm(r: ReleaseData): Form {
  return {
    artistId: r.artist_id,
    title: r.title,
    type: r.type,
    upc: r.upc ?? "",
    label: r.label ?? "",
    pLine: r.p_line ?? "",
    originalReleaseDate: r.original_release_date ?? "",
    artworkUrl: r.artwork_url,
    tracks: r.tracks.map((t) => ({
      key: t.id,
      id: t.id,
      title: t.title,
      isrc: t.isrc ?? "",
      explicit: t.explicit,
      genreId: t.genre_id ?? "",
      aiDeclaration: (t.ai_declaration as "no" | "yes" | null) ?? "",
      story: t.story,
      descriptorIds: t.descriptorIds,
      audioUrl: t.audioUrl,
      hasAudio: !!t.audio_path,
      durationMs: t.duration_ms,
      lufs: t.lufs,
      truePeak: t.true_peak,
      gainDb: t.gainDb,
      takenDown: !!t.taken_down_at,
      inPlaylist: t.inPlaylist,
    })),
  };
}

/** What's saved, as a comparable string, so we know when there are unsaved edits. */
function editable(f: Form) {
  return JSON.stringify({
    ...f,
    tracks: f.tracks.map(
      ({ id, title, isrc, explicit, genreId, aiDeclaration, story, descriptorIds }) => ({
        id,
        title,
        isrc,
        explicit,
        genreId,
        aiDeclaration,
        story,
        descriptorIds: [...descriptorIds].sort(),
      }),
    ),
  });
}

/** Release editor: details, songs, audio with measured loudness, then publish. */
function ReleaseEditor() {
  const { id } = Route.useParams();
  const search = Route.useSearch();
  const isNew = id === "new";
  const me = useMe();
  const isAdmin = !!me.data?.roles.includes("admin");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const options = useQuery({
    queryKey: ["admin", "music-options"],
    queryFn: () => getMusicOptions(),
  });
  const release = useQuery({
    queryKey: ["admin", "release", id],
    queryFn: () => getRelease({ data: { id } }),
    enabled: !isNew,
  });
  const [form, setForm] = useState<Form | null>(null);
  const [saved, setSaved] = useState<string>("");
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (form) return;
    if (isNew && options.data) {
      const f: Form = {
        artistId: search.artist ?? options.data.artists[0]?.id ?? "",
        title: "",
        type: "single",
        upc: "",
        label: "",
        pLine: "",
        originalReleaseDate: "",
        artworkUrl: null,
        tracks: [blankTrack()],
      };
      setForm(f);
      setSaved("");
    } else if (release.data) {
      const f = toForm(release.data);
      setForm(f);
      setSaved(editable(f));
    }
  }, [isNew, options.data, release.data, form, search.artist]);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin", "release", id] });
    queryClient.invalidateQueries({ queryKey: ["admin", "catalogue"] });
  };

  const save = useMutation({
    mutationFn: () =>
      saveRelease({
        data: {
          ...(isNew ? {} : { id }),
          artistId: form!.artistId,
          title: form!.title,
          type: form!.type,
          upc: form!.upc.trim() || null,
          label: form!.label.trim() || null,
          pLine: form!.pLine.trim() || null,
          originalReleaseDate: form!.originalReleaseDate || null,
          artworkUrl: form!.artworkUrl,
          tracks: form!.tracks.map((t) => ({
            ...(t.id ? { id: t.id } : {}),
            title: t.title,
            isrc: t.isrc.trim() || null,
            explicit: t.explicit,
            genreId: t.genreId || null,
            aiDeclaration: t.aiDeclaration || null,
            story: t.story,
            descriptorIds: t.descriptorIds,
          })),
        },
      }),
    onSuccess: async (r) => {
      setMessage({ tone: "ok", text: "Saved." });
      if (isNew) {
        queryClient.invalidateQueries({ queryKey: ["admin", "catalogue"] });
        navigate({ to: "/admin/music/releases/$id", params: { id: r.id } });
        return;
      }
      await refresh();
      setForm(null); // reload from the server, so new songs get their ids
    },
    onError: (e) => setMessage({ tone: "error", text: errorMessage(e) }),
  });

  const changeState = useMutation({
    mutationFn: (state: "draft" | "live" | "withdrawn") => setReleaseState({ data: { id, state } }),
    onSuccess: async (_r, state) => {
      setMessage({
        tone: "ok",
        text:
          state === "live"
            ? "Live. Listeners can find it, and curators can add its songs to playlists."
            : state === "withdrawn"
              ? "Withdrawn. It's off the listener app and out of every playlist."
              : "Back to draft. Listeners can't see it.",
      });
      await refresh();
      setForm(null);
    },
    onError: (e) => setMessage({ tone: "error", text: errorMessage(e) }),
  });

  // Reset the form whenever we move to a different release.
  const lastId = useRef(id);
  useEffect(() => {
    if (lastId.current !== id) {
      lastId.current = id;
      setForm(null);
      setMessage(null);
    }
  }, [id]);

  if (release.isError) return <Notice tone="error">{errorMessage(release.error)}</Notice>;
  if (!form || options.isPending || !options.data) return <Loading />;
  const opts = options.data;
  const dirty = isNew || editable(form) !== saved;
  const state = release.data?.state ?? "draft";
  const set = (patch: Partial<Form>) => setForm({ ...form, ...patch });
  const setTrack = (key: string, patch: Partial<TrackForm>) =>
    setForm({ ...form, tracks: form.tracks.map((t) => (t.key === key ? { ...t, ...patch } : t)) });
  const move = (i: number, by: number) => {
    const next = [...form.tracks];
    const [x] = next.splice(i, 1);
    next.splice(i + by, 0, x!);
    set({ tracks: next });
  };

  const upcProblem =
    form.upc.trim() && !isValidUpc(form.upc.replace(/\s/g, ""))
      ? "12 or 13 digits with a valid check digit."
      : null;
  const publishProblems = release.data
    ? release.data.tracks.length === 0
      ? ["Add at least one song."]
      : release.data.tracks
          .filter((t) => !t.audio_path)
          .map((t) => `“${t.title}” has no audio yet.`)
    : ["Save the release first."];

  const parents = opts.genres.filter((g) => !g.parent_id);

  return (
    <>
      <Link to="/admin/music" className="font-mono text-xs uppercase tracking-[0.2em] underline">
        ‹ All music
      </Link>
      <PageTitle
        kicker={isNew ? "New release" : "Release"}
        title={form.title || "Untitled release"}
        actions={!isNew ? <StateBadge state={state} /> : null}
      />

      {!isAdmin ? (
        <div className="mb-6">
          <Notice>
            You can tag songs for curation here. Only admins can change the release or publish it.
          </Notice>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[24rem_minmax(0,1fr)]">
        <div className="space-y-6">
          <Panel title="Release details">
            <fieldset disabled={!isAdmin} className="space-y-4">
              <Field label="Artist">
                <Select value={form.artistId} onChange={(e) => set({ artistId: e.target.value })}>
                  {opts.artists.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </Select>
              </Field>
              {opts.artists.length === 0 ? (
                <p className="text-xs text-ember">
                  Add an artist first.{" "}
                  <Link to="/admin/music/artists/$id" params={{ id: "new" }} className="underline">
                    New artist
                  </Link>
                </p>
              ) : null}
              <Field label="Title">
                <Input
                  required
                  value={form.title}
                  onChange={(e) => set({ title: e.target.value })}
                />
              </Field>
              <Field label="Type">
                <Select
                  value={form.type}
                  onChange={(e) => set({ type: e.target.value as Form["type"] })}
                >
                  <option value="single">Single</option>
                  <option value="ep">EP</option>
                  <option value="album">Album</option>
                </Select>
              </Field>
              <Field
                label="UPC (optional)"
                hint={
                  upcProblem ? (
                    <span className="font-bold text-ember">{upcProblem}</span>
                  ) : (
                    "The barcode number for the release, if it has one."
                  )
                }
              >
                <Input
                  inputMode="numeric"
                  value={form.upc}
                  onChange={(e) => set({ upc: e.target.value })}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Label">
                  <Input
                    value={form.label}
                    onChange={(e) => set({ label: e.target.value })}
                    placeholder="Independent"
                  />
                </Field>
                <Field label="First released">
                  <Input
                    type="date"
                    value={form.originalReleaseDate}
                    onChange={(e) => set({ originalReleaseDate: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="℗ line">
                <Input
                  value={form.pLine}
                  onChange={(e) => set({ pLine: e.target.value })}
                  placeholder="℗ 2026 The Southerlies"
                />
              </Field>
              <ImageUpload
                label="Artwork"
                scope="releases"
                value={form.artworkUrl}
                onChange={(artworkUrl) => set({ artworkUrl })}
                disabled={!isAdmin}
              />
            </fieldset>
          </Panel>

          {isAdmin ? (
            <Panel title="Publish" kicker="Only live releases reach listeners">
              {isNew ? (
                <p className="text-sm text-ink/70">
                  Save the release, add the audio, then publish.
                </p>
              ) : (
                <div className="space-y-3">
                  {state !== "live" ? (
                    <>
                      {publishProblems.length ? (
                        <ul className="list-disc pl-5 text-sm text-ember">
                          {publishProblems.map((p) => (
                            <li key={p}>{p}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm">Every song has audio. Ready to go.</p>
                      )}
                      {dirty ? (
                        <p className="text-xs text-ember">Save your changes before publishing.</p>
                      ) : null}
                      <Button
                        variant="green"
                        disabled={dirty || changeState.isPending}
                        onClick={() => changeState.mutate("live")}
                      >
                        {state === "withdrawn" ? "Put it back live" : "Publish"}
                      </Button>
                    </>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="ghost"
                        disabled={changeState.isPending}
                        onClick={() => changeState.mutate("draft")}
                      >
                        Unpublish
                      </Button>
                      <Button
                        variant="danger"
                        disabled={changeState.isPending}
                        onClick={() => changeState.mutate("withdrawn")}
                      >
                        Withdraw
                      </Button>
                    </div>
                  )}
                  {state === "withdrawn" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={changeState.isPending}
                      onClick={() => changeState.mutate("draft")}
                    >
                      Back to draft
                    </Button>
                  ) : null}
                </div>
              )}
            </Panel>
          ) : null}
        </div>

        <Panel
          title={`Songs (${form.tracks.length})`}
          kicker="Loudness is measured when the audio uploads"
          actions={
            isAdmin ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => set({ tracks: [...form.tracks, blankTrack()] })}
              >
                Add a song
              </Button>
            ) : null
          }
        >
          <ol className="space-y-4">
            {form.tracks.map((t, i) => (
              <li
                key={t.key}
                className={`rounded-2xl border-2 border-ink bg-paper p-4 ${t.takenDown ? "opacity-70" : ""}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-bold">{i + 1}.</span>
                  <span className="min-w-0 flex-1 truncate font-bold">
                    {t.title || "Untitled song"}
                  </span>
                  {t.takenDown ? <Badge className="bg-ink text-paper">Taken down</Badge> : null}
                  {t.explicit ? <Badge className="bg-pink text-paper">E</Badge> : null}
                  {isAdmin ? (
                    <>
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
                        disabled={i === form.tracks.length - 1}
                        onClick={() => move(i, 1)}
                        className="px-1 disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        aria-label="Remove song"
                        disabled={t.inPlaylist}
                        title={
                          t.inPlaylist
                            ? "This song is in a playlist. Take it down instead."
                            : undefined
                        }
                        onClick={() => set({ tracks: form.tracks.filter((x) => x.key !== t.key) })}
                        className="px-1 font-bold text-ember disabled:opacity-30"
                      >
                        ×
                      </button>
                    </>
                  ) : null}
                </div>

                <fieldset disabled={!isAdmin} className="mt-3 grid gap-3 md:grid-cols-2">
                  <Field label="Title">
                    <Input
                      value={t.title}
                      onChange={(e) => setTrack(t.key, { title: e.target.value })}
                    />
                  </Field>
                  <Field
                    label="ISRC (optional)"
                    hint={
                      t.isrc.trim() && !isValidIsrc(t.isrc) ? (
                        <span className="font-bold text-ember">
                          12 characters, like AU-XXX-26-00001.
                        </span>
                      ) : undefined
                    }
                  >
                    <Input
                      value={t.isrc}
                      onChange={(e) => setTrack(t.key, { isrc: e.target.value })}
                      placeholder="AU-XXX-26-00001"
                    />
                  </Field>
                  <Field label="Genre">
                    <Select
                      value={t.genreId}
                      onChange={(e) => setTrack(t.key, { genreId: e.target.value })}
                    >
                      <option value="">Not set</option>
                      {parents.map((p) => (
                        <optgroup key={p.id} label={p.label}>
                          <option value={p.id}>{p.label}</option>
                          {opts.genres
                            .filter((g) => g.parent_id === p.id)
                            .map((g) => (
                              <option key={g.id} value={g.id}>
                                {p.label}, {g.label}
                              </option>
                            ))}
                        </optgroup>
                      ))}
                    </Select>
                  </Field>
                  <Field
                    label="AI declaration"
                    hint="Did the artist use AI at any stage? A declaration, not detection."
                  >
                    <Select
                      value={t.aiDeclaration}
                      onChange={(e) =>
                        setTrack(t.key, {
                          aiDeclaration: e.target.value as TrackForm["aiDeclaration"],
                        })
                      }
                    >
                      <option value="">Not recorded</option>
                      <option value="no">No AI used</option>
                      <option value="yes">Yes, AI was used</option>
                    </Select>
                  </Field>
                  <div className="md:col-span-2">
                    <Field label="Story (optional)" hint="The artist's own words about the song.">
                      <Textarea
                        rows={2}
                        value={t.story}
                        onChange={(e) => setTrack(t.key, { story: e.target.value })}
                      />
                    </Field>
                  </div>
                  <div className="md:col-span-2">
                    <Check
                      checked={t.explicit}
                      onChange={(explicit) => setTrack(t.key, { explicit })}
                    >
                      Explicit lyrics
                    </Check>
                  </div>
                </fieldset>

                <TagPicker
                  descriptors={opts.descriptors}
                  value={t.descriptorIds}
                  onChange={(descriptorIds) => setTrack(t.key, { descriptorIds })}
                />
                {!isAdmin && t.id ? (
                  <SaveTags trackId={t.id} descriptorIds={t.descriptorIds} />
                ) : null}

                <div className="mt-4 flex flex-wrap items-center gap-3 border-t-2 border-ink/10 pt-3">
                  {t.hasAudio ? (
                    <>
                      <LevelledPreview url={t.audioUrl} gainDb={t.gainDb} />
                      <span className="font-mono text-xs">
                        {formatDuration(t.durationMs)} ·{" "}
                        {t.lufs == null ? "loudness not measured" : `${t.lufs} LUFS`}
                        {t.truePeak == null ? "" : ` · peak ${t.truePeak} dBTP`}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm font-bold text-ember">No audio yet</span>
                  )}
                  {isAdmin ? (
                    t.id ? (
                      <AudioUpload
                        releaseId={id}
                        trackId={t.id}
                        hasAudio={t.hasAudio}
                        onDone={async () => {
                          setMessage(null);
                          await refresh();
                          const fresh = queryClient.getQueryData<ReleaseData>([
                            "admin",
                            "release",
                            id,
                          ]);
                          const ft = fresh?.tracks.find((x) => x.id === t.id);
                          if (ft)
                            setTrack(t.key, {
                              audioUrl: ft.audioUrl,
                              hasAudio: !!ft.audio_path,
                              durationMs: ft.duration_ms,
                              lufs: ft.lufs,
                              truePeak: ft.true_peak,
                              gainDb: ft.gainDb,
                            });
                        }}
                      />
                    ) : (
                      <span className="text-xs text-ink/60">
                        Save the release to add audio for this song.
                      </span>
                    )
                  ) : null}
                  {isAdmin && t.id ? (
                    <TakedownToggle
                      trackId={t.id}
                      takenDown={t.takenDown}
                      onDone={(takenDown) => {
                        setTrack(t.key, { takenDown });
                        refresh();
                      }}
                    />
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
          {form.tracks.length === 0 ? <p className="text-sm text-ink/60">No songs yet.</p> : null}
        </Panel>
      </div>

      {isAdmin ? (
        <div className="sticky bottom-0 z-30 -mx-4 mt-6 flex flex-wrap items-center gap-3 border-t-2 border-ink bg-paper/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
          <Button
            variant="ember"
            disabled={!dirty || save.isPending || !form.artistId || !!upcProblem}
            onClick={() => save.mutate()}
          >
            {save.isPending ? "Saving…" : isNew ? "Create release" : "Save changes"}
          </Button>
          {dirty && !isNew ? <span className="text-sm text-ink/70">Unsaved changes</span> : null}
          {message ? (
            <span className={`text-sm font-bold ${message.tone === "error" ? "text-ember" : ""}`}>
              {message.text}
            </span>
          ) : null}
        </div>
      ) : message ? (
        <div className="mt-4">
          <Notice tone={message.tone}>{message.text}</Notice>
        </div>
      ) : null}
    </>
  );
}

function TagPicker({
  descriptors,
  value,
  onChange,
}: {
  descriptors: { id: string; facet: string; label: string }[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="mt-3 space-y-1.5">
      <p className="text-xs font-bold uppercase tracking-widest">Business-fit tags</p>
      {Object.keys(FACETS).map((facet) => (
        <div key={facet} className="flex flex-wrap items-center gap-1">
          <span className="w-24 shrink-0 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-ink/60">
            {FACETS[facet]}
          </span>
          {descriptors
            .filter((d) => d.facet === facet)
            .map((d) => {
              const on = value.includes(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onChange(on ? value.filter((x) => x !== d.id) : [...value, d.id])}
                  className={`rounded-full border-2 border-ink px-2 py-0.5 text-[0.7rem] font-bold ${on ? "bg-electric text-paper" : "bg-paper"}`}
                >
                  {d.label}
                </button>
              );
            })}
        </div>
      ))}
    </div>
  );
}

/** Curators save tags one song at a time; admins save them with the release. */
function SaveTags({ trackId, descriptorIds }: { trackId: string; descriptorIds: string[] }) {
  const save = useMutation({
    mutationFn: () => setTrackDescriptors({ data: { trackId, descriptorIds } }),
  });
  return (
    <div className="mt-2 flex items-center gap-2">
      <Button size="sm" variant="ghost" disabled={save.isPending} onClick={() => save.mutate()}>
        Save tags
      </Button>
      {save.isSuccess ? <span className="text-xs">Saved.</span> : null}
      {save.isError ? (
        <span className="text-xs font-bold text-ember">{errorMessage(save.error)}</span>
      ) : null}
    </div>
  );
}

function AudioUpload({
  releaseId,
  trackId,
  hasAudio,
  onDone,
}: {
  releaseId: string;
  trackId: string;
  hasAudio: boolean;
  onDone: () => Promise<void> | void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <input
        ref={input}
        type="file"
        accept="audio/*,.wav,.flac,.mp3,.m4a,.aac"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setError(null);
          try {
            setStatus("Uploading…");
            const { path } = await uploadFile("audio", releaseId, file);
            setStatus("Measuring loudness…");
            await attachTrackAudio({ data: { trackId, path } });
            await onDone();
            setStatus(null);
          } catch (err) {
            setStatus(null);
            setError(errorMessage(err));
          }
        }}
      />
      <Button
        size="sm"
        variant={hasAudio ? "ghost" : "primary"}
        disabled={!!status}
        onClick={() => input.current?.click()}
      >
        {status ?? (hasAudio ? "Replace audio" : "Upload audio")}
      </Button>
      {error ? <span className="text-xs font-bold text-ember">{error}</span> : null}
    </>
  );
}

function TakedownToggle({
  trackId,
  takenDown,
  onDone,
}: {
  trackId: string;
  takenDown: boolean;
  onDone: (takenDown: boolean) => void;
}) {
  const toggle = useMutation({
    mutationFn: () => setTrackTakedown({ data: { trackId, takenDown: !takenDown } }),
    onSuccess: () => onDone(!takenDown),
  });
  return (
    <span className="ml-auto flex items-center gap-2">
      <Button
        size="sm"
        variant={takenDown ? "green" : "danger"}
        disabled={toggle.isPending}
        onClick={() => toggle.mutate()}
      >
        {takenDown ? "Put back" : "Take down"}
      </Button>
      {toggle.isError ? (
        <span className="text-xs font-bold text-ember">{errorMessage(toggle.error)}</span>
      ) : null}
    </span>
  );
}
