import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { OnAir, PhoneShell } from "@/components/app/ui";
import { getNowPlaying, getPlace } from "@/lib/listener.functions";

export const Route = createFileRoute("/place/$code")({
  loader: ({ params }) => getPlace({ data: { code: params.code } }),
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData?.found ? `${loaderData.site.name} · The Pack` : "The Pack" }],
  }),
  component: PlacePage,
});

/** A3: the business page. Names of artists only, never who visited or saved (LIS-5, LIS-7). */
function PlacePage() {
  const { code } = Route.useParams();
  const data = Route.useLoaderData();
  const live = useQuery({
    queryKey: ["now-playing", code],
    queryFn: () => getNowPlaying({ data: { code } }),
    refetchInterval: 10_000,
  });

  if (!data.found) {
    return (
      <PhoneShell tone="grad-green-blue">
        <h1 className="text-4xl">We can't find this place</h1>
      </PhoneShell>
    );
  }
  const { site, recentArtists } = data;
  const current = live.data?.found ? live.data.current : null;

  return (
    <PhoneShell tone="grad-green-blue">
      <h1 className="text-5xl leading-none">{site.name}</h1>
      <div className="mt-4 flex flex-wrap gap-2 font-mono text-xs uppercase tracking-[0.15em]">
        <span className="rounded-full bg-ink/40 px-3 py-1">{site.type}</span>
        {site.region ? (
          <span className="rounded-full bg-ink/40 px-3 py-1">{site.region}</span>
        ) : null}
        {site.openingHours ? (
          <span className="rounded-full bg-ink/40 px-3 py-1">{site.openingHours}</span>
        ) : null}
      </div>
      {site.vibe ? <p className="mt-5 text-lg leading-relaxed">{site.vibe}</p> : null}

      <Link
        to="/c/$code"
        params={{ code }}
        className="mt-8 flex items-center gap-4 rounded-2xl bg-ink p-4 text-paper"
      >
        <OnAir state={current ? "on_air" : "offline"} />
        {current ? (
          <span className="min-w-0">
            <span className="block truncate font-bold">{current.title}</span>
            <span className="block truncate text-sm text-paper/70">{current.artist}</span>
          </span>
        ) : (
          <span className="text-sm">Nothing playing right now · see recent plays</span>
        )}
      </Link>

      <section className="mt-10">
        <p className="mono-kicker">Recent artists</p>
        <ul className="mt-3 divide-y divide-paper/20 rounded-2xl bg-ink/30">
          {recentArtists.map((a) => (
            <li key={a.id}>
              <Link
                to="/a/$artistId"
                params={{ artistId: a.id }}
                search={{ from: code }}
                className="flex justify-between gap-3 px-4 py-3"
              >
                <span className="font-bold">{a.name}</span>
                <span className="text-sm text-paper/70">{a.region}</span>
              </Link>
            </li>
          ))}
          {!recentArtists.length ? <li className="px-4 py-3 text-sm">No plays yet.</li> : null}
        </ul>
      </section>
    </PhoneShell>
  );
}
