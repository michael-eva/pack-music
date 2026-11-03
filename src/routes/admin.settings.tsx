import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useMe } from "@/components/app/guard";
import {
  Button,
  Check,
  Field,
  Input,
  Loading,
  Notice,
  PageTitle,
  Panel,
  errorMessage,
} from "@/components/app/ui";
import { getSettingsTable, updateSetting } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/settings")({ component: Settings });

type Rules = { noArtistTwiceInARow: boolean; repeatWindowMinutes: number };

/** ADM-4: the numbers that drive playback and the playlist builder live here, not in code. */
function Settings() {
  const me = useMe();
  const isAdmin = me.data?.roles.includes("admin");
  const queryClient = useQueryClient();
  const q = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => getSettingsTable(),
    enabled: !!isAdmin,
  });
  const [target, setTarget] = useState("");
  const [rules, setRules] = useState<Rules | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const rows = new Map((q.data ?? []).map((r) => [r.key, r]));
  useEffect(() => {
    if (!q.data) return;
    const m = new Map(q.data.map((r) => [r.key, r]));
    setTarget(String(m.get("loudness_target_lufs")?.value ?? "-14"));
    setRules(
      (m.get("playlist_rules")?.value as Rules) ?? {
        noArtistTwiceInARow: true,
        repeatWindowMinutes: 180,
      },
    );
  }, [q.data]);

  const save = useMutation({
    mutationFn: (v: { key: string; value: unknown }) => updateSetting({ data: v }),
    onSuccess: (_r, v) => {
      setSaved(v.key);
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
  });

  if (me.data && !isAdmin) return <Navigate to="/admin/playlists" />;
  if (q.isPending || !rules) return <Loading />;
  if (q.isError) return <Notice tone="error">{errorMessage(q.error)}</Notice>;
  const changed = (key: string) => {
    const r = rows.get(key);
    return r?.changedBy
      ? `Last changed by ${r.changedBy}, ${new Date(r.changedAt).toLocaleString("en-AU")}`
      : "Default value";
  };

  return (
    <>
      <PageTitle kicker="Every change is logged" title="Settings" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Loudness target" kicker={changed("loudness_target_lufs")}>
          <p className="mb-4 text-sm leading-relaxed text-ink/75">
            Every song plays at this level, so nothing jumps out or disappears. Masters are never
            changed: the player turns each song up or down. Common references are −14 and −16 LUFS.
          </p>
          <form
            className="flex items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate({ key: "loudness_target_lufs", value: Number(target) });
            }}
          >
            <Field label="Target, LUFS">
              <Input
                type="number"
                step="0.5"
                min={-30}
                max={-5}
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              />
            </Field>
            <Button type="submit" disabled={save.isPending}>
              Save
            </Button>
          </form>
        </Panel>
        <Panel title="Playlist rules" kicker={changed("playlist_rules")}>
          <p className="mb-4 text-sm leading-relaxed text-ink/75">
            Checked as curators build. A curator can publish past a rule break, but has to say so.
          </p>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate({ key: "playlist_rules", value: rules });
            }}
          >
            <Check
              checked={rules.noArtistTwiceInARow}
              onChange={(v) => setRules({ ...rules, noArtistTwiceInARow: v })}
            >
              No artist twice in a row
            </Check>
            <Field
              label="No song repeated within, minutes"
              hint="180 = three hours. 0 turns the check off."
            >
              <Input
                type="number"
                min={0}
                max={1440}
                value={rules.repeatWindowMinutes}
                onChange={(e) =>
                  setRules({ ...rules, repeatWindowMinutes: Math.round(Number(e.target.value)) })
                }
              />
            </Field>
            <Button type="submit" disabled={save.isPending}>
              Save
            </Button>
          </form>
        </Panel>
      </div>
      {save.isError ? (
        <div className="mt-4">
          <Notice tone="error">{errorMessage(save.error)}</Notice>
        </div>
      ) : saved && !save.isPending ? (
        <div className="mt-4">
          <Notice tone="ok">
            Saved. It applies to the next song played and the next playlist check.
          </Notice>
        </div>
      ) : null}
    </>
  );
}
