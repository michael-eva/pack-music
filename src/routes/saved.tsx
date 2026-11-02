import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loading, PhoneShell } from "@/components/app/ui";
import { supabase } from "@/integrations/supabase/client";
import { listSaves, removeSave } from "@/lib/listener.functions";

export const Route = createFileRoute("/saved")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/sign-in", search: { next: "/saved" } });
  },
  head: () => ({
    meta: [{ title: "Heard somewhere real · The Pack" }, { name: "robots", content: "noindex" }],
  }),
  component: SavedPage,
});

const MESSAGE_KEY = "pack.saved.message-seen";

/** LIS-4: the songs a listener saved, always with where and when they heard them. */
function SavedPage() {
  const queryClient = useQueryClient();
  const saves = useQuery({ queryKey: ["saves"], queryFn: () => listSaves() });
  const [showMessage, setShowMessage] = useState(() => {
    try {
      return !window.localStorage.getItem(MESSAGE_KEY);
    } catch {
      return true;
    }
  });

  function closeMessage() {
    setShowMessage(false);
    try {
      window.localStorage.setItem(MESSAGE_KEY, "1");
    } catch {
      // fine: it shows again next time
    }
  }

  async function remove(trackId: string) {
    await removeSave({ data: { trackId } });
    await queryClient.invalidateQueries({ queryKey: ["saves"] });
  }

  return (
    <PhoneShell>
      <h1 className="text-5xl leading-none">Heard somewhere real</h1>

      {showMessage ? (
        <section className="mt-6 rounded-2xl border-2 border-ink bg-paper p-5 text-ink">
          <p className="font-display text-xl font-bold uppercase">Your saves help build The Pack</p>
          <p className="mt-2 text-sm leading-relaxed">
            Every save tells local artists and businesses their music is landing. They only ever see
            counts, never who you are. At-home listening is coming: we'll let you know when sign-up
            opens.
          </p>
          <button
            type="button"
            onClick={closeMessage}
            className="mt-3 text-xs font-bold uppercase tracking-widest underline"
          >
            Got it
          </button>
        </section>
      ) : (
        <button
          type="button"
          onClick={() => setShowMessage(true)}
          className="mt-4 text-xs font-bold uppercase tracking-widest underline"
        >
          What are saves for?
        </button>
      )}

      {saves.isPending ? (
        <Loading />
      ) : saves.data?.length ? (
        <ul className="mt-8 divide-y divide-paper/20 rounded-2xl bg-ink/30">
          {saves.data.map((s) => (
            <li key={s.trackId} className="flex items-center gap-3 px-4 py-3">
              {s.artworkUrl ? (
                <img
                  src={s.artworkUrl}
                  alt=""
                  className="h-12 w-12 rounded-lg border-2 border-ink object-cover"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{s.title}</p>
                <p className="truncate text-sm text-paper/80">
                  <Link
                    to="/a/$artistId"
                    params={{ artistId: s.artistId }}
                    search={{}}
                    className="underline"
                  >
                    {s.artist}
                  </Link>
                </p>
                <p className="font-mono text-[0.7rem] uppercase tracking-[0.12em] text-paper/70">
                  {s.place ? `Heard at ${s.place.name}` : "Saved"} ·{" "}
                  {new Date(s.savedAt).toLocaleDateString("en-AU", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(s.trackId)}
                className="text-xs font-bold uppercase tracking-widest underline"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8">
          Nothing saved yet. Scan a Pack code in a café, shop or bar to save what's playing.
        </p>
      )}
    </PhoneShell>
  );
}
