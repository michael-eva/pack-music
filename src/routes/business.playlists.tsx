import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Badge, Empty, Loading, PageTitle, Panel, formatDuration } from "@/components/app/ui";
import { getSitePlaylists } from "@/lib/business.functions";
import { useCurrentSite } from "./business";

export const Route = createFileRoute("/business/playlists")({
  component: PlaylistsPage,
});

/** B5, pilot version: the Pack-curated playlist for this site. House picks (VEN-10) come next. */
function PlaylistsPage() {
  const { site } = useCurrentSite();
  const query = useQuery({
    queryKey: ["site-playlists", site?.id],
    queryFn: () => getSitePlaylists({ data: { siteId: site!.id } }),
    enabled: !!site,
    refetchInterval: 15_000,
  });
  if (!site) return null;
  const assigned = query.data?.assigned;

  return (
    <>
      <PageTitle kicker="Playlists" title={`Playlists for ${site.name}`} />
      <div className="grid gap-6 lg:grid-cols-2">
        {query.isPending ? (
          <Loading />
        ) : assigned ? (
          <Panel
            kicker={`Curated by ${assigned.curatedBy}`}
            title={assigned.name}
            actions={<Badge className="bg-pink text-paper">Playing now</Badge>}
          >
            <p className="mb-4 text-sm text-ink/70">
              The Pack's own playlist for your site · version {assigned.version}.
            </p>
            <ol className="divide-y divide-ink/15 rounded-xl border-2 border-ink bg-paper">
              {assigned.tracks.map((t) => (
                <li
                  key={t.position}
                  className={`flex items-center gap-3 px-3 py-2 text-sm ${t.trackId === query.data?.nowPlayingTrackId ? "bg-yellow-200" : ""}`}
                >
                  <span className="w-6 font-mono text-xs text-ink/50">{t.position}.</span>
                  <span className="flex-1">
                    <span className="font-bold">{t.title}</span> · {t.artist}
                  </span>
                  <span className="font-mono text-xs">{formatDuration(t.durationMs)}</span>
                </li>
              ))}
            </ol>
          </Panel>
        ) : (
          <Empty title="No playlist yet">
            A Pack curator will assign a playlist to your site before you go on air.
          </Empty>
        )}
        <Panel kicker="Coming soon" title="Your house picks">
          <p className="leading-relaxed">
            Soon a named staff member will be able to build your own playlist from the same
            catalogue and rules a Pack curator uses, credited "Curated by [name] for {site.name}",
            and switch the player between it and The Pack's.
          </p>
        </Panel>
      </div>
    </>
  );
}
