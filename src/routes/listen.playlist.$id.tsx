import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Empty, Loading, Notice, errorMessage } from "@/components/app/ui";
import { usePlayer } from "@/components/listener/player";
import { Cover, PlayControls, TrackList, totalDuration } from "@/components/listener/ui";
import { getPlaylist } from "@/lib/listener.functions";

export const Route = createFileRoute("/listen/playlist/$id")({
  component: PlaylistPage,
});

function PlaylistPage() {
  const { id } = Route.useParams();
  const player = usePlayer();
  const playlist = useQuery({
    queryKey: ["listen", "playlist", id],
    queryFn: () => getPlaylist({ data: { id } }),
  });

  if (playlist.isPending) return <Loading />;
  if (playlist.isError) return <Notice tone="error">{errorMessage(playlist.error)}</Notice>;
  const p = playlist.data;

  return (
    <div>
      <div className="grid gap-6 sm:grid-cols-[14rem_1fr] sm:items-end">
        <div className="mx-auto w-56 sm:w-full">
          <Cover src={p.coverUrl} className="rounded-lg border-4 shadow-[6px_6px_0_0_var(--ink)]" />
        </div>
        <div>
          <p className="mono-kicker text-yellow">Playlist</p>
          <h1 className="mt-2 text-5xl leading-none sm:text-6xl">{p.name}</h1>
          {p.description ? <p className="mt-3 max-w-xl text-lg">{p.description}</p> : null}
          <p className="mt-3 font-mono text-xs uppercase tracking-[0.2em]">
            Curated by {p.curatedBy} · {p.tracks.length} songs · {totalDuration(p.tracks)}
          </p>
          <div className="mt-5">
            <PlayControls
              disabled={!p.tracks.length}
              onPlay={() => player.play(p.tracks, 0)}
              onShuffle={() => player.play(p.tracks, 0, { shuffle: true })}
            />
          </div>
        </div>
      </div>

      <div className="mt-8">
        {p.tracks.length ? (
          <TrackList tracks={p.tracks} numbered />
        ) : (
          <div className="text-ink">
            <Empty title="Nothing in here yet">
              The curator hasn't added any songs that are live.
            </Empty>
          </div>
        )}
      </div>
    </div>
  );
}
