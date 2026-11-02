import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { RefreshCw, ChevronLeft, ChevronRight, Mail } from "lucide-react";
import { AdminButton } from "./fields";
import { listEnquiries } from "@/lib/admin.functions";

type Source = "signups" | "contact_messages";

export function EnquiriesPanel() {
  const load = useServerFn(listEnquiries);
  const [source, setSource] = useState<Source>("signups");
  const [page, setPage] = useState(0);
  const query = useQuery({
    queryKey: ["admin-enquiries", source, page],
    queryFn: () => load({ data: { source, page } }),
  });
  const total = query.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / 50));

  return (
    <section aria-label="Enquiries" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl">Enquiries</h2>
        <AdminButton onClick={() => query.refetch()} disabled={query.isFetching} title="Refresh enquiries">
          <span className="inline-flex items-center gap-2"><RefreshCw size={16} />Refresh</span>
        </AdminButton>
      </div>
      <div className="flex flex-wrap gap-3" role="group" aria-label="Enquiry source">
        {([
          ["signups", "Join the Pack"],
          ["contact_messages", "Contact messages"],
        ] as const).map(([value, label]) => (
          <AdminButton key={value} tone={source === value ? "go" : "ink"}
            aria-pressed={source === value} onClick={() => { setSource(value); setPage(0); }}>
            {label}
          </AdminButton>
        ))}
      </div>
      {query.isPending ? <p role="status">Loading enquiries…</p> : null}
      {query.isError ? (
        <div role="alert" className="space-y-3">
          <p>Could not load enquiries. Please try again.</p>
          <AdminButton onClick={() => query.refetch()}>Try again</AdminButton>
        </div>
      ) : null}
      {query.data && !query.isError ? (
        <>
          <p className="text-sm">{total} {source === "signups" ? "signups" : "contact messages"}</p>
          {total === 0 ? <p>No {source === "signups" ? "signups" : "contact messages"} yet.</p> : null}
          <div className="space-y-5">
            {query.data.rows.map((row) => (
              <article key={row.id} className="min-w-0 rounded-lg border-2 border-ink p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 space-y-2">
                    <h3 className="break-words text-xl">{row.name || "Name not provided"}</h3>
                    <a className="block break-all underline underline-offset-4" href={`mailto:${row.email}`}>{row.email}</a>
                    <time className="block text-sm" dateTime={row.created_at}>
                      {new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeStyle: "short", timeZone: "Australia/Perth" }).format(new Date(row.created_at))} (Perth)
                    </time>
                  </div>
                  <a href={`mailto:${row.email}`} className="inline-flex items-center gap-2 text-sm font-bold underline underline-offset-4">
                    <Mail size={16} />Reply
                  </a>
                </div>
                {row.role || row.location ? (
                  <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3 text-sm">
                    {row.role ? <div><dt className="font-bold">Interest</dt><dd className="capitalize">{row.role === "council" ? "Local government" : row.role}</dd></div> : null}
                    {row.location ? <div className="min-w-0"><dt className="font-bold">Location</dt><dd className="break-words">{row.location}</dd></div> : null}
                  </dl>
                ) : null}
                <p className="mt-5 whitespace-pre-wrap break-words leading-relaxed">{row.message || "No message provided."}</p>
              </article>
            ))}
          </div>
          {pages > 1 ? (
            <div className="flex flex-wrap items-center gap-4" aria-label="Enquiry pages">
              <AdminButton title="Previous page" aria-label="Previous page" disabled={page === 0 || query.isFetching} onClick={() => setPage(page - 1)}><ChevronLeft size={18} /></AdminButton>
              <span className="text-sm">Page {page + 1} of {pages}</span>
              <AdminButton title="Next page" aria-label="Next page" disabled={page + 1 >= pages || query.isFetching} onClick={() => setPage(page + 1)}><ChevronRight size={18} /></AdminButton>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}