import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Footer } from "@/components/site/Footer";
import { PageShell, Slab, TornPanel } from "@/components/site/blocks";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in – The Pack" },
      { name: "description", content: "Sign in to manage The Pack's website content." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Sign in – The Pack" },
      { property: "og:description", content: "Content management for The Pack Music Co-operative." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: AuthPage,
});

const inputClass =
  "mt-2 w-full rounded-xl border-2 border-ink bg-paper px-4 py-3 text-base text-ink outline-none focus:ring-4 focus:ring-yellow";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);

    if (mode === "in") {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (signInError) return setError(signInError.message);
      navigate({ to: "/admin" });
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/admin` },
    });
    setBusy(false);
    if (signUpError) return setError(signUpError.message);
    setNotice("Account created. If email confirmation is on, check your inbox, then sign in.");
    setMode("in");
  }

  return (
    <PageShell tone="deep">
      <Slab>
        <TornPanel className="mx-auto max-w-lg px-8 pb-10 pt-12">
          <p className="font-mono text-xs uppercase tracking-[0.25em]">Pack HQ</p>
          <h1 className="mt-3 text-4xl">{mode === "in" ? "Sign in" : "Create your account"}</h1>
          <p className="mt-3 text-base leading-relaxed">
            This is the private door to the content manager. Visitors never see it.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <label className="block text-sm font-bold uppercase tracking-widest">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                autoComplete="email"
              />
            </label>
            <label className="block text-sm font-bold uppercase tracking-widest">
              Password
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                autoComplete={mode === "in" ? "current-password" : "new-password"}
              />
            </label>

            {error ? <p className="text-sm font-bold text-ember">{error}</p> : null}
            {notice ? <p className="text-sm font-bold">{notice}</p> : null}

            <button
              type="submit"
              disabled={busy}
              className="press w-full rounded-full bg-electric px-6 py-3 text-sm font-bold uppercase tracking-widest text-paper disabled:opacity-60"
            >
              {busy ? "Hold on…" : mode === "in" ? "Sign in" : "Create account"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "in" ? "up" : "in");
              setError(null);
            }}
            className="mt-6 font-mono text-xs uppercase tracking-[0.2em] underline"
          >
            {mode === "in" ? "First time? Create an account" : "Already have an account? Sign in"}
          </button>
        </TornPanel>
      </Slab>
      <Footer dark />
    </PageShell>
  );
}
