import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer } from "@/components/site/Footer";
import { Fold, FoldStack } from "@/components/site/Accordion";
import { JoinCta, PackPill, PageHero, PageShell, Point, Slab } from "@/components/site/blocks";
import { stanleyHero } from "@/components/site/stanley";
import { T, useText } from "@/lib/site-text";

const MECHANICS = [
  "coop-model.mech1",
  "coop-model.mech2",
  "coop-model.mech3",
  "coop-model.mech4",
  "coop-model.mech5",
  "coop-model.mech6",
];

export const Route = createFileRoute("/coop-model")({
  head: () => ({
    meta: [
      { title: "The Co-op Model – why we're a co-op, not a corporation" },
      {
        name: "description",
        content:
          "The Pack is a platform co-operative: member-owned, democratically governed, one member one vote. Here's what that means for artists, listeners and the money.",
      },
      { property: "og:title", content: "Why we're a co-op, not a corporation" },
      {
        property: "og:description",
        content: "Member-owned, democratically governed, and built to serve its community rather than outside investors.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/coop-model" },
    ],
    links: [{ rel: "canonical", href: "/coop-model" }],
  }),
  component: CoopModel,
});

function CoopModel() {
  const whatSummary = useText("coop-model.what.summary", "What is a cooperative?");
  const whySummary = useText("coop-model.why.summary", "Why a platform co-op?");
  return (
    <PageShell tone="lime">
      <PageHero
        tk="coop-model.hero"
        eyebrow="The Model"
        title={<>Why we're a co-op, not a corporation.</>}
        lead="A cooperative is member-owned and democratically governed – built to serve its community rather than outside investors."
        gif={stanleyHero.howling}
        gifPlain
        gifShadow="#ff2cdf"
      />

      <Slab>
        <FoldStack className="max-w-3xl">
          <Fold summary={whatSummary} kicker="The basics" open>
            <p>
              <T k="coop-model.what.p1" />
            </p>
            <p className="mt-3">
              <T k="coop-model.what.p2" />{" "}
              <a
                href="https://ica.coop/"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4"
              >
                <T k="coop-model.what.p2Link" />
              </a>
              .
            </p>
          </Fold>
          <Fold summary={whySummary} kicker="The trade-off">
            <p>
              <T k="coop-model.why.p1" />
            </p>
            <p className="mt-3">
              <T k="coop-model.why.p2" />
            </p>
          </Fold>
        </FoldStack>

        <h2 className="mt-14 text-4xl sm:text-5xl">
          <T k="coop-model.mechanicsHeading" />
        </h2>
        <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {MECHANICS.map((k, i) => (
            <Point key={k} tk={k} kicker="" title="" body="" tilt={i % 2 ? "r" : "l"} />
          ))}
        </div>

        <div className="mt-14 flex flex-wrap items-center gap-4">
          <JoinCta />
          <Link
            to="/board"
            className="press inline-flex rounded-full bg-magenta px-6 py-3 text-sm font-bold uppercase tracking-widest text-paper"
          >
            <T k="coop-model.boardCta" />
          </Link>
          <Link
            to="/policies"
            className="press inline-flex rounded-full bg-electric px-6 py-3 text-sm font-bold uppercase tracking-widest text-paper"
          >
            <T k="coop-model.rulesCta" />
          </Link>
          <PackPill className="text-magenta" />
        </div>
      </Slab>
      <Footer dark={false} />
    </PageShell>
  );
}
