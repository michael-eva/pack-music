import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer } from "@/components/site/Footer";
import { Fold, FoldStack } from "@/components/site/Accordion";
import { JoinCta, PackPill, PageHero, PageShell, Slab } from "@/components/site/blocks";
import { stanleyHero } from "@/components/site/stanley";
import { paragraphs } from "@/lib/content-format";
import { listLibrary } from "@/lib/content.functions";
import { T } from "@/lib/site-text";

type FaqItem = { id: string; title: string; body: string };
type FaqGroup = { group: string; items: FaqItem[] };

function groupFaqs(rows: { id: string; title: string; label: string; body: string }[]): FaqGroup[] {
  const groups: FaqGroup[] = [];
  for (const row of rows) {
    const name = row.label || "General";
    let g = groups.find((x) => x.group === name);
    if (!g) {
      g = { group: name, items: [] };
      groups.push(g);
    }
    g.items.push({ id: row.id, title: row.title, body: row.body });
  }
  return groups;
}

export const Route = createFileRoute("/faqs")({
  loader: async () => ({ groups: groupFaqs(await listLibrary({ data: { kind: "faq" } })) }),
  head: ({ loaderData }) => ({
    meta: [
      { title: "FAQs – The Pack" },
      {
        name: "description",
        content:
          "How The Pack works: payouts, geo-fencing, membership costs, licensing, rewards, local government patronage and the co-operative model – answered plainly.",
      },
      { property: "og:title", content: "FAQs – The Pack" },
      {
        property: "og:description",
        content: "Everything people ask us about a musician-owned streaming co-operative.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/faqs" },
    ],
    links: [{ rel: "canonical", href: "/faqs" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: (loaderData?.groups ?? []).flatMap((g) =>
            g.items.map((f) => ({
              "@type": "Question",
              name: f.title,
              acceptedAnswer: { "@type": "Answer", text: f.body },
            })),
          ),
        }),
      },
    ],
  }),
  component: Faqs,
});

function Faqs() {
  const { groups } = Route.useLoaderData();
  return (
    <PageShell tone="deep">
      <PageHero
        tk="faqs"
        eyebrow="Library / FAQs"
        title={<>Want to dig into the detail?</>}
        lead="The questions we get asked most, answered without the corporate fog. Still stuck? Email us and a human writes back."
        gif={stanleyHero.tailwag}
        gifPlain
        gifShadow="#eff623"
      />

      {groups.map((group, gi) => (
        <Slab key={group.group}>
          <h2 className="text-4xl sm:text-5xl">{group.group}</h2>
          <FoldStack className="mt-8 max-w-3xl">
            {group.items.map((f, i) => (
              <Fold key={f.id} summary={f.title} open={gi === 0 && i === 0}>
                {paragraphs(f.body).map((para) => (
                  <p key={para} className="mt-3 first:mt-0">
                    {para}
                  </p>
                ))}
              </Fold>
            ))}
          </FoldStack>
        </Slab>
      ))}

      <Slab>
        <div className="flex flex-wrap items-center gap-6">
          <Link
            to="/governance"
            className="press inline-flex rounded-full border-2 border-current px-6 py-3 text-sm font-bold uppercase tracking-widest"
          >
            <T k="faqs.backLink">← Back to the Library</T>
          </Link>
          <JoinCta />
          <PackPill className="text-yellow" />
        </div>
      </Slab>
      <Footer dark />
    </PageShell>
  );
}
