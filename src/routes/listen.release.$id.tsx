import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loading, Notice, errorMessage } from "@/components/app/ui";
import { usePlayer } from "@/components/listener/player";
import { Cover, PlayControls, TrackList, totalDuration } from "@/components/listener/ui";
import { getRelease } from "@/lib/listener.functions";

export const Route = createFileRoute("/listen/release/$id")({
  component: ReleasePage,
});

const TYPE_LABEL = { single: "Single", ep: "EP", album: "Album" } as const;

function ReleasePage() {
  const { id } = Route.useParams();
  const player = usePlayer();
  const release = useQuery({
    queryKey: ["listen", "release", id],
    queryFn: () => getRelease({ data: { id } }),
  });

  if (release.isPending) return <Loading />;
  if (release.isError) return <Notice tone="error">{errorMessage(release.error)}</Notice>;
  const r = release.data;

  return (
    <div>
      <div className="grid gap-6 sm:grid-cols-[14rem_1fr] sm:items-end">
        <div className="mx-auto w-56 sm:w-full">
          <Cover
            src={r.artworkUrl}
            className="rounded-lg border-4 shadow-[6px_6px_0_0_var(--ink)]"
          />
        </div>
        <div>
          <p className="mono-kicker text-yellow">
            {TYPE_LABEL[r.type]}
            {r.year ? ` · ${r.year}` : ""}
          </p>
          <h1 className="mt-2 text-5xl leading-none sm:text-6xl">{r.title}</h1>
          <Link
            to="/listen/artist/$id"
            params={{ id: r.artistId }}
            className="mt-3 inline-block text-xl font-bold underline"
          >
            {r.artist}
          </Link>
          <p className="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-paper/80">
            {r.tracks.length} songs · {totalDuration(r.tracks)}
          </p>
          <div className="mt-5">
            <PlayControls
              disabled={!r.tracks.length}
              onPlay={() => player.play(r.tracks, 0)}
              onShuffle={() => player.play(r.tracks, 0, { shuffle: true })}
            />
          </div>
        </div>
      </div>

      <div className="mt-8">
        <TrackList tracks={r.tracks} showArtwork={false} numbered />
        {r.pLine ? <p className="mt-4 font-mono text-xs text-paper/70">℗ {r.pLine}</p> : null}
      </div>
    </div>
  );
}
