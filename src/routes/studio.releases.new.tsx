import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
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
import { supabase } from "@/integrations/supabase/client";
import {
  createUploadUrl,
  getRelease,
  getReleaseOptions,
  saveRelease,
  submitRelease,
  type ReleaseDraft,
} from "@/lib/studio.functions";

export const Route = createFileRoute("/studio/releases/new")({
  validateSearch: z.object({ id: z.string().uuid().optional() }),
  component: ReleaseBuilder,
});

/*
 * C4, adapted. MetaGen hasn't delivered a package format yet, so the artist
 * fills in the field contract (section 4) here. When the package arrives this
 * screen becomes the upload portal and these fields come from the package.
 */

type Contributor = {
  key: string;
  personId: string | null;
  name: string;
  email: string;
  ipi: string;
  role: string;
  share: string;
  hasAccount?: boolean;
};
type TrackForm = {
  key: string;
  id: string | null;
  title: string;
  versionTitle: string;
  isrc: string;
  iswc: string;
  explicit: boolean | null;
  language: string;
  genreId: string;
  aiDeclaration: "no" | "yes" | null;
  story: string;
  audioPath: string | null;
  durationMs: number;
  lufs: number | null;
  uploading: number | null; // percent, while uploading
  contributors: Contributor[];
};
type Form = Omit<ReleaseDraft, "tracks" | "id"> & { id: string | null; tracks: TrackForm[] };

const RIGHTS: { value: NonNullable<Form["rightsStatus"]>; label: string }[] = [
  { value: "unsigned", label: "Independent, no label" },
  { value: "independent_label", label: "Signed to an independent label" },
  { value: "distributor", label: "Signed to a distributor" },
  { value: "major_label", label: "Signed to a major label" },
  { value: "unknown", label: "I'm not sure" },
];

const key = () => Math.random().toString(36).slice(2);

function emptyForm(): Form {
  return {
    id: null,
    title: "",
    type: "single",
    upc: "",
    originalReleaseDate: "",
    packReleaseDate: "",
    label: "",
    pLine: "",
    artworkUrl: null,
    rightsStatus: null,
    rightsConfirmed: false,
    tracks: [],
  };
}

function ReleaseBuilder() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const options = useQuery({
    queryKey: ["studio", "release-options"],
    queryFn: () => getReleaseOptions(),
  });
  const existing = useQuery({
    queryKey: ["studio", "release", id],
    queryFn: () => getRelease({ data: { id: id! } }),
    enabled: Boolean(id),
  });
  const [form, setForm] = useState<Form | null>(id ? null : emptyForm());
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const formRef = useRef(form);
  formRef.current = form;

  useEffect(() => {
    if (!existing.data) return;
    const { release, tracks } = existing.data;
    setForm({
      id: release.id,
      title: release.title,
      type: release.type,
      upc: release.upc ?? "",
      originalReleaseDate: release.original_release_date ?? "",
      packReleaseDate: release.pack_release_date ?? "",
      label: release.label ?? "",
      pLine: release.p_line ?? "",
      artworkUrl: release.artwork_url,
      rightsStatus: release.rights_status,
      rightsConfirmed: Boolean(release.rights_confirmed_at),
      tracks: tracks.map((t) => ({
        key: t.id,
        id: t.id,
        title: t.title,
        versionTitle: t.version_title ?? "",
        isrc: t.isrc ?? "",
        iswc: t.iswc ?? "",
        explicit: t.explicit,
        language: t.language,
        genreId: t.genre_id ?? "",
        aiDeclaration:
          t.ai_declaration === "no" || t.ai_declaration === "yes" ? t.ai_declaration : null,
        story: t.story,
        audioPath: t.audio_path,
        durationMs: t.duration_ms,
        lufs: t.lufs,
        uploading: null,
        contributors: t.splits.map((s) => ({
          key: s.personId,
          personId: s.personId,
          name: s.name,
          email: s.email,
          ipi: s.ipi,
          role: s.role,
          share: String(s.shareBp / 100),
          hasAccount: s.hasAccount,
        })),
      })),
    });
  }, [existing.data]);

  if (options.isPending || (id && existing.isPending) || !form) return <Loading />;
  if (options.isError) return <Notice tone="error">{errorMessage(options.error)}</Notice>;
  if (existing.isError) return <Notice tone="error">{errorMessage(existing.error)}</Notice>;

  const state = existing.data?.release.state ?? "draft";
  const editable = ["draft", "needs_attention", "held", "rejected"].includes(state);
  if (!editable) {
    return (
      <>
        <PageTitle kicker="Add music" title={form.title} />
        <Notice>
          This release is with The Pack now, so it can't be changed here.{" "}
          <Link to="/studio/releases/$id" params={{ id: form.id! }} className="font-bold underline">
            See where it's up to
          </Link>
          .
        </Notice>
      </>
    );
  }

  const self = options.data.self;
  const parents = options.data.genres.filter((g) => !g.parent_id);
  const update = (patch: Partial<Form>) => setForm((f) => (f ? { ...f, ...patch } : f));
  const updateTrack = (k: string, patch: Partial<TrackForm>) =>
    setForm((f) =>
      f ? { ...f, tracks: f.tracks.map((t) => (t.key === k ? { ...t, ...patch } : t)) } : f,
    );

  function toDraft(f: Form): ReleaseDraft {
    return {
      ...f,
      tracks: f.tracks.map((t) => ({
        id: t.id,
        title: t.title,
        versionTitle: t.versionTitle,
        isrc: t.isrc,
        iswc: t.iswc,
        explicit: t.explicit,
        language: t.language || "en",
        genreId: t.genreId,
        aiDeclaration: t.aiDeclaration,
        story: t.story,
        audioPath: t.audioPath,
        contributors: t.contributors
          .filter((c) => c.name.trim() || Number(c.share) > 0)
          .map((c) => ({
            personId: c.personId,
            name: c.name,
            email: c.email,
            ipi: c.ipi,
            role: c.role || "Writer",
            shareBp: Math.round(Number(c.share || 0) * 100),
          })),
      })),
    };
  }

  /** Saves, then reloads from the server, which is the source of truth. */
  async function save(current: Form = formRef.current!): Promise<string> {
    if (!current.title.trim()) throw new Error("Give the release a title first.");
    const { id: savedId } = await saveRelease({ data: toDraft(current) });
    setSaved(true);
    if (!current.id) {
      update({ id: savedId });
      navigate({ to: "/studio/releases/new", search: { id: savedId }, replace: true });
    } else {
      await queryClient.invalidateQueries({ queryKey: ["studio", "release", savedId] });
    }
    queryClient.invalidateQueries({ queryKey: ["studio"], exact: true });
    return savedId;
  }

  async function run(label: string, task: () => Promise<void>) {
    setBusy(label);
    setError(null);
    setSaved(false);
    try {
      await task();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  async function upload(
    bucket: "audio" | "artwork",
    file: File,
    onProgress?: (pct: number) => void,
  ) {
    const releaseId = formRef.current!.id ?? (await save());
    const ticket = await createUploadUrl({
      data: { releaseId, bucket, fileName: file.name, size: file.size },
    });
    onProgress?.(10);
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .uploadToSignedUrl(
        ticket.path,
        ticket.token,
        file,
        file.type ? { contentType: file.type } : {},
      );
    if (uploadError) throw new Error(uploadError.message);
    onProgress?.(100);
    return ticket;
  }

  function addTrack() {
    const t: TrackForm = {
      key: key(),
      id: null,
      title: "",
      versionTitle: "",
      isrc: "",
      iswc: "",
      explicit: null,
      language: "en",
      genreId: "",
      aiDeclaration: null,
      story: "",
      audioPath: null,
      durationMs: 0,
      lufs: null,
      uploading: null,
      contributors: self
        ? [
            {
              key: key(),
              personId: self.id,
              name: self.name,
              email: self.email ?? "",
              ipi: self.ipi ?? "",
              role: "Writer, performer",
              share: "100",
              hasAccount: true,
            },
          ]
        : [],
    };
    update({ tracks: [...form!.tracks, t] });
  }

  function move(index: number, by: -1 | 1) {
    const tracks = [...form!.tracks];
    const [t] = tracks.splice(index, 1);
    tracks.splice(index + by, 0, t!);
    update({ tracks });
  }

  const canSubmit = Boolean(
    form.rightsStatus &&
    form.rightsConfirmed &&
    form.tracks.length &&
    form.rightsStatus !== "major_label",
  );

  return (
    <>
      <PageTitle
        kicker={form.id ? `Version ${existing.data?.release.version ?? 1}` : "Add music"}
        title={form.id ? form.title || "Your release" : "Add a release"}
        lead="One release at a time: a single, an EP or an album. Save as you go. Nothing goes anywhere until you press Submit."
        actions={form.id ? <StateBadge state={state} /> : null}
      />

      <div className="mb-6 rounded-xl border-2 border-ember bg-ember-100 px-4 py-3 text-sm">
        <span className="mr-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-ember">
          For now
        </span>
        Later, songs, people and splits will arrive in one package from MetaGen. Until then, add
        them here.
      </div>

      <fieldset disabled={Boolean(busy)} className="space-y-6">
        <Panel title="The release">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Title">
              <Input
                required
                value={form.title}
                onChange={(e) => update({ title: e.target.value })}
                placeholder="Kestrel Road"
              />
            </Field>
            <Field label="Type">
              <Select
                value={form.type}
                onChange={(e) => update({ type: e.target.value as Form["type"] })}
              >
                <option value="single">Single</option>
                <option value="ep">EP</option>
                <option value="album">Album</option>
              </Select>
            </Field>
            <Field
              label="UPC"
              hint="The barcode number from your original release, 12 or 13 digits."
            >
              <Input
                inputMode="numeric"
                value={form.upc}
                onChange={(e) => update({ upc: e.target.value })}
              />
            </Field>
            <Field label="First released">
              <Input
                type="date"
                value={form.originalReleaseDate}
                onChange={(e) => update({ originalReleaseDate: e.target.value })}
              />
            </Field>
            <Field
              label="Live on The Pack from (optional)"
              hint="Leave blank to go live as soon as it's approved."
            >
              <Input
                type="date"
                value={form.packReleaseDate}
                onChange={(e) => update({ packReleaseDate: e.target.value })}
              />
            </Field>
            <Field label="Label (if any)">
              <Input value={form.label} onChange={(e) => update({ label: e.target.value })} />
            </Field>
            <Field label="P line (if any)" hint="For example: ℗ 2024 The Southerlies">
              <Input value={form.pLine} onChange={(e) => update({ pLine: e.target.value })} />
            </Field>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest">Artwork</span>
              <div className="mt-1.5 flex items-center gap-4">
                {form.artworkUrl ? (
                  <img
                    src={form.artworkUrl}
                    alt="Release artwork"
                    className="h-24 w-24 rounded-lg border-2 border-ink object-cover"
                  />
                ) : (
                  <span className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed border-ink/40 text-xs text-ink/50">
                    Square
                  </span>
                )}
                <label className="press cursor-pointer rounded-full border-2 border-ink bg-paper px-4 py-2 text-xs font-bold uppercase tracking-widest">
                  {form.artworkUrl ? "Replace" : "Add artwork"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (!file) return;
                      run("artwork", async () => {
                        const ticket = await upload("artwork", file);
                        const next = { ...formRef.current!, artworkUrl: ticket.publicUrl };
                        setForm(next);
                        await save(next);
                      });
                    }}
                  />
                </label>
              </div>
              <span className="mt-1 block text-xs text-ink/60">
                Square JPEG or PNG, at least 1400 px. 3000 px is best.
              </span>
            </div>
          </div>
        </Panel>

        <Panel
          title="Songs"
          actions={
            <Button variant="yellow" size="sm" onClick={addTrack}>
              Add a song
            </Button>
          }
        >
          {form.tracks.length === 0 ? (
            <p className="text-sm text-ink/70">
              No songs yet. Add each song in the order it plays.
            </p>
          ) : (
            <ol className="space-y-6">
              {form.tracks.map((t, i) => (
                <TrackEditor
                  key={t.key}
                  index={i}
                  count={form.tracks.length}
                  track={t}
                  parents={parents}
                  genres={options.data.genres}
                  onChange={(patch) => updateTrack(t.key, patch)}
                  onMove={(by) => move(i, by)}
                  onRemove={() => update({ tracks: form.tracks.filter((x) => x.key !== t.key) })}
                  onAudio={(file) =>
                    run("audio", async () => {
                      updateTrack(t.key, { uploading: 0 });
                      const ticket = await upload("audio", file, (pct) =>
                        updateTrack(t.key, { uploading: pct }),
                      );
                      const next = {
                        ...formRef.current!,
                        tracks: formRef.current!.tracks.map((x) =>
                          x.key === t.key ? { ...x, audioPath: ticket.path, uploading: null } : x,
                        ),
                      };
                      setForm(next);
                      // Saving measures the file's loudness on the server.
                      await save(next);
                    }).finally(() => updateTrack(t.key, { uploading: null }))
                  }
                />
              ))}
            </ol>
          )}
        </Panel>

        <Panel title="Your rights position for this release">
          <div className="grid gap-2 sm:grid-cols-2">
            {RIGHTS.map((r) => (
              <label
                key={r.value}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 border-ink px-4 py-3 text-sm font-bold ${form.rightsStatus === r.value ? "bg-yellow" : "bg-paper"}`}
              >
                <input
                  type="radio"
                  name="rights"
                  className="accent-electric"
                  checked={form.rightsStatus === r.value}
                  onChange={() => update({ rightsStatus: r.value })}
                />
                {r.label}
              </label>
            ))}
          </div>
          {form.rightsStatus === "major_label" ? (
            <div className="mt-4">
              <Notice tone="error">
                The Pack can only play music by unsigned and independent artists, so a release
                signed to a major label can't go on The Pack.
              </Notice>
            </div>
          ) : null}
          <p className="mt-3 text-xs text-ink/60">
            Any deal with a label or distributor is between you and them. The Pack relies on what
            you tell us here.
          </p>
          <div className="mt-4">
            <Check checked={form.rightsConfirmed} onChange={(v) => update({ rightsConfirmed: v })}>
              I confirm I'm free to distribute these recordings on The Pack.
            </Check>
          </div>
        </Panel>
      </fieldset>

      {error ? (
        <div className="mt-6">
          <Notice tone="error">{error}</Notice>
        </div>
      ) : null}
      {saved && !error ? (
        <div className="mt-6">
          <Notice tone="ok">Saved.</Notice>
        </div>
      ) : null}

      <div className="sticky bottom-0 mt-6 flex flex-wrap items-center gap-3 border-t-2 border-ink bg-paper py-4">
        <Button
          variant="ghost"
          disabled={Boolean(busy)}
          onClick={() => run("save", async () => void (await save()))}
        >
          {busy === "save" ? "Saving…" : "Save draft"}
        </Button>
        <Button
          variant="ember"
          disabled={Boolean(busy) || !canSubmit}
          onClick={() =>
            run("submit", async () => {
              const releaseId = await save();
              await submitRelease({ data: { id: releaseId } });
              await queryClient.invalidateQueries({ queryKey: ["studio"] });
              navigate({ to: "/studio/releases/$id", params: { id: releaseId } });
            })
          }
        >
          {busy === "submit"
            ? "Checking…"
            : state === "draft"
              ? "Submit release"
              : "Send the corrected release"}
        </Button>
        {!canSubmit ? (
          <span className="text-xs text-ink/60">
            Submit opens once there's a song, a rights position and the confirmation is ticked.
          </span>
        ) : null}
        {state !== "draft" ? (
          <span className="text-xs text-ink/60">
            Sending again creates a new version. Nothing you sent before is deleted.
          </span>
        ) : null}
      </div>
    </>
  );
}

function TrackEditor({
  index,
  count,
  track: t,
  parents,
  genres,
  onChange,
  onMove,
  onRemove,
  onAudio,
}: {
  index: number;
  count: number;
  track: TrackForm;
  parents: { id: string; label: string }[];
  genres: { id: string; label: string; parent_id: string | null }[];
  onChange: (patch: Partial<TrackForm>) => void;
  onMove: (by: -1 | 1) => void;
  onRemove: () => void;
  onAudio: (file: File) => void;
}) {
  const total = t.contributors.reduce((a, c) => a + Math.round(Number(c.share || 0) * 100), 0);
  const setContributor = (k: string, patch: Partial<Contributor>) =>
    onChange({ contributors: t.contributors.map((c) => (c.key === k ? { ...c, ...patch } : c)) });

  return (
    <li className="rounded-2xl border-2 border-ink bg-paper p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="font-display text-2xl font-bold">{index + 1}.</span>
        <span className="flex-1 font-bold">{t.title || "Untitled song"}</span>
        <Button
          size="sm"
          variant="ghost"
          disabled={index === 0}
          onClick={() => onMove(-1)}
          aria-label="Move up"
        >
          ↑
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={index === count - 1}
          onClick={() => onMove(1)}
          aria-label="Move down"
        >
          ↓
        </Button>
        <Button size="sm" variant="danger" onClick={onRemove}>
          Remove
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Song title">
          <Input value={t.title} onChange={(e) => onChange({ title: e.target.value })} />
        </Field>
        <Field label="Version (optional)" hint="Such as Acoustic or Radio edit.">
          <Input
            value={t.versionTitle}
            onChange={(e) => onChange({ versionTitle: e.target.value })}
          />
        </Field>
        <Field label="ISRC" hint="Like AU-XX0-26-00001.">
          <Input value={t.isrc} onChange={(e) => onChange({ isrc: e.target.value })} />
        </Field>
        <Field label="ISWC (optional)">
          <Input value={t.iswc} onChange={(e) => onChange({ iswc: e.target.value })} />
        </Field>
        <Field label="Genre" hint="From The Pack list.">
          <Select value={t.genreId} onChange={(e) => onChange({ genreId: e.target.value })}>
            <option value="">Choose a genre</option>
            {parents.map((p) => (
              <optgroup key={p.id} label={p.label}>
                <option value={p.id}>{p.label}</option>
                {genres
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
        <Field label="Language" hint="A language code, such as en.">
          <Input value={t.language} onChange={(e) => onChange({ language: e.target.value })} />
        </Field>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <YesNo
          label="Explicit lyrics?"
          value={t.explicit === null ? null : t.explicit ? "yes" : "no"}
          onChange={(v) => onChange({ explicit: v === "yes" })}
        />
        <YesNo
          label="Did you use AI at any stage of making this song?"
          value={t.aiDeclaration}
          onChange={(v) => onChange({ aiDeclaration: v })}
        />
      </div>

      <div className="mt-4">
        <Field
          label="Story or inspiration (optional)"
          hint="Shown on your song page as you write it. Never used to rank anything."
        >
          <Textarea value={t.story} onChange={(e) => onChange({ story: e.target.value })} />
        </Field>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border-2 border-dashed border-ink/40 p-3">
        {t.audioPath ? (
          <>
            <Badge className="bg-green text-ink">Audio added</Badge>
            {t.durationMs ? (
              <span className="font-mono text-xs">{formatDuration(t.durationMs)}</span>
            ) : null}
            {t.lufs !== null ? (
              <span className="font-mono text-xs text-ink/60">{t.lufs} LUFS measured</span>
            ) : null}
          </>
        ) : (
          <Badge className="bg-ember text-paper">No audio yet</Badge>
        )}
        {t.uploading !== null ? (
          <span className="font-mono text-xs">Uploading… {t.uploading}%</span>
        ) : null}
        <label className="press ml-auto cursor-pointer rounded-full bg-ink px-4 py-2 text-xs font-bold uppercase tracking-widest text-paper">
          {t.audioPath ? "Replace audio" : "Add audio"}
          <input
            type="file"
            accept="audio/wav,audio/x-wav,audio/flac,audio/mpeg,.wav,.flac,.mp3"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) onAudio(file);
            }}
          />
        </label>
        <span className="w-full text-xs text-ink/60">
          Your mastered file, WAV or FLAC. We never change your master: levels are evened out when
          it plays.
        </span>
      </div>

      <div className="mt-5">
        <p className="text-xs font-bold uppercase tracking-widest">Who gets paid for this song</p>
        <div className="mt-2 space-y-2">
          {t.contributors.map((c) => (
            <div key={c.key} className="grid gap-2 sm:grid-cols-[1.4fr_1.2fr_1fr_1fr_6rem_auto]">
              <Input
                aria-label="Name"
                placeholder="Name"
                value={c.name}
                readOnly={Boolean(c.personId)}
                onChange={(e) => setContributor(c.key, { name: e.target.value })}
              />
              <Input
                aria-label="Email"
                placeholder="Email (optional)"
                value={c.email}
                readOnly={Boolean(c.personId)}
                onChange={(e) => setContributor(c.key, { email: e.target.value })}
              />
              <Input
                aria-label="IPI"
                placeholder="IPI (optional)"
                value={c.ipi}
                readOnly={Boolean(c.personId)}
                onChange={(e) => setContributor(c.key, { ipi: e.target.value })}
              />
              <Input
                aria-label="Role"
                placeholder="Writer"
                value={c.role}
                onChange={(e) => setContributor(c.key, { role: e.target.value })}
              />
              <Input
                aria-label="Share %"
                inputMode="decimal"
                placeholder="%"
                value={c.share}
                onChange={(e) => setContributor(c.key, { share: e.target.value })}
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  onChange({ contributors: t.contributors.filter((x) => x.key !== c.key) })
                }
                aria-label={`Remove ${c.name || "person"}`}
              >
                ✕
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              onChange({
                contributors: [
                  ...t.contributors,
                  {
                    key: key(),
                    personId: null,
                    name: "",
                    email: "",
                    ipi: "",
                    role: "Writer",
                    share: "",
                  },
                ],
              })
            }
          >
            Add a person
          </Button>
          <span
            className={`font-mono text-xs font-bold ${total === 10000 ? "text-green-800" : "text-ember"}`}
          >
            Total {total / 100}%{total === 10000 ? "" : ", needs to be 100%"}
          </span>
        </div>
        <p className="mt-2 text-xs text-ink/60">
          Someone without a Pack account still gets their share. It's held for them until they join.
          People are matched by IPI or email, never by name alone.
        </p>
      </div>
    </li>
  );
}

function YesNo({
  label,
  value,
  onChange,
}: {
  label: string;
  value: "yes" | "no" | null;
  onChange: (v: "yes" | "no") => void;
}) {
  return (
    <fieldset>
      <legend className="text-xs font-bold uppercase tracking-widest">{label}</legend>
      <div className="mt-1.5 flex gap-2">
        {(["no", "yes"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            aria-pressed={value === v}
            className={`rounded-full border-2 border-ink px-5 py-2 text-sm font-bold uppercase tracking-widest ${value === v ? "bg-ink text-paper" : "bg-paper"}`}
          >
            {v}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
