import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMe } from "@/components/app/guard";
import {
  ButtonLink,
  Loading,
  Notice,
  PageTitle,
  Panel,
  Stat,
  errorMessage,
} from "@/components/app/ui";
import { getDashboard } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/")({ component: Dashboard });

/** ADM-1: the catalogue at a glance, and what changed lately. */
function Dashboard() {
  const me = useMe();
  const isAdmin = me.data?.roles.includes("admin");
  const q = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => getDashboard(),
    enabled: !!isAdmin,
  });
  if (me.data && !isAdmin) return <Navigate to="/admin/playlists" />;
  if (q.isPending) return <Loading />;
  if (q.isError) return <Notice tone="error">{errorMessage(q.error)}</Notice>;
  const d = q.data;

  return (
    <>
      <PageTitle
        kicker="Pack HQ"
        title="Dashboard"
        lead="Upload the music, build the playlists, and keep an eye on who's listening."
        actions={
          <>
            <ButtonLink to="/admin/music/releases/$id" params={{ id: "new" }} variant="ember">
              New release
            </ButtonLink>
            <ButtonLink to="/admin/playlists" variant="ghost">
              New playlist
            </ButtonLink>
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link to="/admin/music" className="block">
          <Stat label="Artists" value={d.artists} sub={`${d.tracks} songs in the catalogue`} />
        </Link>
        <Link to="/admin/music" className="block">
          <Stat label="Live releases" value={d.liveReleases} sub={`${d.draftReleases} in draft`} />
        </Link>
        <Link to="/admin/playlists" className="block">
          <Stat
            label="Playlists"
            value={d.playlists}
            sub={`${d.featuredPlaylists} featured on the listener home`}
          />
        </Link>
        <Link to="/admin/users" className="block">
          <Stat label="Listeners" value={d.listeners} />
        </Link>
      </div>
      <Panel className="mt-6" title="Recent changes" kicker="From the audit log">
        {d.recent.length ? (
          <ul className="divide-y divide-ink/15 text-sm">
            {d.recent.map((r) => (
              <li key={r.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span>
                  <span className="font-bold">{r.actorName}</span> ·{" "}
                  <span className="font-mono text-xs">{r.action}</span>
                </span>
                <span className="text-ink/60">
                  {new Date(r.created_at).toLocaleString("en-AU")}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink/60">Nothing yet.</p>
        )}
        <Link to="/admin/audit" className="mt-3 inline-block text-sm font-bold underline">
          Full audit log
        </Link>
      </Panel>
    </>
  );
}
