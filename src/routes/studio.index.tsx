import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMe } from "@/components/app/guard";
import {
  Badge,
  ButtonLink,
  Empty,
  Loading,
  Notice,
  PageTitle,
  Panel,
  Simulated,
  Stat,
  StateBadge,
  TestModeNote,
  errorMessage,
  formatCents,
} from "@/components/app/ui";
import { getStudio } from "@/lib/studio.functions";

export const Route = createFileRoute("/studio/")({
  component: Dashboard,
});

const TYPE: Record<string, string> = { single: "single", ep: "EP", album: "album" };

function monthName(month: string) {
  return new Date(`${month}T00:00:00Z`).toLocaleDateString("en-AU", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** C7: artist home. Counts only, never who listened (LIS-7, D-22). */
function Dashboard() {
  const me = useMe();
  const studio = useQuery({ queryKey: ["studio"], queryFn: () => getStudio() });
  if (studio.isPending || me.isPending) return <Loading />;
  if (studio.isError) return <Notice tone="error">{errorMessage(studio.error)}</Notice>;
  const data = studio.data;
  const testMode = me.data?.testMode ?? true;
  const agreed = me.data?.artistAgreementAccepted ?? false;
  const ready = agreed && data.profileComplete;
  const firstName = me.data?.displayName?.split(" ")[0];

  return (
    <>
      <PageTitle
        kicker={data.artist.publicName}
        title={ready ? "Welcome back" : `Welcome${firstName ? `, ${firstName}` : ""}`}
      />
      <TestModeNote show={testMode}>
        Money is notional. Money figures carry a "simulated" label and no payout is made.
      </TestModeNote>

      {!ready ? (
        <Panel title="Three things before your music can go in" className="mb-6">
          <ol className="space-y-3">
            <Step done={data.profileComplete} label="Your profile" to="/studio/profile" />
            <Step done={agreed} label="Artist Agreement" to="/studio/agreement" />
            <Step done={false} label="Add your music" to="/studio/releases/new" locked={!ready} />
          </ol>
        </Panel>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel
          title="Your releases"
          actions={
            ready ? (
              <ButtonLink to="/studio/releases/new" variant="ember">
                Add music
              </ButtonLink>
            ) : null
          }
        >
          {data.releases.length === 0 ? (
            <Empty title="No releases yet">
              When you add a release it shows up here, with where it's up to.
            </Empty>
          ) : (
            <ul className="divide-y divide-ink/15">
              {data.releases.map((r) => (
                <li key={r.id}>
                  <Link
                    to="/studio/releases/$id"
                    params={{ id: r.id }}
                    className="flex items-center gap-3 py-3 hover:bg-paper/60"
                  >
                    {r.artwork_url ? (
                      <img
                        src={r.artwork_url}
                        alt=""
                        className="h-12 w-12 shrink-0 rounded-lg border-2 border-ink object-cover"
                      />
                    ) : (
                      <span className="h-12 w-12 shrink-0 rounded-lg border-2 border-dashed border-ink/40" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold">{r.title}</span>
                      <span className="text-xs text-ink/60">
                        {TYPE[r.type]}
                        {r.version > 1 ? ` · version ${r.version}` : ""}
                      </span>
                    </span>
                    <StateBadge state={r.state} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Stat
              label="Played this month"
              value={`${data.playsThisMonth} plays`}
              sub={`across ${data.businessesThisMonth} ${data.businessesThisMonth === 1 ? "business" : "businesses"}`}
            />
            <Stat
              label={
                data.lastPosted
                  ? `Earned in ${monthName(data.lastPosted.month).split(" ")[0]}`
                  : "Earned"
              }
              value={formatCents(data.lastPosted?.cents ?? 0)}
              sub={
                <span className="inline-flex flex-wrap items-center gap-1.5">
                  {testMode ? <Simulated /> : null}
                  <Link to="/studio/earnings" className="font-bold underline">
                    See statement
                  </Link>
                </span>
              }
            />
          </div>
          <Panel kicker="Balance" title={formatCents(data.balanceCents)}>
            <p className="text-sm">
              Paid out as soon as it reaches {formatCents(data.payoutThresholdCents)}.
              {testMode ? " During the pilot no money moves." : ""}
            </p>
          </Panel>
          <Panel title="Your data is yours">
            <p className="text-sm text-ink/75">
              Export everything The Pack holds about you, or take a release off The Pack, whenever
              you like.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <ButtonLink to="/studio/data" variant="primary">
                Export my data
              </ButtonLink>
              <ButtonLink to="/studio/data" variant="ghost">
                Withdraw a release
              </ButtonLink>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}

function Step({
  done,
  label,
  to,
  locked = false,
}: {
  done: boolean;
  label: string;
  to: string;
  locked?: boolean;
}) {
  const badge = done ? (
    <Badge className="bg-green text-ink">Done</Badge>
  ) : locked ? (
    <Badge className="bg-ink/15 text-ink">Locked</Badge>
  ) : (
    <Badge className="bg-yellow text-ink">Next</Badge>
  );
  return (
    <li className="flex items-center gap-3">
      {badge}
      {locked ? (
        <span className="text-ink/50">{label}</span>
      ) : (
        <Link to={to} className="font-bold underline">
          {label}
        </Link>
      )}
    </li>
  );
}
