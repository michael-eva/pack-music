import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useMe } from "@/components/app/guard";
import { ImageUpload } from "@/components/admin/upload";
import {
  Button,
  ButtonLink,
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
} from "@/components/app/ui";
import { getArtist, getMusicOptions, saveArtist } from "@/lib/music.functions";

export const Route = createFileRoute("/admin/music/artists/$id")({ component: ArtistEditor });

type Form = {
  name: string;
  region: string;
  bio: string;
  links: string;
  photoUrl: string | null;
  creatorIdUrl: string;
};
const EMPTY: Form = { name: "", region: "", bio: "", links: "", photoUrl: null, creatorIdUrl: "" };

/** An artist on The Pack. Bio and story are the artist's own words (ART-1, TAX-3). */
function ArtistEditor() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const me = useMe();
  const isAdmin = !!me.data?.roles.includes("admin");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const options = useQuery({
    queryKey: ["admin", "music-options"],
    queryFn: () => getMusicOptions(),
  });
  const artist = useQuery({
    queryKey: ["admin", "artist", id],
    queryFn: () => getArtist({ data: { id } }),
    enabled: !isNew,
  });
  const [form, setForm] = useState<Form | null>(isNew ? EMPTY : null);

  useEffect(() => {
    if (artist.data && !form)
      setForm({
        name: artist.data.name,
        region: artist.data.region ?? "",
        bio: artist.data.bio,
        links: artist.data.links,
        photoUrl: artist.data.photo_url,
        creatorIdUrl: artist.data.creator_id_url ?? "",
      });
  }, [artist.data, form]);

  const save = useMutation({
    mutationFn: () =>
      saveArtist({
        data: {
          ...(isNew ? {} : { id }),
          name: form!.name,
          region: form!.region || null,
          bio: form!.bio,
          links: form!.links,
          photoUrl: form!.photoUrl,
          creatorIdUrl: form!.creatorIdUrl.trim() || null,
        },
      }),
    onSuccess: (r) => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      if (isNew) navigate({ to: "/admin/music/artists/$id", params: { id: r.id } });
    },
  });

  if (artist.isError) return <Notice tone="error">{errorMessage(artist.error)}</Notice>;
  if (!form || options.isPending) return <Loading />;
  const set = (patch: Partial<Form>) => setForm({ ...form, ...patch });

  return (
    <>
      <Link to="/admin/music" className="font-mono text-xs uppercase tracking-[0.2em] underline">
        ‹ All music
      </Link>
      <PageTitle kicker="Artist" title={isNew ? "New artist" : form.name || "Artist"} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Panel>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            <fieldset disabled={!isAdmin} className="space-y-4">
              <Field label="Name">
                <Input required value={form.name} onChange={(e) => set({ name: e.target.value })} />
              </Field>
              <Field label="Home region" hint="Lets local listeners find local artists.">
                <Select value={form.region} onChange={(e) => set({ region: e.target.value })}>
                  <option value="">Not set</option>
                  {(options.data?.regions ?? []).map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label="Bio and story"
                hint="In the artist's own words. Shown to listeners exactly as written."
              >
                <Textarea
                  rows={5}
                  value={form.bio}
                  onChange={(e) => set({ bio: e.target.value })}
                />
              </Field>
              <Field label="Links" hint="One per line: website, Bandcamp, Instagram.">
                <Textarea
                  rows={3}
                  value={form.links}
                  onChange={(e) => set({ links: e.target.value })}
                />
              </Field>
              <Field
                label="Verified Human Creator ID link"
                hint="From MetaGen, if the artist has one."
              >
                <Input
                  type="url"
                  value={form.creatorIdUrl}
                  onChange={(e) => set({ creatorIdUrl: e.target.value })}
                  placeholder="https://"
                />
              </Field>
              <ImageUpload
                label="Photo (optional)"
                scope="artists"
                value={form.photoUrl}
                onChange={(photoUrl) => set({ photoUrl })}
                disabled={!isAdmin}
              />
            </fieldset>
            {save.isError ? <Notice tone="error">{errorMessage(save.error)}</Notice> : null}
            {save.isSuccess && !isNew ? <Notice tone="ok">Saved.</Notice> : null}
            {isAdmin ? (
              <Button type="submit" disabled={save.isPending}>
                {isNew ? "Create artist" : "Save artist"}
              </Button>
            ) : (
              <p className="text-sm text-ink/60">Only admins can change artist details.</p>
            )}
          </form>
        </Panel>
        {!isNew && artist.data ? (
          <Panel title="Releases">
            <ul className="divide-y divide-ink/15">
              {artist.data.releases.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2 py-2">
                  <Link
                    to="/admin/music/releases/$id"
                    params={{ id: r.id }}
                    className="font-bold underline"
                  >
                    {r.title}
                  </Link>
                  <StateBadge state={r.state} />
                </li>
              ))}
            </ul>
            {artist.data.releases.length === 0 ? (
              <p className="text-sm text-ink/60">No releases yet.</p>
            ) : null}
            {isAdmin ? (
              <div className="mt-4">
                <ButtonLink to="/admin/music/releases/$id" params={{ id: "new" }} variant="ember">
                  New release
                </ButtonLink>
              </div>
            ) : null}
          </Panel>
        ) : null}
      </div>
    </>
  );
}
