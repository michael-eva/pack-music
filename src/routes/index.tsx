import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PackLogo } from "@/components/site/PackLogo";
import { Stanley } from "@/components/site/blocks";
import { stanley } from "@/components/site/stanley";
import { supabase } from "@/integrations/supabase/client";
import { getMe } from "@/lib/session.functions";
import { homeFor } from "@/lib/home-route";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "The Pack" }] }),
  component: Home,
});

const DEMO = [
  ["Admin", "admin@pack.test"],
  ["Curator", "curator@pack.test"],
  ["Artist (The Southerlies)", "sam@pack.test"],
  ["Business owner (Example Café)", "cafe@pack.test"],
  ["Listener", "listener@pack.test"],
];

function Home() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return setChecking(false);
      try {
        const me = await getMe();
        navigate({ to: homeFor(me.roles) });
      } catch {
        setChecking(false);
      }
    });
  }, [navigate]);

  return (
    <div className="wave-field grad-blue-magenta flex min-h-screen flex-col text-paper">
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-16">
        <PackLogo variant="full" className="h-24 text-yellow sm:h-32" />
        <h1 className="mt-10 max-w-3xl text-5xl sm:text-7xl">Local music, played in real places.</h1>
        <p className="mt-6 max-w-2xl text-lg sm:text-xl">
          The Pack plays music by local artists in the businesses around you. 70% of every business fee goes to the
          artists played there.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            to="/sign-in"
            className="press rounded-full bg-yellow px-7 py-4 text-base font-bold uppercase tracking-widest text-ink"
          >
            {checking ? "Hold on…" : "Sign in"}
          </Link>
          <Stanley src={stanley.dancingWhite} className="h-24 w-auto" flip />
        </div>

        {import.meta.env.DEV ? (
          <div className="mt-14 max-w-xl rounded-2xl border-2 border-paper/40 bg-ink/40 p-5 text-sm">
            <p className="mono-kicker text-yellow">Local demo accounts · password "packpack"</p>
            <ul className="mt-3 space-y-1 font-mono text-xs">
              {DEMO.map(([label, email]) => (
                <li key={email}>
                  {label}: <span className="text-cyan">{email}</span>
                </li>
              ))}
              <li className="pt-2">
                QR page for Example Café: <Link to="/c/$code" params={{ code: "exa" }} className="text-cyan underline">/c/exa</Link>
              </li>
            </ul>
          </div>
        ) : null}
      </main>
    </div>
  );
}
