import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AdminButton, Field, Select, TextArea, TextInput } from "@/components/admin/fields";
import { listSiteText, saveSiteText } from "@/lib/admin.functions";
import { COPY_GROUPS } from "@/content/copy";
import { styleToCss, type TextStyle } from "@/lib/site-text";

const STYLE_PREFIX = "style:";

const FONTS = [
  { value: "", label: "Page default" },
  { value: "display", label: "Headline (Fredoka)" },
  { value: "sans", label: "Body (Inter)" },
  { value: "mono", label: "Typewriter (Space Mono)" },
];

const SIZES = [
  { value: "", label: "Default" },
  { value: "0.75", label: "Much smaller" },
  { value: "0.9", label: "Smaller" },
  { value: "1.15", label: "Bigger" },
  { value: "1.35", label: "Much bigger" },
  { value: "1.6", label: "Huge" },
];

const WEIGHTS = [
  { value: "", label: "Default" },
  { value: "300", label: "Light" },
  { value: "400", label: "Regular" },
  { value: "500", label: "Medium" },
  { value: "600", label: "Semi-bold" },
  { value: "700", label: "Bold" },
  { value: "800", label: "Extra bold" },
];

const TRANSFORMS = [
  { value: "", label: "As typed" },
  { value: "uppercase", label: "ALL CAPS" },
  { value: "capitalize", label: "Title Case" },
  { value: "lowercase", label: "lower case" },
];

function isEmptyStyle(s: TextStyle) {
  return !s.font && !s.size && !s.weight && !s.transform && !s.italic;
}

/** Edit every piece of text on the public pages, plus how each block looks. */
export function SiteTextPanel() {
  const load = useServerFn(listSiteText);
  const save = useServerFn(saveSiteText);
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["site-text-admin"], queryFn: () => load({}) });

  const [groupId, setGroupId] = useState(COPY_GROUPS[0]!.id);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [styleDrafts, setStyleDrafts] = useState<Record<string, TextStyle>>({});
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const { overrides, savedStyles } = useMemo(() => {
    const overrides: Record<string, string> = {};
    const savedStyles: Record<string, TextStyle> = {};
    for (const row of data?.entries ?? []) {
      if (row.key.startsWith(STYLE_PREFIX)) {
        try {
          savedStyles[row.key.slice(STYLE_PREFIX.length)] = JSON.parse(row.value) as TextStyle;
        } catch {
          /* ignore */
        }
      } else {
        overrides[row.key] = row.value;
      }
    }
    return { overrides, savedStyles };
  }, [data]);

  const group = COPY_GROUPS.find((g) => g.id === groupId) ?? COPY_GROUPS[0]!;
  const valueFor = (key: string) => drafts[key] ?? overrides[key] ?? group.text[key] ?? "";
  const styleFor = (key: string): TextStyle => styleDrafts[key] ?? savedStyles[key] ?? {};
  const dirtyKeys = Object.keys(drafts);
  const dirtyStyleKeys = Object.keys(styleDrafts);
  const changeCount = dirtyKeys.length + dirtyStyleKeys.length;

  const setStyle = (
    key: string,
    patch: { [K in keyof TextStyle]?: TextStyle[K] | undefined },
  ) => {
    setSaved(false);
    const next: Record<string, unknown> = { ...styleFor(key) };
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined) delete next[k];
      else next[k] = v;
    }
    setStyleDrafts((d) => ({ ...d, [key]: next as TextStyle }));
  };

  const reset = () => {
    setDrafts({});
    setStyleDrafts({});
  };

  if (isLoading) return <p>Loading page text…</p>;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border-2 border-ink bg-paper p-6 shadow-[6px_6px_0_rgba(0,0,0,0.9)]">
        <p className="text-base">
          Pick a page, edit any text box, then save. Clear a box completely and save to put the
          original wording back. Use “Look” under a box to change its font, size or weight.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {COPY_GROUPS.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => {
                setGroupId(g.id);
                reset();
                setOpen({});
                setSaved(false);
              }}
              className={`press rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest ${
                g.id === group.id ? "bg-electric text-paper" : "border-2 border-ink"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border-2 border-ink bg-paper p-6 shadow-[6px_6px_0_rgba(0,0,0,0.9)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl">{group.label}</h2>
          <a
            href={group.path}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-xs uppercase tracking-widest underline"
          >
            Open page
          </a>
        </div>

        <div className="mt-6 space-y-7">
          {group.fields.map((field) => {
            const style = styleFor(field.key);
            const isOpen = open[field.key] ?? false;
            return (
              <div key={field.key}>
                <Field label={field.label}>
                  {field.multiline ? (
                    <TextArea
                      rows={4}
                      value={valueFor(field.key)}
                      onChange={(e) => {
                        setSaved(false);
                        setDrafts((d) => ({ ...d, [field.key]: e.target.value }));
                      }}
                    />
                  ) : (
                    <TextInput
                      value={valueFor(field.key)}
                      onChange={(e) => {
                        setSaved(false);
                        setDrafts((d) => ({ ...d, [field.key]: e.target.value }));
                      }}
                    />
                  )}
                </Field>

                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setOpen((o) => ({ ...o, [field.key]: !isOpen }))}
                    className="press rounded-full border-2 border-ink px-3 py-1 text-[0.7rem] font-bold uppercase tracking-widest"
                  >
                    {isOpen ? "Hide look" : "Look"}
                  </button>
                  {!isEmptyStyle(style) ? (
                    <span className="font-mono text-[0.7rem] uppercase tracking-widest opacity-70">
                      Custom styling on
                    </span>
                  ) : null}
                </div>

                {isOpen ? (
                  <div className="mt-3 rounded-xl border-2 border-dashed border-ink/50 p-4">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <Field label="Font">
                        <Select
                          value={style.font ?? ""}
                          onChange={(e) =>
                            setStyle(field.key, {
                              font: (e.target.value || undefined) as TextStyle["font"],
                            })
                          }
                        >
                          {FONTS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Field label="Size">
                        <Select
                          value={style.size ? String(style.size) : ""}
                          onChange={(e) =>
                            setStyle(field.key, {
                              size: e.target.value ? Number(e.target.value) : undefined,
                            })
                          }
                        >
                          {SIZES.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Field label="Weight">
                        <Select
                          value={style.weight ? String(style.weight) : ""}
                          onChange={(e) =>
                            setStyle(field.key, {
                              weight: e.target.value ? Number(e.target.value) : undefined,
                            })
                          }
                        >
                          {WEIGHTS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Field label="Letter case">
                        <Select
                          value={style.transform ?? ""}
                          onChange={(e) =>
                            setStyle(field.key, {
                              transform: (e.target.value || undefined) as TextStyle["transform"],
                            })
                          }
                        >
                          {TRANSFORMS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </Select>
                      </Field>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-4">
                      <label className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
                        <input
                          type="checkbox"
                          className="h-5 w-5 accent-current"
                          checked={style.italic ?? false}
                          onChange={(e) => setStyle(field.key, { italic: e.target.checked })}
                        />
                        Italic
                      </label>
                      <AdminButton
                        onClick={() => {
                          setSaved(false);
                          setStyleDrafts((d) => ({ ...d, [field.key]: {} }));
                        }}
                      >
                        Reset look
                      </AdminButton>
                    </div>

                    <p className="mt-4 font-mono text-[0.7rem] uppercase tracking-widest opacity-70">
                      Preview
                    </p>
                    <p className="mt-1 text-lg" style={styleToCss(style)}>
                      {valueFor(field.key) || "Sample text"}
                    </p>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {error ? <p className="mt-5 text-base text-ember">{error}</p> : null}
        {saved ? <p className="mt-5 text-base">Saved. Refresh the page to see it live.</p> : null}

        <div className="mt-7 flex flex-wrap gap-3">
          <AdminButton
            tone="go"
            disabled={busy || changeCount === 0}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                const entries = [
                  ...dirtyKeys.map((key) => ({ key, value: drafts[key] ?? "" })),
                  ...dirtyStyleKeys.map((key) => {
                    const s = styleDrafts[key]!;
                    return {
                      key: `${STYLE_PREFIX}${key}`,
                      value: isEmptyStyle(s) ? "" : JSON.stringify(s),
                    };
                  }),
                ];
                await save({ data: { entries } });
                reset();
                setSaved(true);
                await queryClient.invalidateQueries({ queryKey: ["site-text-admin"] });
                await queryClient.invalidateQueries({ queryKey: ["site-text"] });
              } catch (err) {
                setError(err instanceof Error ? err.message : "Could not save");
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Saving…" : `Save ${changeCount || ""} change${changeCount === 1 ? "" : "s"}`}
          </AdminButton>
          <AdminButton disabled={busy || changeCount === 0} onClick={reset}>
            Discard changes
          </AdminButton>
        </div>
      </div>
    </div>
  );
}
