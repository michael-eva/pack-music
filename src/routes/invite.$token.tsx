import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PackLogo } from "@/components/site/PackLogo";
import { SignInForm } from "@/components/app/SignInForm";
import { Button, Check, Field, Input, Loading, Notice, errorMessage } from "@/components/app/ui";
import { supabase } from "@/integrations/supabase/client";
import { acceptTerms, getInvite, redeemInvite } from "@/lib/session.functions";

export const Route = createFileRoute("/invite/$token")({
  ssr: false,
  head: () => ({
    meta: [{ title: "You're invited · The Pack" }, { name: "robots", content: "noindex" }],
  }),
  component: InvitePage,
});

const ROLE_WORDS: Record<string, string> = {
  curator: "as a curator",
  admin: "as an admin",
};

/** C1 step 1: an invited person makes an account and accepts the Terms (ACC-3, ACC-7). */
function InvitePage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const invite = useQuery({
    queryKey: ["invite", token],
    queryFn: () => getInvite({ data: { token } }),
  });
  const session = useQuery({
    queryKey: ["session"],
    queryFn: async () => (await supabase.auth.getSession()).data.session,
  });
  const [name, setName] = useState("");
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function finish() {
    setBusy(true);
    setError(null);
    try {
      await redeemInvite({ data: { token, displayName: name || undefined } });
      await acceptTerms({ data: { newsOptIn: false } });
      navigate({ to: "/welcome" });
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  return (
    <div className="wave-field grad-pink-orange flex min-h-screen items-center justify-center px-5 py-16 text-paper">
      <div className="w-full max-w-md">
        <PackLogo variant="full" className="mx-auto block h-20 text-paper" />
        <div className="mt-8 rounded-3xl border-2 border-ink bg-paper p-7 text-ink shadow-[6px_6px_0_0_var(--ink)]">
          {invite.isPending || session.isPending ? (
            <Loading />
          ) : invite.data?.status !== "ok" ? (
            <>
              <h1 className="text-3xl">This link won't open</h1>
              <p className="mt-3 text-sm">
                {invite.data?.status === "used"
                  ? "This invite has already been used. Each link works once."
                  : invite.data?.status === "expired"
                    ? "This invite has expired. Ask The Pack to send a new one."
                    : "We couldn't find this invite. Check the link in your email."}
              </p>
            </>
          ) : (
            <>
              <h1 className="mt-3 text-4xl">You're invited</h1>
              <p className="mt-2 text-sm text-ink/70">
                Join The Pack {ROLE_WORDS[invite.data.role] ?? ""}. It takes a couple of minutes.
              </p>
              <div className="mt-6">
                {!session.data ? (
                  <SignInForm
                    mode="create"
                    defaultEmail={invite.data.email}
                    lockEmail
                    redirectTo={`/invite/${token}`}
                    onSignedIn={() => session.refetch()}
                  />
                ) : (
                  <div className="space-y-4">
                    <Notice>Signed in as {session.data.user.email}.</Notice>
                    <Field label="Your name" hint="Shown on playlists you curate.">
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Alex"
                      />
                    </Field>
                    <Check checked={terms} onChange={setTerms}>
                      I accept the Terms and the Privacy Policy.
                    </Check>
                    {error ? <Notice tone="error">{error}</Notice> : null}
                    <Button
                      variant="ember"
                      className="w-full"
                      disabled={!terms || busy}
                      onClick={finish}
                    >
                      {busy ? "Hold on…" : "Continue"}
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
