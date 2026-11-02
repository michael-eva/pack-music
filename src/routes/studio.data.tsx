import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Button,
  Empty,
  Loading,
  Notice,
  PageTitle,
  Panel,
  StateBadge,
  errorMessage,
} from "@/components/app/ui";
import { exportMyData, getStudio, withdrawRelease } from "@/lib/studio.functions";

export const Route = createFileRoute("/studio/data")({
  component: MyData,
});

/** DAT-1 export and DAT-2 withdraw, on the artist's own screens. */
function MyData() {
  const queryClient = useQueryClient();
  const studio = useQuery({ queryKey: ["studio"], queryFn: () => getStudio() });
  const [confirming, setConfirming] = useState<string | null>(null);
  const exporter = useMutation({
    mutationFn: () => exportMyData(),
    onSuccess: (data) => {
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      );
      Object.assign(document.createElement("a"), {
        href: url,
        download: `the-pack-my-data-${data.exportedAt.slice(0, 10)}.json`,
      }).click();
      URL.revokeObjectURL(url);
    },
  });
  const withdraw = useMutation({
    mutationFn: (releaseId: string) => withdrawRelease({ data: { releaseId } }),
    onSuccess: () => {
      setConfirming(null);
      queryClient.invalidateQueries({ queryKey: ["studio"] });
    },
  });

  if (studio.isPending) return <Loading />;
  if (studio.isError) return <Notice tone="error">{errorMessage(studio.error)}</Notice>;
  const releases = studio.data.releases.filter(
    (r) => !["withdrawn", "taken_down"].includes(r.state),
  );
  const gone = studio.data.releases.filter((r) => ["withdrawn", "taken_down"].includes(r.state));

  return (
    <>
      <PageTitle
        kicker="My data"
        title="Your data is yours"
        lead="The Pack looks after a copy of your music and details. You can take it all with you, or take a release off The Pack, whenever you like."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Export my data">
          <p className="text-sm leading-relaxed">
            One file with everything The Pack holds about you: your profile, releases, song details,
            who gets paid, the agreements you accepted, and every line of your earnings.
          </p>
          {exporter.isError ? (
            <div className="mt-4">
              <Notice tone="error">{errorMessage(exporter.error)}</Notice>
            </div>
          ) : null}
          <Button className="mt-5" disabled={exporter.isPending} onClick={() => exporter.mutate()}>
            {exporter.isPending ? "Gathering it up…" : "Export my data"}
          </Button>
          <p className="mt-4 text-xs text-ink/60">
            Want your account deleted completely? Message the co-op. During the pilot a person
            handles it and confirms in writing what was removed.
          </p>
        </Panel>

        <Panel title="Withdraw a release">
          <p className="mb-4 text-sm leading-relaxed">
            Withdrawing takes a release off every playlist and player within five minutes. Your
            earnings history stays, because it's financial history.
          </p>
          {releases.length === 0 ? (
            <Empty title="Nothing to withdraw" />
          ) : (
            <ul className="divide-y divide-ink/15">
              {releases.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-3 py-3">
                  <Link
                    to="/studio/releases/$id"
                    params={{ id: r.id }}
                    className="flex-1 font-bold underline"
                  >
                    {r.title}
                  </Link>
                  <StateBadge state={r.state} />
                  {confirming === r.id ? (
                    <span className="flex gap-2">
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={withdraw.isPending}
                        onClick={() => withdraw.mutate(r.id)}
                      >
                        Yes, withdraw
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setConfirming(null)}>
                        Keep it
                      </Button>
                    </span>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => setConfirming(r.id)}>
                      Withdraw
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {withdraw.isError ? (
            <div className="mt-4">
              <Notice tone="error">{errorMessage(withdraw.error)}</Notice>
            </div>
          ) : null}
          {gone.length ? (
            <p className="mt-4 text-xs text-ink/60">
              Off The Pack: {gone.map((r) => r.title).join(", ")}. Their earnings history is kept.
            </p>
          ) : null}
        </Panel>
      </div>
    </>
  );
}
