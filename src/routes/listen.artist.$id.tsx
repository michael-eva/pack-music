import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck } from "lucide-react";
import { Loading, Notice, errorMessage } from "@/components/app/ui";
import { usePlayer } from "@/components/listener/player";
import {
  Cover,
  PlayControls,
  ReleaseTile,
  Section,
  Shelf,
  TrackList,
} from "@/components/listener/ui";
import { getArtist } from "@/lib/listener.functions";

export const Route = createFileRoute("/listen/artist/$id")({
  component: ArtistPage,
});

/** Name, region, bio and story, all the artist's own words (ART-1, TAX-3). No follower counts. */
function ArtistPage() {
  const { id } = Route.useParams();
  const player = usePlayer();
  const artist = useQuery({
    queryKey: ["listen", "artist", id],
    queryFn: () => getArtist({ data: { id } }),
  });

  if (artist.isPending) return <Loading />;
  if (artist.isError) return <Notice tone="error">{errorMessage(artist.error)}</Notice>;
  const a = artist.data;

  return (
    <div>
      <div className="grid gap-6 sm:grid-cols-[12rem_1fr] sm:items-center">
        <div className="mx-auto w-44 sm:w-full">
          <Cover src={a.photoUrl} round className="border-4 shadow-[6px_6px_0_0_var(--ink)]" />
        </div>
        <div>
          <p className="mono-kicker text-yellow">{a.region ?? "Artist"}</p>
          <h1 className="mt-2 text-5xl leading-none sm:text-6xl">{a.name}</h1>
          {a.bio ? <p className="mt-3 max-w-2xl whitespace-pre-line text-lg">{a.bio}</p> : null}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {a.creatorIdUrl ? (
              <a
                href={a.creatorIdUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-bold underline"
              >
                <BadgeCheck className="h-4 w-4 text-green" /> Verified Human Creator
              </a>
            ) : null}
            {a.links.map((l) => (
              <a
                key={l}
                href={l.startsWith("http") ? l : `https://${l}`}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                {l.replace(/^https?:\/\//, "")}
              </a>
            ))}
          </div>
          <div className="mt-5">
            <PlayControls
              disabled={!a.tracks.length}
              onPlay={() => player.play(a.tracks, 0)}
              onShuffle={() => player.play(a.tracks, 0, { shuffle: true })}
            />
          </div>
        </div>
      </div>

      {a.tracks.length ? (
        <div className="mt-10">
          <Section title="Songs">
            <TrackList tracks={a.tracks} />
          </Section>
        </div>
      ) : null}

      {a.releases.length ? (
        <div className="mt-10">
          <Section title="Releases">
            <Shelf>
              {a.releases.map((r) => (
                <ReleaseTile key={r.id} release={r} showArtist={false} />
              ))}
            </Shelf>
          </Section>
        </div>
      ) : null}
    </div>
  );
}
