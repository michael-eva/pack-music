import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Button,
  Field,
  Input,
  Loading,
  Notice,
  PageTitle,
  Table,
  Td,
  errorMessage,
} from "@/components/app/ui";
import { listAudit } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/audit")({ component: Audit });

type Filters = { actorEmail: string; action: string; from: string; to: string };

/** ADM-7: who did what, when, with before and after. */
function Audit() {
  const [draft, setDraft] = useState<Filters>({ actorEmail: "", action: "", from: "", to: "" });
  const [filters, setFilters] = useState<Filters>(draft);
  const [page, setPage] = useState(0);
  const q = useQuery({
    queryKey: ["admin", "audit", filters, page],
    queryFn: () =>
      listAudit({
        data: {
          page,
          ...(filters.actorEmail ? { actorEmail: filters.actorEmail } : {}),
          ...(filters.action ? { action: filters.action } : {}),
          ...(filters.from ? { from: filters.from } : {}),
          ...(filters.to ? { to: filters.to } : {}),
        },
      }),
    placeholderData: keepPreviousData,
  });
  const set = (k: keyof Filters) => (e: { target: { value: string } }) =>
    setDraft({ ...draft, [k]: e.target.value });

  return (
    <>
      <PageTitle kicker="Every admin action" title="Audit log" />
      <form
        className="mb-5 flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(0);
          setFilters(draft);
        }}
      >
        <Field label="Who (email)">
          <Input value={draft.actorEmail} onChange={set("actorEmail")} placeholder="admin@" />
        </Field>
        <Field label="Action">
          <Input value={draft.action} onChange={set("action")} placeholder="release." />
        </Field>
        <Field label="From">
          <Input type="date" value={draft.from} onChange={set("from")} />
        </Field>
        <Field label="To">
          <Input type="date" value={draft.to} onChange={set("to")} />
        </Field>
        <Button type="submit">Filter</Button>
      </form>
      {q.isPending ? (
        <Loading />
      ) : q.isError ? (
        <Notice tone="error">{errorMessage(q.error)}</Notice>
      ) : (
        <>
          <Table head={["When", "Who", "Action", "Target", "Before → after", "Reason"]}>
            {q.data.rows.map((r) => (
              <tr key={r.id}>
                <Td className="whitespace-nowrap font-mono text-xs">
                  {new Date(r.created_at).toLocaleString("en-AU")}
                </Td>
                <Td className="text-xs">{r.actorEmail}</Td>
                <Td className="font-mono text-xs">{r.action}</Td>
                <Td className="max-w-40 truncate font-mono text-[0.7rem]">{r.target}</Td>
                <Td className="max-w-md font-mono text-[0.7rem]">
                  {r.before != null ? (
                    <span className="text-ink/60">{JSON.stringify(r.before)} → </span>
                  ) : null}
                  {r.after != null ? JSON.stringify(r.after) : null}
                </Td>
                <Td className="text-xs">{r.reason}</Td>
              </tr>
            ))}
          </Table>
          <div className="mt-4 flex items-center gap-3 text-sm">
            <Button
              size="sm"
              variant="ghost"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              Newer
            </Button>
            <span>
              {q.data.total === 0
                ? "No entries"
                : `${page * 50 + 1}–${Math.min((page + 1) * 50, q.data.total)} of ${q.data.total}`}
            </span>
            <Button
              size="sm"
              variant="ghost"
              disabled={(page + 1) * 50 >= q.data.total}
              onClick={() => setPage(page + 1)}
            >
              Older
            </Button>
          </div>
        </>
      )}
    </>
  );
}
