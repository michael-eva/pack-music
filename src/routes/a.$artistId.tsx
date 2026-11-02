import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { PhoneShell, formatDuration } from "@/components/app/ui";
import { getArtistPage } from "@/lib/listener.functions";

export const Route = createFileRoute("/a/$artistId")({
  validateSearch: z.object({ from: z.string().max(40).optional() }),
  loader: ({ params }) => getArtistPage({ data: { artistId: params.artistId } }),
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData?.found ? `${loaderData.artist.name} · The Pack` : "The Pack" }],
  }),
  component: ArtistPage,
});

/** A2: a short public artist page, written by the artist. Track details only, no audio (LIS-2). */
function ArtistPage() {
  const data = Route.useLoaderData();
  const { from } = Route.useSearch();

  if (!data.found) {
    return (
      <PhoneShell tone="grad-pink-orange">
        <h1 className="text-4xl">Artist not found</h1>
      </PhoneShell>
    );
  }
  const { artist, releases } = data;

  return (
    <PhoneShell tone="grad-pink-orange">
      {from ? (
        <Link
          to="/c/$code"
          params={{ code: from }}
          className="font-mono text-xs uppercase tracking-[0.2em] underline"
        >
          ‹ Back to what's playing
        </Link>
      ) : null}
      {artist.photoUrl ? (
        <img
          src={artist.photoUrl}
          alt=""
          className="mt-6 aspect-square w-40 rounded-full border-4 border-ink object-cover"
        />
      ) : null}
      <h1 className="mt-6 text-5xl leading-none">{artist.name}</h1>
      {artist.region ? (
        <p className="mt-2 font-mono text-sm uppercase tracking-[0.2em]">{artist.region}</p>
      ) : null}
      {artist.bio ? <p className="mt-5 text-lg leading-relaxed">{artist.bio}</p> : null}
      {artist.creatorIdUrl ? (
        <a
          href={artist.creatorIdUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-block rounded-full border-2 border-current px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
        >
          Verified Human Creator ID
        </a>
      ) : null}

      <section className="mt-10 space-y-6">
        <p className="mono-kicker">Songs</p>
        {releases.map((r) => (
          <div key={r.id} className="rounded-2xl bg-paper p-4 text-ink">
            <div className="flex items-center gap-3">
              {r.artworkUrl ? (
                <img
                  src={r.artworkUrl}
                  alt=""
                  className="h-14 w-14 rounded-lg border-2 border-ink object-cover"
                />
              ) : null}
              <div>
                <p className="font-display text-xl font-bold uppercase">{r.title}</p>
                <p className="font-mono text-xs uppercase tracking-[0.15em] text-ink/60">
                  {r.type}
                </p>
              </div>
            </div>
            <ol className="mt-3 divide-y divide-ink/15">
              {r.tracks.map((t) => (
                <li key={t.id} className="flex justify-between py-2 text-sm">
                  <span className="font-bold">{t.title}</span>
                  <span className="font-mono text-xs">{formatDuration(t.durationMs)}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
        {!releases.length ? <p>No songs on The Pack yet.</p> : null}
      </section>
      {artist.links ? <p className="mt-8 break-all text-sm">{artist.links}</p> : null}
    </PhoneShell>
  );
}
