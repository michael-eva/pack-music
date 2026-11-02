import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer } from "@/components/site/Footer";
import { JoinCta, PackPill, PageHero, PageShell, Slab, TornPanel } from "@/components/site/blocks";
import { stanleyHero } from "@/components/site/stanley";
import { T, useText } from "@/lib/site-text";
import { listLibrary } from "@/lib/content.functions";

export const Route = createFileRoute("/papers")({
  loader: async () => ({ items: await listLibrary({ data: { kind: "paper" } }) }),
  head: () => ({
    meta: [
      { title: "Our Papers – The Pack" },
      {
        name: "description",
        content:
          "White papers and research from The Pack: the 2018 white paper, the 2026 Music from the Ground Up provocations paper, and the market and cultural impact paper.",
      },
      { property: "og:title", content: "Our Papers – The Pack" },
      {
        property: "og:description",
        content: "The research and provocations behind a musician-owned streaming co-operative.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/papers" },
    ],
    links: [{ rel: "canonical", href: "/papers" }],
  }),
  component: Papers,
});

function Papers() {
  const { items } = Route.useLoaderData();
  const readCta = useText("papers.readCta", "Read the paper →");
  return (
    <PageShell tone="deep">
      <PageHero
        tk="papers"
        eyebrow="Library / Our Papers"
        title={<>The receipts, written down.</>}
        lead="Everything we argue for, argued in full. Read the papers, quote them, send them to your local member."
        gif={stanleyHero.listening}
        gifPlain
        gifShadow="#eff623"
      />

      <Slab>
        <div className="space-y-8">
          {items.map((p, i) => (
            <TornPanel key={p.id} tilt={i % 2 ? "r" : "l"} className="max-w-3xl px-8 pb-8 pt-10">
              <p className="font-mono text-xs uppercase tracking-[0.25em]">{p.label}</p>
              <h2 className="mt-3 font-display text-2xl uppercase sm:text-3xl">{p.title}</h2>
              <p className="mt-3 text-lg leading-relaxed">{p.body}</p>
              <a
                href={p.href ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="press mt-6 inline-flex rounded-full bg-yellow px-6 py-3 text-sm font-bold uppercase tracking-widest text-ink"
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
            <T k="papers.backLink">← Back to the Library</T>
          </Link>
          <JoinCta />
          <PackPill className="text-yellow" />
        </div>
      </Slab>
      <Footer dark />
    </PageShell>
  );
}
