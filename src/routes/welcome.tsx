import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PackLogo } from "@/components/site/PackLogo";
import { useMe } from "@/components/app/guard";
import { Button, Check, Loading, Notice, errorMessage } from "@/components/app/ui";
import { acceptDocuments, joinCoop } from "@/lib/session.functions";
import { homeFor } from "@/lib/home-route";

export const Route = createFileRoute("/welcome")({
  ssr: false,
  head: () => ({ meta: [{ title: "Welcome · The Pack" }, { name: "robots", content: "noindex" }] }),
  component: Welcome,
});

/**
 * Onboarding gates, one step at a time (ACC-7 to ACC-10):
 * Terms and Privacy, then joining the co-op with its own optional open-data consent.
 */
function Welcome() {
  const me = useMe();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState(false);
  const [openData, setOpenData] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (me.isPending) return <Loading />;
  if (me.isError) return <Navigate to="/sign-in" />;
  const data = me.data;

  const step = !data.termsAccepted ? "terms" : data.needsMembership && !data.membership?.current ? "coop" : "done";
  if (step === "done") return <Navigate to={homeFor(data.roles)} />;
  const rules = data.documents.find((d) => d.kind === "coop_rules");
  const full = data.roles.includes("artist");

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      if (step === "terms") await acceptDocuments({ data: { kinds: ["terms", "privacy"] } });
      else await joinCoop({ data: { openData } });
      setAccepted(false);
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      if (step === "coop") navigate({ to: homeFor(data.roles) });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wave-field grad-blue-magenta flex min-h-screen items-center justify-center px-5 py-16 text-paper">
      <div className="w-full max-w-lg">
        <PackLogo variant="full" className="mx-auto block h-20 text-yellow" />
        <div className="mt-8 rounded-3xl border-2 border-ink bg-paper p-7 text-ink shadow-[6px_6px_0_0_var(--ink)]">
          {step === "terms" ? (
            <>
              <h1 className="text-3xl">Before you start</h1>
              <p className="mt-3 text-sm">Please read and accept the Terms and the Privacy Policy.</p>
              <div className="mt-5">
                <Check checked={accepted} onChange={setAccepted}>
                  I accept the Terms and the Privacy Policy.
                </Check>
              </div>
            </>
          ) : (
            <>
              <p className="mono-kicker text-ink/60">Step 2 of 2</p>
              <h1 className="mt-2 text-3xl">Join the co-op</h1>
              <p className="mt-3 text-sm leading-relaxed">
                {full
                  ? "Artists join as Full members. That means a vote in how The Pack is run."
                  : "Businesses join as Associate members. Associate members don't vote, but they're part of the co-op."}
              </p>
              {rules?.href ? (
                <a href={rules.href} target="_blank" rel="noreferrer" className="mt-4 inline-block font-bold underline">
                  Read {rules.title} ({rules.version})
                </a>
              ) : null}
              <div className="mt-5 space-y-4">
                <Check checked={accepted} onChange={setAccepted}>
                  I accept the Co-op Rules and join as {full ? "a Full" : "an Associate"} member.
                </Check>
                <Check checked={openData} onChange={setOpenData}>
                  Include my aggregate data in the Open data project (optional). It's shared only at SA2 level, never
                  identifies anyone, and you can opt out any time.
                </Check>
              </div>
            </>
          )}
          {error ? <div className="mt-4"><Notice tone="error">{error}</Notice></div> : null}
          <Button variant="ember" className="mt-6 w-full" disabled={!accepted || busy} onClick={submit}>
            {busy ? "Hold on…" : step === "terms" ? "Continue" : "Join The Pack"}
          </Button>
        </div>
      </div>
    </div>
  );
}
