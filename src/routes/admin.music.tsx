import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useMe } from "@/components/app/guard";
import {
  Badge,
  ButtonLink,
  Empty,
  Field,
  Input,
  Loading,
  Notice,
  PageTitle,
  Select,
  StateBadge,
  errorMessage,
} from "@/components/app/ui";
import { getCatalogue } from "@/lib/music.functions";

export const Route = createFileRoute("/admin/music")({ component: MusicLayout });

function MusicLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return pathname.replace(/\/$/, "") === "/admin/music" ? <Catalogue /> : <Outlet />;
}

const TYPE_LABEL: Record<string, string> = { single: "Single", ep: "EP", album: "Album" };

/** The catalogue: every artist and their releases. Admins upload; curators read and tag. */
function Catalogue() {
  const me = useMe();
  const isAdmin = !!me.data?.roles.includes("admin");
  const q = useQuery({ queryKey: ["admin", "catalogue"], queryFn: () => getCatalogue() });
  const [search, setSearch] = useState("");
  const [state, setState] = useState("");

  const term = search.trim().toLowerCase();
  const artists = (q.data ?? [])
    .map((a) => {
      const artistHit = !term || a.name.toLowerCase().includes(term);
      const releases = a.releases.filter(
        (r) =>
          (!state || r.state === state) &&
          (artistHit ||
            r.title.toLowerCase().includes(term) ||
            r.tracks.some((t) => t.title.toLowerCase().includes(term))),
      );
      return { ...a, releases, show: (artistHit && !state) || releases.length > 0 };
    })
    .filter((a) => a.show);

  return (
    <>
      <PageTitle
        kicker="The catalogue"
        title="Music"
        lead={
          isAdmin
            ? "Add artists and their releases, upload the audio, and publish when it's ready. Only live releases reach listeners and playlists."
            : "Everything in the catalogue. Open a release to tag its songs for curation."
        }
        actions={
          isAdmin ? (
            <>
              <ButtonLink to="/admin/music/artists/$id" params={{ id: "new" }} variant="ghost">
                New artist
              </ButtonLink>
              <ButtonLink to="/admin/music/releases/$id" params={{ id: "new" }} variant="ember">
                New release
              </ButtonLink>
            </>
          ) : null
        }
      />
      <div className="mb-6 flex flex-wrap gap-3">
        <Field label="Search">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Artist, release or song"
          />
        </Field>
        <Field label="State">
          <Select value={state} onChange={(e) => setState(e.target.value)}>
            <option value="">Any</option>
            <option value="draft">Draft</option>
            <option value="live">Live</option>
            <option value="withdrawn">Withdrawn</option>
          </Select>
        </Field>
      </div>
      {q.isPending ? (
        <Loading />
      ) : q.isError ? (
        <Notice tone="error">{errorMessage(q.error)}</Notice>
      ) : artists.length === 0 ? (
        <Empty title={q.data.length ? "Nothing matches" : "No music yet"}>
          {q.data.length ? "Try another search." : "Start with New artist, then New release."}
        </Empty>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {artists.map((a) => (
            <section
              key={a.id}
              className="rounded-2xl border-2 border-ink bg-cream p-4 shadow-[4px_4px_0_0_var(--ink)]"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-ink bg-paper">
                  {a.photo_url ? (
                    <img src={a.photo_url} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    to="/admin/music/artists/$id"
                    params={{ id: a.id }}
                    className="font-display text-xl font-bold uppercase underline-offset-4 hover:underline"
                  >
                    {a.name}
                  </Link>
                  <p className="text-xs text-ink/60">
                    {a.releases.length} release{a.releases.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <ul className="mt-3 divide-y divide-ink/15">
                {a.releases.map((r) => {
                  const down = r.tracks.filter((t) => t.taken_down_at).length;
                  return (
                    <li key={r.id}>
                      <Link
                        to="/admin/music/releases/$id"
                        params={{ id: r.id }}
                        className="flex items-center gap-3 py-2 hover:bg-paper/60"
                      >
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border-2 border-ink bg-paper">
                          {r.artwork_url ? (
                            <img
                              src={r.artwork_url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold">{r.title}</p>
                          <p className="text-xs text-ink/60">
                            {TYPE_LABEL[r.type]} · {r.tracks.length} song
                            {r.tracks.length === 1 ? "" : "s"}
                          </p>
                        </div>
                        {down ? (
                          <Badge className="bg-ink text-paper">{down} taken down</Badge>
                        ) : null}
                        <StateBadge state={r.state} />
                      </Link>
                    </li>
                  );
                })}
                {a.releases.length === 0 ? (
                  <li className="py-2 text-sm text-ink/60">No releases yet.</li>
                ) : null}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
