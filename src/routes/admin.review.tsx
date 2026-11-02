import { createFileRoute, Link, Outlet, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Empty, Loading, Notice, PageTitle, StateBadge, errorMessage } from "@/components/app/ui";
import { listReviewQueue } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/review")({ component: ReviewLayout });

/** D2: the queue sits on the left, the release under review on the right. */
function ReviewLayout() {
  const params = useParams({ strict: false }) as { id?: string };
  const q = useQuery({ queryKey: ["admin", "queue"], queryFn: () => listReviewQueue() });

  return (
    <>
      <PageTitle kicker="Nothing approved unheard" title="Review queue" />
      <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside>
          {q.isPending ? (
            <Loading />
          ) : q.isError ? (
            <Notice tone="error">{errorMessage(q.error)}</Notice>
          ) : q.data.length === 0 ? (
            <Empty title="Queue's empty">Nothing is waiting for a person right now.</Empty>
          ) : (
            <ul className="space-y-2">
              {q.data.map((r) => (
                <li key={r.id}>
                  <Link
                    to="/admin/review/$id"
                    params={{ id: r.id }}
                    className={`block rounded-xl border-2 border-ink px-3 py-2.5 ${params.id === r.id ? "bg-yellow" : "bg-cream hover:bg-yellow-100"}`}
                  >
                    <p className="font-bold">
                      {r.title}{" "}
                      <span className="font-normal text-ink/60">
                        ({r.type.toUpperCase()}) v{r.version}
                      </span>
                    </p>
                    <p className="text-xs text-ink/70">{r.artistName}</p>
                    <div className="mt-1.5">
                      <StateBadge state={r.state} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </aside>
        <div className="min-w-0">
          {params.id ? (
            <Outlet />
          ) : (
            <Empty title="Pick a release">Choose a release from the queue to review it.</Empty>
          )}
        </div>
      </div>
    </>
  );
}
