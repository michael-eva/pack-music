import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Badge,
  Button,
  Field,
  Loading,
  Notice,
  PageTitle,
  Panel,
  STATE_LABEL,
  StateBadge,
  Table,
  Td,
  Textarea,
  errorMessage,
  formatDuration,
} from "@/components/app/ui";
import { confirmSplits, getRelease, reportSplitProblem } from "@/lib/studio.functions";

export const Route = createFileRoute("/studio/releases/$id")({
  component: ReleaseStatus,
});

const TYPE: Record<string, string> = { single: "Single", ep: "EP", album: "Album" };
const HAPPY_PATH = ["received", "checking", "in_review", "live"];

const GROUPS = [
  { outcome: "reject", title: "Can't continue", tone: "bg-pink-100", badge: "bg-pink text-paper" },
  { outcome: "hold", title: "On hold", tone: "bg-yellow-100", badge: "bg-yellow text-ink" },
  { outcome: "warn", title: "Note", tone: "bg-cyan-100", badge: "bg-cyan text-ink" },
] as const;

/** C5 status and fixes, and C6 who gets paid. */
function ReleaseStatus() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["studio", "release", id],
    queryFn: () => getRelease({ data: { id } }),
  });
  const [problem, setProblem] = useState<string | null>(null);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["studio"] });
  const confirm = useMutation({
    mutationFn: () => confirmSplits({ data: { releaseId: id } }),
    onSuccess: refresh,
  });
  const report = useMutation({
    mutationFn: (reason: string) => reportSplitProblem({ data: { releaseId: id, reason } }),
    onSuccess: () => {
      setProblem(null);
      refresh();
    },
  });

  if (query.isPending) return <Loading />;
  if (query.isError) return <Notice tone="error">{errorMessage(query.error)}</Notice>;
  const { release, tracks, issues, events } = query.data;
  const editable = ["draft", "needs_attention", "held", "rejected"].includes(release.state);

  // Timeline shows only states the release has actually reached (ING-2).
  const reached = new Set(events.map((e) => e.to_state));
  const timeline = [
    ...HAPPY_PATH.filter((s) => reached.has(s as never) || s === release.state),
    ...(HAPPY_PATH.includes(release.state) ? [] : [release.state]),
  ];
  const upcoming = HAPPY_PATH.filter(
    (s) => !timeline.includes(s) && release.state !== "withdrawn" && release.state !== "taken_down",
  );
  const lastReason = [...events]
    .reverse()
    .find((e) => e.reason && e.to_state === release.state)?.reason;
  const allConfirmed = tracks.length > 0 && tracks.every((t) => t.splitsConfirmedAt);
  const anyUnclaimed = tracks.some((t) => t.splits.some((s) => !s.hasAccount));

  return (
    <>
      <PageTitle
        kicker={`${TYPE[release.type]} · version ${release.version}`}
        title={release.title}
        actions={
          <>
            <StateBadge state={release.state} />
            {editable ? (
              <Link
                to="/studio/releases/new"
                search={{ id: release.id }}
                className="press inline-flex items-center rounded-full bg-ember px-5 py-2.5 text-sm font-bold uppercase tracking-widest text-paper"
              >
                {release.state === "draft" ? "Edit and submit" : "Fix and send again"}
              </Link>
            ) : null}
          </>
        }
      />

      <Panel className="mb-6">
        <ol className="flex flex-wrap gap-2">
          {timeline.map((s) => {
            const now = s === release.state;
            return (
              <li
                key={s}
                className={`rounded-xl border-2 border-ink px-3 py-2 ${now ? "bg-yellow" : "bg-green-200"}`}
              >
                <span className="mono-kicker block text-[0.6rem]">{now ? "Now" : "Done"}</span>
                <span className="font-bold">{STATE_LABEL[s] ?? s}</span>
              </li>
            );
          })}
          {upcoming.map((s, i) => (
            <li
              key={s}
              className="rounded-xl border-2 border-dashed border-ink/40 px-3 py-2 text-ink/60"
            >
              <span className="mono-kicker block text-[0.6rem]">{i === 0 ? "Next" : "Then"}</span>
              <span className="font-bold">{STATE_LABEL[s]}</span>
            </li>
          ))}
        </ol>
        {release.review_note ? (
          <p className="mt-4 text-sm">
            <strong>From The Pack:</strong> {release.review_note}
          </p>
        ) : null}
        {lastReason && !release.review_note ? (
          <p className="mt-4 text-sm text-ink/70">{lastReason}</p>
        ) : null}
        {release.state === "in_review" ? (
          <p className="mt-4 text-sm">
            A person at The Pack will listen to every song and check the details. You don't need to
            do anything.
          </p>
        ) : null}
        {release.state === "draft" ? (
          <p className="mt-4 text-sm">This release hasn't been sent yet.</p>
        ) : null}
      </Panel>

      {issues.length ? (
        <div className="mb-6 space-y-3">
          {GROUPS.map((g) =>
            issues
              .filter((i) => i.outcome === g.outcome)
              .map((issue) => (
                <div key={issue.id} className={`rounded-xl border-2 border-ink p-4 ${g.tone}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={g.badge}>{g.title}</Badge>
                    <span className="font-mono text-xs">
                      {issue.code} ·{" "}
                      {issue.fixed_by === "you"
                        ? "fixed by you"
                        : "a person at The Pack will check"}
                    </span>
                  </div>
                  <p className="mt-2">{issue.message}</p>
                </div>
              )),
          )}
          {issues.some((i) => i.outcome === "reject") ? (
            <p className="text-sm text-ink/70">
              Fix what's marked "fixed by you", then send the release again. That creates a new
              version, and nothing you sent before is deleted.
            </p>
          ) : null}
        </div>
      ) : null}

      <Panel
        title="Who gets paid"
        kicker="Splits for every song"
        actions={allConfirmed ? <Badge className="bg-green text-ink">Confirmed</Badge> : null}
      >
        <p className="mb-4 text-sm text-ink/75">
          These are the splits recorded for this release. If anything looks wrong, tell us and we'll
          pause the release while it's fixed.
        </p>
        <div className="space-y-5">
          {tracks.map((t) => {
            const total = t.splits.reduce((a, s) => a + s.shareBp, 0);
            return (
              <div key={t.id}>
                <p className="mb-2 font-bold">
                  {t.position}. “{t.title}”{" "}
                  {t.duration_ms ? (
                    <span className="font-mono text-xs font-normal text-ink/60">
                      {formatDuration(t.duration_ms)}
                    </span>
                  ) : null}
                </p>
                <Table head={["Person", "Role", "Share", "Pack account"]}>
                  {t.splits.map((s) => (
                    <tr key={s.personId}>
                      <Td>{s.name}</Td>
                      <Td>{s.role}</Td>
                      <Td className="font-mono">{s.shareBp / 100}%</Td>
                      <Td>
                        {s.hasAccount ? (
                          "Has account"
                        ) : (
                          <Badge className="bg-yellow text-ink">Not on The Pack yet</Badge>
                        )}
                      </Td>
                    </tr>
                  ))}
                  <tr className="bg-cream font-bold">
                    <Td>Total</Td>
                    <Td />
                    <Td className={`font-mono ${total === 10000 ? "" : "text-ember"}`}>
                      {total / 100}%
                    </Td>
                    <Td />
                  </tr>
                </Table>
              </div>
            );
          })}
        </div>
        {anyUnclaimed ? (
          <p className="mt-4 text-sm">
            Shares for people who aren't on The Pack yet are held for them. We'll invite them to
            claim it. Nobody's share is lost.
          </p>
        ) : null}

        {confirm.isError ? (
          <div className="mt-4">
            <Notice tone="error">{errorMessage(confirm.error)}</Notice>
          </div>
        ) : null}
        {report.isError ? (
          <div className="mt-4">
            <Notice tone="error">{errorMessage(report.error)}</Notice>
          </div>
        ) : null}
        {report.isSuccess ? (
          <div className="mt-4">
            <Notice tone="ok">
              Thanks. We've paused the release and a person at The Pack will be in touch.
            </Notice>
          </div>
        ) : null}

        {problem !== null ? (
          <div className="mt-5 space-y-3">
            <Field label="What looks wrong?">
              <Textarea
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                placeholder="Jo's share should be 50%, not 40%."
              />
            </Field>
            <div className="flex gap-2">
              <Button
                variant="danger"
                disabled={report.isPending || problem.trim().length < 3}
                onClick={() => report.mutate(problem)}
              >
                Pause and tell the co-op
              </Button>
              <Button variant="ghost" onClick={() => setProblem(null)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : tracks.length &&
          !["live", "withdrawn", "taken_down", "rejected"].includes(release.state) ? (
          <div className="mt-5 flex flex-wrap gap-3">
            {!allConfirmed ? (
              <Button variant="green" disabled={confirm.isPending} onClick={() => confirm.mutate()}>
                {confirm.isPending ? "Confirming…" : "Confirm who gets paid"}
              </Button>
            ) : null}
            <Button variant="ghost" onClick={() => setProblem("")}>
              Something's wrong
            </Button>
          </div>
        ) : null}
        <p className="mt-4 text-xs text-ink/60">
          Confirming records who confirmed and when. A later change makes a new, dated split and
          never rewrites past earnings.
        </p>
      </Panel>
    </>
  );
}
