import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Search as SearchIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Loading, Notice, errorMessage } from "@/components/app/ui";
import {
  ArtistChip,
  PlaylistTile,
  ReleaseTile,
  Section,
  Shelf,
  TrackList,
  WhiteStanley,
} from "@/components/listener/ui";
import { stanley } from "@/components/site/stanley";
import { getSearchFilters, search } from "@/lib/listener.functions";

export const Route = createFileRoute("/listen/search")({
  validateSearch: z.object({
    q: z.string().optional(),
    genre: z.string().optional(),
    region: z.string().optional(),
  }),
  component: SearchPage,
});

const selectClass =
  "rounded-full border-2 border-ink bg-paper px-4 py-2 text-sm font-bold text-ink outline-none focus:ring-4 focus:ring-yellow";

function SearchPage() {
  const params = Route.useSearch();
  const navigate = useNavigate({ from: "/listen/search" });
  const [text, setText] = useState(params.q ?? "");

  // Keep the address bar in step with the box, without a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.q ?? "") !== text)
        navigate({ search: (s) => ({ ...s, q: text || undefined }), replace: true });
    }, 300);
    return () => clearTimeout(t);
  }, [text, params.q, navigate]);

  const filters = useQuery({
    queryKey: ["listen", "filters"],
    queryFn: () => getSearchFilters(),
    staleTime: Infinity,
  });
  const hasQuery = !!(params.q || params.genre || params.region);
  const results = useQuery({
    queryKey: ["listen", "search", params],
    queryFn: () =>
      search({ data: { q: params.q ?? "", genre: params.genre, region: params.region } }),
    enabled: hasQuery,
    placeholderData: keepPreviousData,
  });

  const parents = (filters.data?.genres ?? []).filter((g) => !g.parent_id);
  const childrenOf = (id: string) => (filters.data?.genres ?? []).filter((g) => g.parent_id === id);
  const r = results.data;
  const nothing =
    r && !r.tracks.length && !r.artists.length && !r.releases.length && !r.playlists.length;

  return (
    <div>
      <h1 className="text-5xl">Search</h1>
      <label className="mt-5 flex items-center gap-3 rounded-full border-2 border-ink bg-paper px-5 py-3 text-ink shadow-[4px_4px_0_0_var(--ink)] focus-within:ring-4 focus-within:ring-yellow">
        <SearchIcon className="h-5 w-5 shrink-0" />
        <input
          type="search"
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Songs, artists, releases or playlists"
          aria-label="Search"
          className="w-full bg-transparent text-lg outline-none"
        />
      </label>

      <div className="mt-4 flex flex-wrap gap-3">
        <select
          aria-label="Genre"
          className={selectClass}
          value={params.genre ?? ""}
          onChange={(e) =>
            navigate({ search: (s) => ({ ...s, genre: e.target.value || undefined }) })
          }
        >
          <option value="">Any genre</option>
          {parents.map((p) => (
            <optgroup key={p.id} label={p.label}>
              <option value={p.id}>All {p.label}</option>
              {childrenOf(p.id).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <select
          aria-label="Region"
          className={selectClass}
          value={params.region ?? ""}
          onChange={(e) =>
            navigate({ search: (s) => ({ ...s, region: e.target.value || undefined }) })
          }
        >
          <option value="">Anywhere</option>
          {(filters.data?.regions ?? []).map((g) => (
            <option key={g.code} value={g.code}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-8">
        {!hasQuery ? (
          <div className="flex items-center gap-4">
            <WhiteStanley src={stanley.listeningWhite} className="h-20 w-auto" />
            <p className="text-lg">Type a name, or pick a genre or a region to browse.</p>
          </div>
        ) : results.isPending ? (
          <Loading />
        ) : results.isError ? (
          <Notice tone="error">{errorMessage(results.error)}</Notice>
        ) : nothing ? (
          <div className="flex items-center gap-4">
            <WhiteStanley src={stanley.barkingWhite} className="h-20 w-auto" />
            <p className="text-lg">Nothing matches that yet. Try another word.</p>
          </div>
        ) : r ? (
          <div>
            {r.tracks.length ? (
              <Section title="Songs">
                <TrackList tracks={r.tracks} />
              </Section>
            ) : null}
            {r.artists.length ? (
              <Section title="Artists">
                <div className="flex flex-wrap gap-3">
                  {r.artists.map((a) => (
                    <ArtistChip key={a.id} artist={a} />
                  ))}
                </div>
              </Section>
            ) : null}
            {r.releases.length ? (
              <Section title="Releases">
                <Shelf>
                  {r.releases.map((x) => (
                    <ReleaseTile key={x.id} release={x} />
                  ))}
                </Shelf>
              </Section>
            ) : null}
            {r.playlists.length ? (
              <Section title="Playlists">
                <Shelf>
                  {r.playlists.map((p) => (
                    <PlaylistTile key={p.id} playlist={p} />
                  ))}
                </Shelf>
              </Section>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
