import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Button,
  Check,
  Loading,
  Notice,
  PageTitle,
  Panel,
  errorMessage,
} from "@/components/app/ui";
import { acceptDocuments } from "@/lib/session.functions";
import { getAgreement } from "@/lib/studio.functions";

export const Route = createFileRoute("/studio/agreement")({
  component: Agreement,
});

/** C3: the Artist Agreement in plain English, with an explicit, unticked acceptance (ART-3, ACC-7). */
function Agreement() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["studio", "agreement"], queryFn: () => getAgreement() });
  const [agreed, setAgreed] = useState(false);
  const accept = useMutation({
    mutationFn: () => acceptDocuments({ data: { kinds: ["artist_agreement"] } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      await queryClient.invalidateQueries({ queryKey: ["studio"] });
      navigate({ to: "/studio" });
    },
  });

  if (query.isPending) return <Loading />;
  if (query.isError) return <Notice tone="error">{errorMessage(query.error)}</Notice>;
  const { document: doc, acceptedAt } = query.data;

  function download() {
    const text = [
      `${doc.title}, version ${doc.version}`,
      "",
      ...doc.summary.flatMap((s) => [s.heading.toUpperCase(), s.body, ""]),
      doc.body,
      "",
      acceptedAt ? `Accepted ${new Date(acceptedAt).toLocaleString("en-AU")}` : "Not yet accepted",
    ].join("\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: `pack-artist-agreement-${doc.version}.txt`,
    });
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageTitle kicker={`Version ${doc.version}`} title="The Artist Agreement, in plain English" />
      <div className="grid gap-4 sm:grid-cols-2">
        {doc.summary.map((s, i) => (
          <Panel key={s.heading} className={i % 2 ? "bg-cyan-100" : "bg-yellow-100"}>
            <h2 className="text-2xl [filter:none]">{s.heading}</h2>
            <p className="mt-2 leading-relaxed">{s.body}</p>
          </Panel>
        ))}
      </div>
      <details className="mt-6 rounded-xl border-2 border-ink bg-paper p-4">
        <summary className="cursor-pointer font-bold">Read the full agreement</summary>
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{doc.body}</p>
      </details>

      <Panel className="mt-6">
        {acceptedAt ? (
          <Notice tone="ok">
            You agreed to this version on{" "}
            {new Date(acceptedAt).toLocaleDateString("en-AU", { dateStyle: "long" })}.
          </Notice>
        ) : (
          <Check checked={agreed} onChange={setAgreed}>
            I have read the agreement and I agree.
          </Check>
        )}
        {accept.isError ? (
          <div className="mt-4">
            <Notice tone="error">{errorMessage(accept.error)}</Notice>
          </div>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-3">
          {!acceptedAt ? (
            <Button
              variant="ember"
              disabled={!agreed || accept.isPending}
              onClick={() => accept.mutate()}
            >
              {accept.isPending ? "Saving…" : "Agree and continue"}
            </Button>
          ) : null}
          <Button variant="ghost" onClick={download}>
            Download a copy
          </Button>
        </div>
      </Panel>
    </>
  );
}
