import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Empty, Loading, Notice, errorMessage } from "@/components/app/ui";
import {
  ArtistChip,
  PlaylistTile,
  ReleaseTile,
  Section,
  Shelf,
  WhiteStanley,
} from "@/components/listener/ui";
import { stanley } from "@/components/site/stanley";
import { getHome } from "@/lib/listener.functions";

export const Route = createFileRoute("/listen/")({
  component: ListenHome,
});

/** Home: the same for every listener. Picked by people, never ranked (CUR-6). */
function ListenHome() {
  const home = useQuery({ queryKey: ["listen", "home"], queryFn: () => getHome() });

  if (home.isPending) return <Loading />;
  if (home.isError) return <Notice tone="error">{errorMessage(home.error)}</Notice>;
  const { featured, newReleases, regions } = home.data;

  return (
    <div>
      <div className="flex items-center gap-4">
        <div>
          <p className="mono-kicker text-yellow">Local music, picked by people</p>
          <h1 className="mt-2 text-5xl sm:text-6xl">Have a listen</h1>
        </div>
        <WhiteStanley
          src={stanley.headphoneWhite}
          className="ml-auto hidden h-24 w-auto sm:block"
          flip
        />
      </div>

      <div className="mt-8">
        <Section kicker="Playlists" title="Curated by The Pack">
          {featured.length ? (
            <Shelf>
              {featured.map((p) => (
                <PlaylistTile key={p.id} playlist={p} />
              ))}
            </Shelf>
          ) : (
            <div className="text-ink">
              <Empty title="No playlists yet">
                The curators are still digging through the crates.
              </Empty>
            </div>
          )}
        </Section>

        {newReleases.length ? (
          <Section kicker="Just added" title="New releases">
            <Shelf>
              {newReleases.map((r) => (
                <ReleaseTile key={r.id} release={r} />
              ))}
            </Shelf>
          </Section>
        ) : null}

        {regions.length ? (
          <Section kicker="Local first" title="Artists near you">
            <div className="space-y-6">
              {regions.map((r) => (
                <div key={r.region}>
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-paper/80">
                    {r.region}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3">
                    {r.artists.map((a) => (
                      <ArtistChip key={a.id} artist={a} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        ) : null}
      </div>
    </div>
  );
}
