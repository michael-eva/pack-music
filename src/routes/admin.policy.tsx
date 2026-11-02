import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Button,
  Check,
  Input,
  Loading,
  Notice,
  PageTitle,
  Panel,
  Table,
  Td,
  errorMessage,
  formatCents,
} from "@/components/app/ui";
import { getPolicy, updateSetting } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/policy")({ component: Policy });

type Row = { key: string; value: unknown; changedBy: string | null; changedAt: string };

/** How each number is shown and typed. Stored as cents, basis points and seconds. */
const EDITORS: {
  key: string;
  label: string;
  show: (v: unknown) => string;
  toInput: (v: unknown) => string;
  parse: (s: string) => unknown;
  unit?: string;
}[] = [
  {
    key: "site_fee_cents",
    label: "Site fee",
    show: (v) => `${formatCents(Number(v))} per site, per month`,
    toInput: (v) => (Number(v) / 100).toFixed(2),
    parse: (s) => Math.round(Number(s) * 100),
    unit: "$",
  },
  {
    key: "artist_share_bp",
    label: "Revenue split",
    show: (v) => `${Number(v) / 100}% artists · ${100 - Number(v) / 100}% The Pack`,
    toInput: (v) => String(Number(v) / 100),
    parse: (s) => Math.round(Number(s) * 100),
    unit: "% to artists",
  },
  {
    key: "play_threshold_seconds",
    label: "Play threshold",
    show: (v) => `${v} seconds`,
    toInput: String,
    parse: (s) => Math.round(Number(s)),
    unit: "seconds",
  },
  {
    key: "payout_threshold_cents",
    label: "Payout threshold",
    show: (v) => formatCents(Number(v)),
    toInput: (v) => (Number(v) / 100).toFixed(2),
    parse: (s) => Math.round(Number(s) * 100),
    unit: "$",
  },
  {
    key: "loudness_target_lufs",
    label: "Loudness target",
    show: (v) => `${v} LUFS`,
    toInput: String,
    parse: Number,
    unit: "LUFS",
  },
  {
    key: "accepted_ai_answers",
    label: "Accepted AI answers",
    show: (v) => (v as string[]).map((x) => (x === "no" ? "No" : "Yes")).join(", "),
    toInput: (v) => (v as string[]).join(", "),
    parse: (s) =>
      s
        .split(",")
        .map((x) => x.trim().toLowerCase())
        .filter(Boolean),
    unit: "no, yes",
  },
];

/** D5: the numbers that drive the ledger, checks and playlists live here, not in code (ADM-4). */
function Policy() {
  const queryClient = useQueryClient();
  const q = useQuery({ queryKey: ["admin", "policy"], queryFn: () => getPolicy() });
  const [editing, setEditing] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const save = useMutation({
    mutationFn: (v: { key: string; value: unknown }) => updateSetting({ data: v }),
    onSuccess: () => {
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "policy"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });

  if (q.isPending) return <Loading />;
  if (q.isError) return <Notice tone="error">{errorMessage(q.error)}</Notice>;
  const rows = new Map<string, Row>(q.data.map((r) => [r.key, r]));
  const testMode = rows.get("test_mode");
  const rules = rows.get("playlist_rules")?.value as
    { noArtistTwiceInARow: boolean; repeatWindowMinutes: number } | undefined;
  const flags = (rows.get("feature_flags")?.value ?? {}) as Record<string, boolean>;
  const changed = (r?: Row) =>
    r?.changedBy
      ? `${r.changedBy} · ${new Date(r.changedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}`
      : "Default";

  return (
    <>
      <PageTitle kicker="Every change is logged" title="Policy settings" />
      <Panel title="Test mode" kicker="Pilot only">
        <p className="max-w-3xl text-sm leading-relaxed">
          While on, money is notional. Statements and the artist dashboard carry a “simulated”
          label, businesses see a free-trial note, and no payouts are made. It's a temporary,
          pilot-only state: at commercial launch the switch and this box are removed.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <div className="inline-flex overflow-hidden rounded-full border-2 border-ink">
            {[true, false].map((v) => (
              <button
                key={String(v)}
                type="button"
                disabled={save.isPending}
                onClick={() => testMode?.value !== v && save.mutate({ key: "test_mode", value: v })}
                className={`px-5 py-2 text-sm font-bold uppercase tracking-widest ${testMode?.value === v ? (v ? "bg-yellow" : "bg-ink text-paper") : "bg-paper"}`}
              >
                {v ? "On" : "Off"}
              </button>
            ))}
          </div>
          <span className="text-xs text-ink/60">{changed(testMode)}</span>
        </div>
      </Panel>

      <Panel className="mt-6" title="Settings">
        <Table head={["Setting", "Value", "Last changed", ""]}>
          {EDITORS.map((e) => {
            const row = rows.get(e.key);
            return (
              <tr key={e.key}>
                <Td className="font-bold">{e.label}</Td>
                <Td>
                  {editing === e.key ? (
                    <div className="flex items-center gap-2">
                      <Input
                        className="!mt-0 max-w-40"
                        value={input}
                        onChange={(x) => setInput(x.target.value)}
                      />
                      <span className="text-xs text-ink/60">{e.unit}</span>
                    </div>
                  ) : row ? (
                    e.show(row.value)
                  ) : (
                    "—"
                  )}
                </Td>
                <Td className="text-xs">{changed(row)}</Td>
                <Td>
                  {editing === e.key ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={save.isPending}
                        onClick={() => save.mutate({ key: e.key, value: e.parse(input) })}
                      >
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditing(e.key);
                        setInput(row ? e.toInput(row.value) : "");
                      }}
                    >
                      Change
                    </Button>
                  )}
                </Td>
              </tr>
            );
          })}
          {rules ? (
            <tr>
              <Td className="font-bold">Playlist rules</Td>
              <Td>
                <div className="space-y-2">
                  <Check
                    checked={rules.noArtistTwiceInARow}
                    onChange={(v) =>
                      save.mutate({
                        key: "playlist_rules",
                        value: { ...rules, noArtistTwiceInARow: v },
                      })
                    }
                  >
                    No artist twice in a row
                  </Check>
                  <div className="flex items-center gap-2 text-sm">
                    No repeat in
                    <Input
                      className="!mt-0 w-24"
                      type="number"
                      defaultValue={rules.repeatWindowMinutes}
                      onBlur={(x) =>
                        Number(x.target.value) !== rules.repeatWindowMinutes &&
                        save.mutate({
                          key: "playlist_rules",
                          value: {
                            ...rules,
                            repeatWindowMinutes: Math.round(Number(x.target.value)),
                          },
                        })
                      }
                    />
                    minutes
                  </div>
                </div>
              </Td>
              <Td className="text-xs">{changed(rows.get("playlist_rules"))}</Td>
              <Td />
            </tr>
          ) : null}
        </Table>
        {save.isError ? (
          <div className="mt-3">
            <Notice tone="error">{errorMessage(save.error)}</Notice>
          </div>
        ) : null}
      </Panel>

      <Panel
        className="mt-6"
        title="Feature flags"
        kicker="Phase 2 work stays behind a flag, off by default (NFR-9)"
      >
        <div className="space-y-2">
          {Object.entries(flags).map(([k, v]) => (
            <Check
              key={k}
              checked={v}
              onChange={(next) =>
                save.mutate({ key: "feature_flags", value: { ...flags, [k]: next } })
              }
            >
              {k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())}
            </Check>
          ))}
        </div>
        <p className="mt-3 text-xs text-ink/60">{changed(rows.get("feature_flags"))}</p>
      </Panel>
    </>
  );
}
