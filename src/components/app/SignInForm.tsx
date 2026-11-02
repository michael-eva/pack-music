import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button, Field, Input, Notice } from "./ui";

/**
 * Email link or password. No Facebook or Google, anywhere (ACC-1).
 * `mode="create"` is used by invite links; anyone else signs in or gets a link.
 */
export function SignInForm({
  defaultEmail = "",
  lockEmail = false,
  mode: initialMode = "password",
  redirectTo,
  onSignedIn,
  dark = false,
}: {
  defaultEmail?: string;
  lockEmail?: boolean;
  mode?: "password" | "create" | "link";
  redirectTo: string;
  onSignedIn: () => void;
  dark?: boolean;
}) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const emailRedirectTo = `${window.location.origin}${redirectTo}`;
    const result =
      mode === "link"
        ? await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo } })
        : mode === "create"
          ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo } })
          : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (result.error) return setError(result.error.message);
    if (mode === "link") return setSent(true);
    if (!result.data.session) return setSent(true);
    onSignedIn();
  }

  if (sent) {
    return (
      <Notice tone="ok">
        Check your inbox at <strong>{email}</strong> for a sign-in link.
        {import.meta.env.DEV ? (
          <>
            {" "}
            Running locally? Open{" "}
            <a className="underline" href="http://127.0.0.1:54324" target="_blank" rel="noreferrer">
              the local mailbox
            </a>
            .
          </>
        ) : null}
      </Notice>
    );
  }

  return (
    <form onSubmit={submit} className={`space-y-4 ${dark ? "[&_span]:text-paper" : ""}`}>
      <Field label="Email">
        <Input type="email" required autoComplete="email" value={email} readOnly={lockEmail} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      {mode !== "link" ? (
        <Field label="Password">
          <Input
            type="password"
            required
            minLength={8}
            autoComplete={mode === "create" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
      ) : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      <Button type="submit" disabled={busy} className="w-full" variant={mode === "create" ? "ember" : "primary"}>
        {busy ? "Hold on…" : mode === "link" ? "Email me a link" : mode === "create" ? "Create account" : "Sign in"}
      </Button>
      <div className="flex flex-wrap justify-center gap-4 text-xs font-bold uppercase tracking-widest">
        {mode !== "link" ? (
          <button type="button" className="underline" onClick={() => setMode("link")}>
            Email me a link instead
          </button>
        ) : (
          <button type="button" className="underline" onClick={() => setMode(initialMode === "create" ? "create" : "password")}>
            Use a password
          </button>
        )}
        {initialMode === "create" && mode !== "password" ? (
          <button type="button" className="underline" onClick={() => setMode("password")}>
            I already have an account
          </button>
        ) : null}
      </div>
    </form>
  );
}
