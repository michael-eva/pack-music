import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer } from "@/components/site/Footer";
import { Fold, FoldStack } from "@/components/site/Accordion";
import { JoinCta, PackPill, PageHero, PageShell, Slab, TornPanel } from "@/components/site/blocks";
import { stanleyHero } from "@/components/site/stanley";
import { T, useText } from "@/lib/site-text";

const PROSPECTUS =
  "https://www.packmusic.au/s/The_Pack_Partnership_Prospectus_2025.pdf";
const CAMPAIGN_URL = "https://crowdfunding.startsomegood.com/thepackmusiccoop";

const WHY = ["patron.why1","patron.why2","patron.why3","patron.why4","patron.why5","patron.why6"];

const TIERS = ["patron.tier1","patron.tier2","patron.tier3","patron.tier4","patron.tier5","patron.tier6"];

export const Route = createFileRoute("/patron")({
  head: () => ({
    meta: [
      { title: "Become a Patron – The Pack" },
      {
        name: "description",
        content:
          "Patronage tiers for organisations of every size, from $5,000 community patrons to a $100,000 Alpha Patron – plus in-kind and custom partnerships with Australia's musician-owned streaming co-operative.",
      },
      { property: "og:title", content: "Become a Patron – The Pack" },
      {
        property: "og:description",
        content:
          "Because music streaming should build careers, not just line the pockets of people who've never heard the songs.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/patron" },
    ],
    links: [{ rel: "canonical", href: "/patron" }],
  }),
  component: Patron,
});

function Patron() {
  return (
    <PageShell tone="sunset">
      <PageHero
        tk="patron.hero"
        eyebrow="Patrons"
        title={<>Become a patron.</>}
        lead="Because music streaming should build careers, not just line the pockets of people who've never heard the songs."
        gif={stanleyHero.tailwag}
        gifPlain
        gifShadow="#ff2cdf"
      />

      <Slab>
        <TornPanel tilt="l" className="max-w-3xl px-8 pb-8 pt-10">
          <p className="text-lg leading-relaxed">
            <T k="patron.intro1" />
          </p>
          <p className="mt-4 text-lg leading-relaxed">
            <T k="patron.intro2" />
          </p>
        </TornPanel>

        <h2 className="mt-14 text-4xl sm:text-5xl">
          <T k="patron.whyHeading" />
        </h2>
        <ul className="mt-8 grid gap-8 md:grid-cols-2">
          {WHY.map((k) => (
            <li key={k} className="zine grain p-5 text-base leading-relaxed">
              <T k={k} />
            </li>
          ))}
        </ul>
      </Slab>

      <Slab>
        <h2 className="text-4xl sm:text-5xl">
          <T k="patron.tiersHeading" />
        </h2>
        <FoldStack className="mt-8 max-w-3xl">
          {TIERS.map((k, i) => (
            <Tier key={k} k={k} open={i === 0} />
          ))}
        </FoldStack>

        <div className="mt-10 flex flex-wrap gap-4">
          <a
            href={PROSPECTUS}
            className="press inline-flex rounded-full bg-yellow px-6 py-3 text-sm font-bold uppercase tracking-widest text-ink"
          >
            <T k="patron.prospectusCta" />
          </a>
          <a
            href={CAMPAIGN_URL}
            target="_blank"
            rel="noreferrer"
            className="press inline-flex rounded-full bg-paper px-6 py-3 text-sm font-bold uppercase tracking-widest text-ink"
          >
            <T k="patron.crowdfundingCta" />
          </a>
        </div>
      </Slab>

      <Slab>
        <h2 className="text-4xl sm:text-5xl">
          <T k="patron.conversationHeading" />
        </h2>
        <TornPanel tilt="l" className="mt-8 max-w-3xl px-8 pb-8 pt-10">
          <p className="text-lg leading-relaxed">
            <T k="patron.conversationBody" />
          </p>
          <div className="mt-6 space-y-2 text-lg">
            <p>
              Email:{" "}
              <a className="underline underline-offset-4" href="mailto:director@packmusic.au">
                director@packmusic.au
              </a>
            </p>
            <p>
              Phone:{" "}
              <a className="underline underline-offset-4" href="tel:+61488222286">
                0488 222 286
              </a>
            </p>
          </div>
          <Link
            to="/join"
            className="press mt-6 inline-flex rounded-full bg-yellow px-6 py-3 text-sm font-bold uppercase tracking-widest text-ink"
          >
            <T k="patron.conversationCta" />
          </Link>
          <p className="mt-6 text-sm leading-relaxed">
            <T k="patron.dgrNote" />
          </p>
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

function Tier({ k, open }: { k: string; open: boolean }) {
  return (
    <Fold kicker={useText(`${k}.price`, "")} summary={useText(`${k}.title`, "")} open={open}>
      <p>
        <T k={`${k}.body`} />
      </p>
    </Fold>
  );
}
