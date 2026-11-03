import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PackLogo } from "@/components/site/PackLogo";
import { useMe } from "@/components/app/guard";
import { Button, Check, Loading, Notice, errorMessage } from "@/components/app/ui";
import { acceptTerms } from "@/lib/session.functions";
import { homeFor } from "@/lib/home-route";

export const Route = createFileRoute("/welcome")({
  ssr: false,
  head: () => ({ meta: [{ title: "Welcome · The Pack" }, { name: "robots", content: "noindex" }] }),
  component: Welcome,
});

/** First sign-in: accept the current Terms and Privacy Policy (ACC-7). News is opt-in (LIS-6). */
function Welcome() {
  const me = useMe();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState(false);
  const [news, setNews] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (me.isPending) return <Loading />;
  if (me.isError) return <Navigate to="/sign-in" />;
  if (me.data.termsAccepted) return <Navigate to={homeFor(me.data.roles)} />;
  const roles = me.data.roles;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await acceptTerms({ data: { newsOptIn: news } });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      navigate({ to: homeFor(roles) });
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  return (
    <div className="wave-field grad-blue-magenta flex min-h-screen items-center justify-center px-5 py-16 text-paper">
      <div className="w-full max-w-lg">
        <PackLogo variant="full" className="mx-auto block h-20 text-yellow" />
        <div className="mt-8 rounded-3xl border-2 border-ink bg-paper p-7 text-ink shadow-[6px_6px_0_0_var(--ink)]">
          <h1 className="text-3xl">Welcome to The Pack</h1>
          <p className="mt-3 text-sm leading-relaxed">
            Local music, picked by people. Before you start listening, please read and accept the
            Terms and the Privacy Policy.
          </p>
          <ul className="mt-3 list-disc pl-5 text-sm">
            {me.data.documents.map((d) => (
              <li key={d.id}>
                {d.title} <span className="font-mono text-xs text-ink/60">({d.version})</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 space-y-4">
            <Check checked={accepted} onChange={setAccepted}>
              I accept the Terms and the Privacy Policy.
            </Check>
            <Check checked={news} onChange={setNews}>
              Send me the occasional email about new music and the co-op (optional).
            </Check>
          </div>
          {error ? (
            <div className="mt-4">
              <Notice tone="error">{error}</Notice>
            </div>
          ) : null}
          <Button
            variant="ember"
            className="mt-6 w-full"
            disabled={!accepted || busy}
            onClick={submit}
          >
            {busy ? "Hold on…" : "Start listening"}
          </Button>
        </div>
      </div>
    </div>
  );
}
