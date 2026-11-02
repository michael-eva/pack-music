import { createFileRoute, Link, Outlet, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Button,
  Empty,
  Field,
  Input,
  Loading,
  Notice,
  PageTitle,
  Panel,
  Table,
  Td,
  errorMessage,
} from "@/components/app/ui";
import { createPlaylist, listPlaylists } from "@/lib/curation.functions";

export const Route = createFileRoute("/admin/playlists")({ component: PlaylistsLayout });

function PlaylistsLayout() {
  const params = useParams({ strict: false }) as { id?: string };
  return params.id ? <Outlet /> : <PlaylistList />;
}

/** CUR-1: every playlist names the person who made it. */
function PlaylistList() {
  const navigate = useNavigate();
  const q = useQuery({ queryKey: ["admin", "playlists"], queryFn: () => listPlaylists() });
  const [name, setName] = useState("");
  const [curatedBy, setCuratedBy] = useState("");
  useEffect(() => {
    if (q.data && !curatedBy) setCuratedBy(q.data.defaultCuratedBy);
  }, [q.data, curatedBy]);
  const create = useMutation({
    mutationFn: () => createPlaylist({ data: { name, curatedBy } }),
    onSuccess: (r) => navigate({ to: "/admin/playlists/$id", params: { id: r.id } }),
  });

  return (
    <>
      <PageTitle
        kicker="A person chooses every song"
        title="Playlists"
        lead="Filter the catalogue, then pick by hand. Every playlist is credited to the person who made it."
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div>
          {q.isPending ? (
            <Loading />
          ) : q.isError ? (
            <Notice tone="error">{errorMessage(q.error)}</Notice>
          ) : q.data.playlists.length === 0 ? (
            <Empty title="No playlists yet">Start one on the right.</Empty>
          ) : (
            <Table head={["Playlist", "Curated by", "Version", "Songs", "Playing at"]}>
              {q.data.playlists.map((p) => (
                <tr key={p.id}>
                  <Td>
                    <Link
                      to="/admin/playlists/$id"
                      params={{ id: p.id }}
                      className="font-bold underline"
                    >
                      {p.name}
                    </Link>
                  </Td>
                  <Td>{p.curatedBy}</Td>
                  <Td>{p.latestVersion ? `v${p.latestVersion}` : "Draft"}</Td>
                  <Td>{p.trackCount}</Td>
                  <Td>{p.playingAt.join(", ") || "—"}</Td>
                </tr>
              ))}
            </Table>
          )}
        </div>
        <Panel title="New playlist">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate();
            }}
          >
            <Field label="Name">
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Quiet afternoon, retail"
              />
            </Field>
            <Field label="Curated by" hint="Shown wherever the playlist appears.">
              <Input required value={curatedBy} onChange={(e) => setCuratedBy(e.target.value)} />
            </Field>
            {create.isError ? <Notice tone="error">{errorMessage(create.error)}</Notice> : null}
            <Button type="submit" disabled={create.isPending} className="w-full">
              Start building
            </Button>
          </form>
        </Panel>
      </div>
    </>
  );
}
