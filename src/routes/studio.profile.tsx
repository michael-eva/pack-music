import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Button,
  Field,
  Input,
  Loading,
  Notice,
  PageTitle,
  Panel,
  Select,
  Textarea,
  errorMessage,
} from "@/components/app/ui";
import { getProfile, saveProfile } from "@/lib/studio.functions";

export const Route = createFileRoute("/studio/profile")({
  component: Profile,
});

type Form = { publicName: string; legalName: string; region: string; bio: string; links: string };

/** C2: public name, private legal name, home region, bio (ART-1). */
function Profile() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["studio", "profile"], queryFn: () => getProfile() });
  const [form, setForm] = useState<Form | null>(null);
  useEffect(() => {
    if (query.data && !form) setForm(query.data.profile);
  }, [query.data, form]);

  const save = useMutation({
    mutationFn: (data: Form) => saveProfile({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studio"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });

  if (query.isPending || !form) return <Loading />;
  if (query.isError) return <Notice tone="error">{errorMessage(query.error)}</Notice>;
  const set = (key: keyof Form) => (e: { target: { value: string } }) =>
    setForm({ ...form, [key]: e.target.value });
  const regionName = query.data.regions.find((r) => r.code === form.region)?.name;

  return (
    <>
      <PageTitle
        kicker="Profile"
        title="Your profile"
        lead="What you write here is what listeners see on your artist page. Nobody else assigns your story."
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Panel>
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate(form);
            }}
          >
            <Field label="Public name" hint="Your artist or band name, as listeners will see it.">
              <Input required value={form.publicName} onChange={set("publicName")} />
            </Field>
            <Field
              label="Legal name"
              hint="Only The Pack sees this. We need it for rights and payment."
            >
              <Input
                required
                value={form.legalName}
                onChange={set("legalName")}
                autoComplete="name"
              />
            </Field>
            <Field label="Home region" hint="It lets local listeners find local artists.">
              <Select required value={form.region} onChange={set("region")}>
                <option value="">Choose a region</option>
                {query.data.regions.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Bio and story">
              <Textarea
                rows={5}
                value={form.bio}
                onChange={set("bio")}
                placeholder="Four friends, one van, and a shared love of slow songs about the tide."
              />
            </Field>
            <Field label="Links" hint="One per line: your website, Bandcamp, socials.">
              <Textarea
                rows={3}
                value={form.links}
                onChange={set("links")}
                placeholder="instagram.com/thesoutherlies"
              />
            </Field>
            {save.isError ? <Notice tone="error">{errorMessage(save.error)}</Notice> : null}
            {save.isSuccess ? (
              <Notice tone="ok">Saved. Your public page is up to date.</Notice>
            ) : null}
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save profile"}
            </Button>
          </form>
        </Panel>

        <div>
          <p className="mono-kicker mb-2 text-ink/60">What listeners see</p>
          <div className="wave-field grad-blue-magenta rounded-3xl border-2 border-ink p-6 text-paper shadow-[4px_4px_0_0_var(--ink)]">
            <h2 className="text-4xl">{form.publicName || "Your name"}</h2>
            {regionName ? <p className="mono-kicker mt-2 text-yellow">{regionName}</p> : null}
            <p className="mt-4 whitespace-pre-line text-base leading-relaxed">
              {form.bio || "Your bio and story go here."}
            </p>
            <p className="mt-6 text-xs text-paper/70">Your legal name never appears here.</p>
          </div>
        </div>
      </div>
    </>
  );
}
