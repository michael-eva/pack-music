import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer } from "@/components/site/Footer";
import { JoinCta, PackPill, PageHero, PageShell, Slab, TornPanel } from "@/components/site/blocks";
import { stanleyHero } from "@/components/site/stanley";
import { T, useText } from "@/lib/site-text";
import { listLibrary } from "@/lib/content.functions";

export const Route = createFileRoute("/policies")({
  loader: async () => ({ items: await listLibrary({ data: { kind: "policy" } }) }),
  head: () => ({
    meta: [
      { title: "Our Policies – The Pack" },
      {
        name: "description",
        content:
          "The Pack's policies: anti-monopoly, data sovereignty, code of ethics, ethical AI, sustainability, cultural preservation and ethical investment.",
      },
      { property: "og:title", content: "Our Policies – The Pack" },
      {
        property: "og:description",
        content: "The frameworks that keep a musician-owned co-operative accountable.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/policies" },
    ],
    links: [{ rel: "canonical", href: "/policies" }],
  }),
  component: Policies,
});

function Policies() {
  const { items } = Route.useLoaderData();
  const readCta = useText("policies.readCta", "Read the policy →");
  return (
    <PageShell tone="deep">
      <PageHero
        tk="policies"
        eyebrow="Library / Our Policies"
        title={<>Policies you can actually read.</>}
        lead="Policies are more than documents – they keep us accountable to our co-operative principles and protect the rights that make local music vibrant."
        gif={stanleyHero.barking}
        gifPlain
        gifShadow="#eff623"
      />

      <Slab>
        <div className="grid gap-6 md:grid-cols-2">
          {items.map((p, i) => (
            <TornPanel key={p.id} tilt={i % 2 ? "r" : "l"} className="flex flex-col px-8 pb-8 pt-10">
              <h2 className="font-display text-xl uppercase sm:text-2xl">{p.title}</h2>
              <p className="mt-3 flex-1 text-base leading-relaxed">{p.body}</p>
              <a
                href={p.href ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="press mt-6 inline-flex self-start rounded-full bg-yellow px-6 py-3 text-sm font-bold uppercase tracking-widest text-ink"
              >
                {readCta}
              </a>
            </TornPanel>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-6">
          <Link
            to="/governance"
            className="press inline-flex rounded-full border-2 border-current px-6 py-3 text-sm font-bold uppercase tracking-widest"
          >
            <T k="policies.backLink">← Back to the Library</T>
          </Link>
          <JoinCta />
          <PackPill className="text-yellow" />
        </div>
      </Slab>
      <Footer dark />
    </PageShell>
  );
}
