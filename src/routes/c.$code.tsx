import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";
import { PhoneShell, Notice, errorMessage } from "@/components/app/ui";
import { SignInForm } from "@/components/app/SignInForm";
import { Stanley } from "@/components/site/blocks";
import { stanley } from "@/components/site/stanley";
import { supabase } from "@/integrations/supabase/client";
import { getNowPlaying, saveTrack, savedState } from "@/lib/listener.functions";

export const Route = createFileRoute("/c/$code")({
  validateSearch: z.object({ save: z.string().uuid().optional() }),
  loader: ({ params }) => getNowPlaying({ data: { code: params.code } }),
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.found ? `Now playing at ${loaderData.site.name} · The Pack` : "The Pack",
      },
      {
        name: "description",
        content: "See what's playing here, and save it. No app, no account needed to look.",
      },
    ],
  }),
  component: NowPlayingPage,
});

/** A1: scan, see what's playing, save it. No login to look; login only to save (LIS-1, LIS-3). */
function NowPlayingPage() {
  const { code } = Route.useParams();
  const initial = Route.useLoaderData();
  const { save } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["now-playing", code],
    queryFn: () => getNowPlaying({ data: { code } }),
    initialData: initial,
    refetchInterval: 5_000, // VEN-6: track change reaches the page within five seconds
  });
  const data = query.data;

  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [sheetFor, setSheetFor] = useState<{ trackId: string; title: string } | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: s }) => setSignedIn(!!s.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setSignedIn(!!session));
    return () => sub.subscription.unsubscribe();
  }, []);

  const currentId = data.found ? data.current?.trackId : undefined;
  const saved = useQuery({
    queryKey: ["saved-state", currentId],
    queryFn: () => savedState({ data: { trackId: currentId! } }),
    enabled: !!signedIn && !!currentId,
  });

  async function doSave(trackId: string) {
    try {
      await saveTrack({ data: { trackId, code } });
      setMessage({ tone: "ok", text: "Saved to Heard somewhere real." });
      await queryClient.invalidateQueries({ queryKey: ["saved-state"] });
    } catch (e) {
      setMessage({ tone: "error", text: errorMessage(e) });
    }
  }

  // Back from an email link with ?save=…: finish the save the listener started (LIS-3).
  useEffect(() => {
    if (!save || !signedIn) return;
    void doSave(save).then(() =>
      navigate({ to: "/c/$code", params: { code }, search: {}, replace: true }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [save, signedIn]);

  function onSaveClick(trackId: string, title: string) {
    setMessage(null);
    if (signedIn) void doSave(trackId);
    else setSheetFor({ trackId, title });
  }

  if (!data.found) {
    return (
      <PhoneShell>
        <h1 className="text-4xl">We can't find this place</h1>
        <p className="mt-3">Check the code on the sign and try again.</p>
      </PhoneShell>
    );
  }

  const today = new Date().toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <PhoneShell>
      <p className="mono-kicker text-yellow">Now playing at</p>
      <Link
        to="/place/$code"
        params={{ code }}
        className="mt-1 block font-display text-3xl font-bold uppercase underline decoration-2 underline-offset-4"
      >
        {data.site.name}
      </Link>

      {data.current ? (
        <section className="mt-6">
          {data.current.artworkUrl ? (
            <img
              src={data.current.artworkUrl}
              alt=""
              className="aspect-square w-full rounded-3xl border-4 border-ink object-cover shadow-[6px_6px_0_0_var(--ink)]"
            />
          ) : null}
          <h1 className="mt-6 text-4xl leading-none">{data.current.title}</h1>
          <p className="mt-2 text-lg">
            <Link
              to="/a/$artistId"
              params={{ artistId: data.current.artistId }}
              search={{ from: code }}
              className="font-bold underline"
            >
              {data.current.artist}
            </Link>
            {data.current.artistRegion ? ` · ${data.current.artistRegion}` : ""}
          </p>
          {saved.data ? (
            <p className="mt-6 rounded-full bg-green px-6 py-4 text-center text-base font-bold uppercase tracking-widest text-ink">
              Saved · heard at {saved.data.place ?? data.site.name}
            </p>
          ) : (
            <button
              type="button"
              onClick={() => onSaveClick(data.current!.trackId, data.current!.title)}
              className="press mt-6 w-full rounded-full bg-yellow px-6 py-4 text-base font-bold uppercase tracking-widest text-ink"
            >
              Save this song
            </button>
          )}
          {data.current.curatedBy ? (
            <p className="mt-4 text-center font-mono text-xs uppercase tracking-[0.2em]">
              Curated by {data.current.curatedBy}
            </p>
          ) : null}
        </section>
      ) : (
        <section className="mt-8 rounded-3xl border-2 border-paper/40 bg-ink/30 p-6 text-center">
          <Stanley src={stanley.listeningWhite} className="mx-auto h-24 w-auto" />
          <p className="mt-3 font-display text-2xl font-bold uppercase">
            Nothing playing right now
          </p>
          <p className="mt-2 text-sm">The player is off. Here's what played recently.</p>
        </section>
      )}

      {message ? (
        <div className="mt-4 text-ink">
          <Notice tone={message.tone}>{message.text}</Notice>
        </div>
      ) : null}

      {data.recent.length ? (
        <section className="mt-10">
          <p className="mono-kicker">Recently played here</p>
          <ul className="mt-3 divide-y divide-paper/20 rounded-2xl bg-ink/30">
            {data.recent.map((t) => (
              <li key={t.trackId} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{t.title}</p>
                  <Link
                    to="/a/$artistId"
                    params={{ artistId: t.artistId }}
                    search={{ from: code }}
                    className="text-sm underline"
                  >
                    {t.artist}
                  </Link>
                </div>
                <button
                  type="button"
                  onClick={() => onSaveClick(t.trackId, t.title)}
                  className="text-xs font-bold uppercase tracking-widest underline"
                >
                  Save
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {sheetFor ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-ink/60"
          role="dialog"
          aria-modal="true"
          aria-label="Sign in to save"
        >
          <div className="mx-auto w-full max-w-md rounded-t-3xl border-2 border-ink bg-paper p-6 text-ink">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="mono-kicker text-ink/60">Save this song</p>
                <p className="mt-1 font-display text-2xl font-bold uppercase">{sheetFor.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setSheetFor(null)}
                className="text-sm font-bold uppercase underline"
              >
                Close
              </button>
            </div>
            <p className="mt-3 text-sm">
              Sign in with an email link or a password. That's all we ask for. We'll keep this song
              as heard here · {today}.
            </p>
            <div className="mt-5">
              <SignInForm
                mode="link"
                redirectTo={`/c/${code}?save=${sheetFor.trackId}`}
                onSignedIn={() => {
                  const id = sheetFor.trackId;
                  setSheetFor(null);
                  void doSave(id);
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </PhoneShell>
  );
}
