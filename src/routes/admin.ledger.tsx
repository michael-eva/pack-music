import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useState } from "react";
import {
  Badge,
  Button,
  Field,
  Input,
  Loading,
  Notice,
  PageTitle,
  Panel,
  Simulated,
  Stat,
  Table,
  Td,
  TestModeNote,
  errorMessage,
  formatCents,
} from "@/components/app/ui";
import { approveRun, getMonth, playLogCsv, runDryRun } from "@/lib/ledger.functions";

export const Route = createFileRoute("/admin/ledger")({ component: Ledger });

function lastMonth() {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  return d.toISOString().slice(0, 7);
}

type Report = NonNullable<Awaited<ReturnType<typeof getMonth>>["report"]>;

/** PAY-6 month-end: dry-run, review totals and exceptions, then approve to post. */
function Ledger() {
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(lastMonth());
  const [error, setError] = useState<string | null>(null);
  const q = useQuery({
    queryKey: ["admin", "ledger", month],
    queryFn: () => getMonth({ data: { month } }),
    enabled: /^\d{4}-\d{2}$/.test(month),
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "ledger", month] });

  const dry = useMutation({
    mutationFn: () => runDryRun({ data: { month } }),
    onSuccess: () => (setError(null), refresh()),
    onError: (e) => setError(errorMessage(e)),
  });
  const approve = useMutation({
    mutationFn: (runId: string) => approveRun({ data: { runId } }),
    onSuccess: () => (setError(null), refresh()),
    onError: (e) => setError(errorMessage(e)),
  });
  const csv = useMutation({
    mutationFn: () => playLogCsv({ data: { month } }),
    onSuccess: (r) => {
      const url = URL.createObjectURL(new Blob([r.csv], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = r.filename;
      a.click();
      URL.revokeObjectURL(url);
    },
  });

  const report = q.data?.report ?? null;
  const run = q.data?.run ?? null;
  const approved = run?.state === "approved";

  return (
    <>
      <PageTitle
        kicker="Ledger only in the pilot"
        title="Month-end"
        lead="Each site's fee is its own pot, shared only among the tracks played there. Whole cents, largest-remainder rounding, and the ledger must reconcile to $0.00."
      />
      {report?.settings.testMode ? (
        <TestModeNote>
          Money is notional. Entries are written and statements shown, but no payouts are made.
        </TestModeNote>
      ) : null}

      <div className="flex flex-wrap items-end gap-3">
        <Field label="Month">
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </Field>
        <Button disabled={approved || dry.isPending} onClick={() => dry.mutate()}>
          {run ? "Run the dry-run again" : "Run dry-run"}
        </Button>
        {run && !approved ? (
          <Button
            variant="ember"
            disabled={approve.isPending || report?.reconciliation.differenceCents !== 0}
            onClick={() => approve.mutate(run.id)}
          >
            Approve and post
          </Button>
        ) : null}
        <Button variant="ghost" disabled={csv.isPending} onClick={() => csv.mutate()}>
          Play log CSV
        </Button>
        {run ? (
          <Badge className={approved ? "bg-green" : "bg-yellow"}>
            {approved
              ? `Approved and locked ${new Date(run.approved_at!).toLocaleDateString("en-AU")}`
              : `Dry-run ${new Date(run.created_at).toLocaleString("en-AU")}`}
          </Badge>
        ) : null}
      </div>
      {error ? (
        <div className="mt-4">
          <Notice tone="error">{error}</Notice>
        </div>
      ) : null}

      <div className="mt-6">
        {q.isPending ? (
          <Loading />
        ) : q.isError ? (
          <Notice tone="error">{errorMessage(q.error)}</Notice>
        ) : !report ? (
          <Notice>No run for this month yet. Run a dry-run to see the pots.</Notice>
        ) : (
          <ReportView report={report} />
        )}
      </div>
    </>
  );
}

function ReportView({ report }: { report: Report }) {
  const [open, setOpen] = useState<string | null>(null);
  const r = report.reconciliation;
  const sim = report.settings.testMode;
  return (
    <div className="space-y-6">
      <div
        className={`rounded-2xl border-4 p-5 ${r.differenceCents === 0 ? "border-green-700 bg-green-100" : "border-pink bg-pink-100"}`}
      >
        <p className="mono-kicker">Reconciliation (PAY-10)</p>
        <p className="mt-1 font-display text-4xl font-bold">
          Difference {formatCents(r.differenceCents)}
        </p>
        <p className="mt-2 text-sm">
          Artist pool {formatCents(r.artistPoolCents)} = accrued {formatCents(r.accruedCents)} +
          held {formatCents(r.heldCents)} + not allocated {formatCents(r.unallocatedCents)}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Sites with a pot" value={report.pots.length} />
        <Stat
          label="Plays recorded"
          value={report.rawPlays}
          sub={`${report.pots.reduce((a, p) => a + p.qualifiedPlays, 0)} reached ${report.settings.playThresholdSeconds} s`}
        />
        <Stat label="Artist share" value={`${report.settings.artistShareBp / 100}%`} />
        <Stat label="Payout threshold" value={formatCents(report.settings.payoutThresholdCents)} />
      </div>

      <Panel title="Site pots">
        <Table head={["Site", "Fee", "To artists", "To The Pack", "Qualified plays"]}>
          {report.pots.map((p) => (
            <tr key={p.siteId}>
              <Td className="font-bold">{p.siteName}</Td>
              <Td>{formatCents(p.feeCents)}</Td>
              <Td>{formatCents(p.artistPoolCents)}</Td>
              <Td>{formatCents(p.packCents)}</Td>
              <Td>{p.qualifiedPlays}</Td>
            </tr>
          ))}
        </Table>
      </Panel>

      <Panel
        title="Who gets what"
        kicker="Grouped by person. Open a line to show the working (PAY-5)."
      >
        <Table head={["Person", "This month", "Held", "Balance", ""]}>
          {report.people.map((p) => (
            <Fragment key={p.personId}>
              <tr>
                <Td>
                  <button
                    type="button"
                    className="text-left font-bold underline"
                    onClick={() => setOpen(open === p.personId ? null : p.personId)}
                  >
                    {p.name}
                  </button>
                  {!p.hasAccount ? (
                    <Badge className="ml-2 bg-yellow">Unclaimed, held for them</Badge>
                  ) : null}
                </Td>
                <Td>
                  {formatCents(p.accruedCents)} {sim ? <Simulated /> : null}
                </Td>
                <Td>{p.heldCents ? formatCents(p.heldCents) : "—"}</Td>
                <Td>{formatCents(p.balanceCents)}</Td>
                <Td>
                  {p.wouldBePaid ? (
                    <Badge className="bg-green">{sim ? "Would be paid" : "Payable"}</Badge>
                  ) : (
                    <span className="text-xs text-ink/60">Keeps building</span>
                  )}
                </Td>
              </tr>
              {open === p.personId ? (
                <tr>
                  <td colSpan={5} className="bg-cream px-3 py-3">
                    <ul className="space-y-1.5 text-sm">
                      {report.entries
                        .filter((e) => e.personId === p.personId)
                        .map((e, i) => (
                          <li key={i}>
                            <span className="font-bold">{e.trackTitle}</span> at {e.siteName}:{" "}
                            {e.plays} of {e.potPlays} qualified plays ×{" "}
                            {formatCents(e.artistPoolCents)} artist pool, then {e.shareBp / 100}%
                            share = <span className="font-bold">{formatCents(e.cents)}</span>
                            {e.type === "hold" ? (
                              <Badge className="ml-2 bg-pink text-paper">Held</Badge>
                            ) : null}
                          </li>
                        ))}
                    </ul>
                  </td>
                </tr>
              ) : null}
            </Fragment>
          ))}
        </Table>
      </Panel>

      <Panel title="Exceptions" kicker="Shown so nothing is hidden">
        {report.exceptions.length === 0 ? (
          <p className="text-sm text-ink/60">None.</p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {report.exceptions.map((x, i) => (
              <li key={i}>
                <Badge className={x.kind === "held" ? "bg-pink text-paper" : "bg-yellow"}>
                  {x.kind === "no_plays"
                    ? "No qualified plays"
                    : x.kind === "no_split"
                      ? "No confirmed split"
                      : "Held (flagged)"}
                </Badge>{" "}
                {x.siteName}
                {x.trackTitle ? `, “${x.trackTitle}”` : ""}: {formatCents(x.cents)}
                {x.kind === "no_plays"
                  ? " stays undistributed: no artist was played there."
                  : x.kind === "no_split"
                    ? " not allocated until a split is confirmed."
                    : " frozen until the flag is cleared."}
              </li>
            ))}
          </ul>
        )}
        {report.unclaimed.length ? (
          <p className="mt-4 text-sm">
            Unclaimed balances (PAY-8):{" "}
            {report.unclaimed
              .map(
                (u) => `${u.name}${u.email ? ` <${u.email}>` : ""} ${formatCents(u.accruedCents)}`,
              )
              .join(", ")}
            . Invite them to claim.
          </p>
        ) : null}
      </Panel>
    </div>
  );
}
