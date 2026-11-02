import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer } from "@/components/site/Footer";
import { JoinCta, PackPill, PageHero, PageShell, Slab, StanleySays, TornPanel } from "@/components/site/blocks";
import { stanleyHero } from "@/components/site/stanley";
import { T } from "@/lib/site-text";

export const Route = createFileRoute("/story")({
  head: () => ({
    meta: [
      { title: "Our Origin Story – The Pack" },
      {
        name: "description",
        content:
          "Nine years in the making: two Perth musicians, thirty-plus grant rejections, one acquisition offer they turned down, and the co-operative that survived it all.",
      },
      { property: "og:title", content: "Our Origin Story – The Pack" },
      {
        property: "og:description",
        content: "Born out of frustration, built on stubbornness, and it nearly didn't make it – three times over.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/story" },
    ],
    links: [{ rel: "canonical", href: "/story" }],
  }),
  component: Story,
});

function Story() {
  return (
    <PageShell tone="sunset">
      <PageHero
        tk="story.hero"
        eyebrow="Our Story"
        title={<>Our origin story.</>}
        lead="It started with two independent musicians in Perth who'd had enough of writing good music for platforms that couldn't be bothered to notice."
        gif={stanleyHero.dancing}
        gifPlain
        gifShadow="#eff623"
      />

      <Slab className="[&>div]:pt-6">
        <TornPanel tilt="l" className="max-w-3xl space-y-5 p-8 text-lg leading-relaxed">
          <p>
            <T k="story.p1" />
          </p>
          <p>
            <T k="story.p2" />
          </p>
          <p>
            <T k="story.p3" />
          </p>
        </TornPanel>

        <StanleySays gif={stanleyHero.barking} gifPlain gifShadow="#00ffff">
          <T k="story.stanleySays" />
        </StanleySays>

        <div className="mt-14 grid gap-8 md:grid-cols-2">
          <div className="zine grain p-6">
            <h2 className="font-display text-2xl uppercase">
              <T k="story.manifesto.heading" />
            </h2>
            <p className="mt-3 text-base leading-relaxed">
              <T k="story.manifesto.body" />
            </p>
            <Link
              to="/papers"
              className="press mt-5 inline-flex rounded-full bg-yellow px-6 py-3 text-sm font-bold uppercase tracking-widest text-ink"
            >
              <T k="story.manifesto.cta" />
            </Link>
          </div>
          <div className="zine grain p-6">
            <h2 className="font-display text-2xl uppercase">
              <T k="story.coop.heading" />
            </h2>
            <p className="mt-3 text-base leading-relaxed">
              <T k="story.coop.body" />
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/coop-model"
                className="press inline-flex rounded-full bg-cyan px-6 py-3 text-sm font-bold uppercase tracking-widest text-ink"
              >
                <T k="story.coop.modelCta" />
              </Link>
              <Link
                to="/board"
                className="press inline-flex rounded-full bg-magenta px-6 py-3 text-sm font-bold uppercase tracking-widest text-paper"
              >
                <T k="story.coop.boardCta" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-6">
          <JoinCta />
          <PackPill className="text-yellow" />
        </div>
      </Slab>
      <Footer dark />
    </PageShell>
  );
}
