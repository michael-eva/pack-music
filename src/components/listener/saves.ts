import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { removeSave, saveTrack, savedIds } from "@/lib/listener.functions";

/** The listener's saved songs, as a set of track ids, with a toggle. */
export function useSaves() {
  const queryClient = useQueryClient();
  const ids = useQuery({ queryKey: ["savedIds"], queryFn: () => savedIds(), staleTime: 60_000 });
  const set = new Set(ids.data ?? []);

  const toggle = useMutation({
    mutationFn: async (trackId: string) => {
      if (set.has(trackId)) await removeSave({ data: { trackId } });
      else await saveTrack({ data: { trackId } });
    },
    onMutate: async (trackId) => {
      await queryClient.cancelQueries({ queryKey: ["savedIds"] });
      const before = queryClient.getQueryData<string[]>(["savedIds"]) ?? [];
      queryClient.setQueryData<string[]>(
        ["savedIds"],
        before.includes(trackId) ? before.filter((t) => t !== trackId) : [...before, trackId],
      );
      return { before };
    },
    onError: (_e, _id, ctx) => queryClient.setQueryData(["savedIds"], ctx?.before ?? []),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["savedIds"] });
      void queryClient.invalidateQueries({ queryKey: ["saves"] });
    },
  });

  return {
    isSaved: (trackId: string) => set.has(trackId),
    toggle: (trackId: string) => toggle.mutate(trackId),
  };
}
