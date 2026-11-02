import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer } from "@/components/site/Footer";
import { JoinCta, PackPill, PageHero, PageShell, Slab, TornPanel } from "@/components/site/blocks";
import { stanleyHero } from "@/components/site/stanley";
import { T } from "@/lib/site-text";

const DO = ["ambassador.do1", "ambassador.do2", "ambassador.do3", "ambassador.do4"];

const GET = ["ambassador.get1", "ambassador.get2", "ambassador.get3"];

export const Route = createFileRoute("/ambassador")({
  head: () => ({
    meta: [
      { title: "Become an Ambassador – The Pack" },
      {
        name: "description",
        content:
          "Got a platform, a community or just a loud voice and a real commitment to independent music? Become a Pack Ambassador and put your name behind a musician-owned streaming co-op.",
      },
      { property: "og:title", content: "Become an Ambassador – The Pack" },
      {
        property: "og:description",
        content:
          "Musicians, educators, advocates, journalists and community leaders – help us build something better.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/ambassador" },
    ],
    links: [{ rel: "canonical", href: "/ambassador" }],
  }),
  component: Ambassador,
});

function Ambassador() {
  return (
    <PageShell tone="magenta">
      <PageHero
        tk="ambassador.hero"
        eyebrow="Ambassadors"
        title={<>Become an ambassador.</>}
        lead="If you've got a platform, a community, or just a loud voice and a real commitment to independent music, we want to talk to you."
        gif={stanleyHero.barking}
        gifPlain
        gifShadow="#eff623"
      />

      <Slab>
        <TornPanel tilt="l" className="max-w-3xl px-8 pb-8 pt-10">
          <p className="text-lg leading-relaxed">
            <T k="ambassador.intro" />
          </p>
        </TornPanel>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <div className="zine grain p-6">
            <h2 className="font-display text-2xl uppercase">
              <T k="ambassador.doHeading" />
            </h2>
            <ul className="mt-4 space-y-3 text-base leading-relaxed">
              {DO.map((k) => (
                <li key={k}>
                  <T k={k} />
                </li>
              ))}
            </ul>
          </div>
          <div className="zine grain p-6">
            <h2 className="font-display text-2xl uppercase">
              <T k="ambassador.getHeading" />
            </h2>
            <ul className="mt-4 space-y-3 text-base leading-relaxed">
              {GET.map((k) => (
                <li key={k}>
                  <T k={k} />
                </li>
              ))}
            </ul>
          </div>
        </div>

        <TornPanel tilt="r" className="mt-12 max-w-3xl px-8 pb-8 pt-10">
          <h2 className="font-display text-2xl uppercase">
            <T k="ambassador.who.heading" />
          </h2>
          <p className="mt-3 text-lg leading-relaxed">
            <T k="ambassador.who.body" />
          </p>
          <Link
            to="/join"
            className="press mt-6 inline-flex rounded-full bg-yellow px-6 py-3 text-sm font-bold uppercase tracking-widest text-ink"
          >
            <T k="ambassador.who.cta" />
          </Link>
        </TornPanel>

        <div className="mt-12 flex flex-wrap items-center gap-6">
          <JoinCta />
          <PackPill className="text-yellow" />
        </div>
      </Slab>
      <Footer dark />
    </PageShell>
  );
}
