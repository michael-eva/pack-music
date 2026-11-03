import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loading, Notice, errorMessage } from "@/components/app/ui";
import { usePlayer } from "@/components/listener/player";
import { PlayControls, TrackList, totalDuration, WhiteStanley } from "@/components/listener/ui";
import { stanley } from "@/components/site/stanley";
import { listSaves, removeSave } from "@/lib/listener.functions";

export const Route = createFileRoute("/listen/library")({
  component: LibraryPage,
});

/** The listener's saved songs. Only they ever see this list (LIS-4, LIS-7). */
function LibraryPage() {
  const player = usePlayer();
  const queryClient = useQueryClient();
  const saves = useQuery({ queryKey: ["saves"], queryFn: () => listSaves() });
  const remove = useMutation({
    mutationFn: (trackId: string) => removeSave({ data: { trackId } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["saves"] });
      void queryClient.invalidateQueries({ queryKey: ["savedIds"] });
    },
  });

  if (saves.isPending) return <Loading />;
  if (saves.isError) return <Notice tone="error">{errorMessage(saves.error)}</Notice>;
  const tracks = saves.data;

  return (
    <div>
      <p className="mono-kicker text-yellow">Your library</p>
      <h1 className="mt-2 text-5xl sm:text-6xl">Saved</h1>
      <p className="mt-3 max-w-xl text-base text-paper/85">
        Songs you've saved, newest first. Only you can see this list.
      </p>

      {tracks.length ? (
        <>
          <p className="mt-3 font-mono text-xs uppercase tracking-[0.2em]">
            {tracks.length} songs · {totalDuration(tracks)}
          </p>
          <div className="mt-5">
            <PlayControls
              onPlay={() => player.play(tracks, 0)}
              onShuffle={() => player.play(tracks, 0, { shuffle: true })}
            />
          </div>
          <div className="mt-6">
            <TrackList tracks={tracks} onRemove={(id) => remove.mutate(id)} />
          </div>
        </>
      ) : (
        <div className="mt-10 flex items-center gap-4">
          <WhiteStanley src={stanley.tailwagWhite} className="h-24 w-auto" />
          <p className="text-lg">Nothing saved yet. Tap the heart on any song to keep it here.</p>
        </div>
      )}
    </div>
  );
}
