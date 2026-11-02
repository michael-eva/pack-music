import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import {
  Button,
  Empty,
  Loading,
  Notice,
  PageTitle,
  Panel,
  Select,
  Simulated,
  Table,
  Td,
  TestModeNote,
  errorMessage,
  formatCents,
} from "@/components/app/ui";
import { getStatement, type StatementLine } from "@/lib/studio.functions";

export const Route = createFileRoute("/studio/earnings")({
  validateSearch: z.object({
    month: z
      .string()
      .regex(/^\d{4}-\d{2}-01$/)
      .optional(),
  }),
  component: Earnings,
});

function monthName(month: string) {
  return new Date(`${month}T00:00:00Z`).toLocaleDateString("en-AU", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** C8: earnings statement, built only from the ledger (PAY-9, PAY-10). */
function Earnings() {
  const { month } = Route.useSearch();
  const navigate = useNavigate();
  const query = useQuery({
    queryKey: ["studio", "statement", month ?? "latest"],
    queryFn: () => getStatement({ data: month ? { month } : {} }),
  });

  if (query.isPending) return <Loading />;
  if (query.isError) return <Notice tone="error">{errorMessage(query.error)}</Notice>;
  const s = query.data;

  if (!s.month) {
    return (
      <>
        <PageTitle kicker="Earnings" title="Your statements" />
        <TestModeNote show={s.testMode}>
          Statements carry a SIMULATED label. No money moves during the pilot.
        </TestModeNote>
        <Empty title="No statement yet">
          Each month, once The Pack has checked and posted the month's plays, your statement shows
          up here with the working.
        </Empty>
      </>
    );
  }

  const name = monthName(s.month);
  const example = s.lines.find((l) => l.type === "accrual");

  function downloadCsv() {
    const rows = [
      ...(s.testMode ? [["SIMULATED: no money moves during the pilot"]] : []),
      [
        "Month",
        "Business",
        "Song",
        "Qualified plays",
        "Plays at business",
        "Song total",
        "Your split %",
        "You earned",
        "Status",
      ],
      ...s.lines.map((l) => [
        s.month!.slice(0, 7),
        l.business,
        l.song,
        String(l.plays),
        String(l.potPlays),
        (l.songTotalCents / 100).toFixed(2),
        String(l.shareBp / 100),
        (l.cents / 100).toFixed(2),
        l.type === "hold" ? "Held" : "Earned",
      ]),
      ["Total", "", "", "", "", "", "", (s.monthCents / 100).toFixed(2), ""],
    ];
    const csv = rows.map((r) => r.map((c) => `"${c.replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    Object.assign(document.createElement("a"), {
      href: url,
      download: `pack-statement-${s.month!.slice(0, 7)}.csv`,
    }).click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageTitle
        kicker="Earnings"
        title={`Statement, ${name}`}
        actions={
          <>
            {s.months.length > 1 ? (
              <Select
                aria-label="Month"
                className="!mt-0 w-auto"
                value={s.month}
                onChange={(e) =>
                  navigate({ to: "/studio/earnings", search: { month: e.target.value } })
                }
              >
                {s.months.map((m) => (
                  <option key={m} value={m}>
                    {monthName(m)}
                  </option>
                ))}
              </Select>
            ) : null}
            <Button variant="ghost" onClick={downloadCsv}>
              Download CSV
            </Button>
          </>
        }
      />
      <TestModeNote show={s.testMode}>
        This statement and its CSV are SIMULATED. No money moves during the pilot.
      </TestModeNote>

      <Table head={["Business", "Song", "Plays", "Song total", "Your split", "You earned"]}>
        {s.lines.map((l) => (
          <tr key={l.id}>
            <Td>{l.business}</Td>
            <Td>{l.song}</Td>
            <Td className="font-mono">
              {l.plays} of {l.potPlays}
            </Td>
            <Td className="font-mono">{formatCents(l.songTotalCents)}</Td>
            <Td className="font-mono">{l.shareBp / 100}%</Td>
            <Td className="font-mono font-bold">
              {formatCents(l.cents)}
              {l.type === "hold" ? (
                <span className="ml-2 font-sans text-xs font-normal text-ember">held</span>
              ) : null}
            </Td>
          </tr>
        ))}
        <tr className="bg-cream font-bold">
          <Td>Total for {name.split(" ")[0]}</Td>
          <Td />
          <Td />
          <Td />
          <Td />
          <Td className="font-mono">
            <span className="inline-flex items-center gap-2">
              {formatCents(s.monthCents)}
              {s.testMode ? <Simulated /> : null}
            </span>
          </Td>
        </tr>
      </Table>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="How this was worked out">
          {example ? (
            <Working
              line={example}
              artistShareBp={s.artistShareBp}
              threshold={s.playThresholdSeconds}
            />
          ) : (
            <p>Nothing earned this month.</p>
          )}
          <p className="mt-3 text-sm text-ink/70">
            Each business's fee is shared only among the songs played there that month. Only plays
            of {s.playThresholdSeconds} seconds or more count.
          </p>
          {s.heldCents ? (
            <p className="mt-3 text-sm">
              {formatCents(s.heldCents)} is held while The Pack checks something with you. It isn't
              lost: it's released once that's cleared.
            </p>
          ) : null}
        </Panel>
        <Panel kicker="Balance" title={formatCents(s.balanceCents)}>
          <p>Paid out as soon as it reaches {formatCents(s.payoutThresholdCents)}.</p>
          {s.balanceCents >= s.payoutThresholdCents ? (
            <p className="mt-2 text-sm font-bold">
              {s.testMode
                ? "This would be paid now. During the pilot no money moves."
                : "This will be paid at the next payout."}
            </p>
          ) : (
            <p className="mt-2 text-sm text-ink/70">
              Below that, it keeps building month to month.
            </p>
          )}
        </Panel>
      </div>
    </>
  );
}

function Working({
  line,
  artistShareBp,
  threshold,
}: {
  line: StatementLine;
  artistShareBp: number;
  threshold: number;
}) {
  return (
    <p className="leading-relaxed">
      {line.business}'s {formatCents(line.feeCents)} site fee left{" "}
      {formatCents(line.artistPoolCents)} for artists ({artistShareBp / 100}%). {line.song} had{" "}
      {line.plays} of the {line.potPlays} plays that lasted {threshold} seconds or more, so it
      earned {formatCents(line.songTotalCents)}. Your share is {line.shareBp / 100}%, which is{" "}
      {formatCents(line.cents)}.
    </p>
  );
}
