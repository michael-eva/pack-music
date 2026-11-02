import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMe } from "@/components/app/guard";
import { Loading, Notice, PageTitle, Panel, Stat, errorMessage } from "@/components/app/ui";
import { getDashboard } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/")({ component: Dashboard });

const RUN_WORDS: Record<string, string> = {
  dry_run: "Dry-run, waiting for approval",
  approved: "Approved and locked",
};

/** ADM-1: what needs a person today. */
function Dashboard() {
  const me = useMe();
  const isAdmin = me.data?.roles.includes("admin");
  const q = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => getDashboard(),
    refetchInterval: 30_000,
    enabled: !!isAdmin,
  });
  if (me.data && !isAdmin) return <Navigate to="/admin/playlists" />;
  if (q.isPending) return <Loading />;
  if (q.isError) return <Notice tone="error">{errorMessage(q.error)}</Notice>;
  const d = q.data;
  const reasons = Object.entries(d.skipReasons);

  return (
    <>
      <PageTitle
        kicker="Pack HQ"
        title="Dashboard"
        lead="A person checks every step of the pilot. This is what's waiting."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/admin/review" className="block">
          <Stat
            label="Waiting for review"
            value={d.inReview}
            sub={`${d.held} on hold · ${d.needsAttention} need attention`}
          />
        </Link>
        <Link to="/admin/sites" className="block">
          <Stat
            label="Sites on air now"
            value={`${d.sitesOnAir} of ${d.siteCount}`}
            sub={
              d.sitesSilent.length
                ? `Silent in player hours: ${d.sitesSilent.join(", ")}`
                : "No site silent in its player hours"
            }
          />
        </Link>
        <Stat label="Plays, last 24 hours" value={d.plays24h} />
        <Link to="/admin/ledger" className="block">
          <Stat
            label="Ledger"
            value={
              d.ledger.lastMonthState === "approved"
                ? "Posted"
                : d.ledger.lastMonthState
                  ? "Dry-run"
                  : "Not run"
            }
            sub={`Last month: ${d.ledger.lastMonthState ? RUN_WORDS[d.ledger.lastMonthState] : "month-end not started"}. This month: ${d.ledger.thisMonthState ? RUN_WORDS[d.ledger.thisMonthState] : "open"}.`}
          />
        </Link>
      </div>
      {d.sitesSilent.length ? (
        <div className="mt-6">
          <Notice tone="error">
            {d.sitesSilent.join(", ")} {d.sitesSilent.length === 1 ? "is" : "are"} silent during
            player hours. Check in before the business notices.
          </Notice>
        </div>
      ) : null}
      <Panel className="mt-6" kicker="Feedback, not a ranking" title="Skip reasons this week">
        {reasons.length ? (
          <p className="text-sm">
            {reasons.map(([reason, n]) => `${reason} ${n}`).join(" · ")}. Sent to the playlist's
            curator.
          </p>
        ) : (
          <p className="text-sm text-ink/60">No skips this week.</p>
        )}
      </Panel>
    </>
  );
}
