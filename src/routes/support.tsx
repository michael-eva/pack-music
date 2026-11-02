import { createFileRoute } from "@tanstack/react-router";
import { Footer } from "@/components/site/Footer";
import { JoinCta, PackPill, PageHero, PageShell, Slab, TornPanel } from "@/components/site/blocks";
import { stanleyHero } from "@/components/site/stanley";
import { T } from "@/lib/site-text";

const CAMPAIGN_URL = "https://crowdfunding.startsomegood.com/thepackmusiccoop";

const SPEND = ["support.spend1", "support.spend2", "support.spend3"];

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support the campaign – The Pack" },
      {
        name: "description",
        content:
          "The prototype is built. Our StartSomeGood campaign has a $45,000 target to finish the tech, onboard artists and launch. Every dollar is a vote for a different music industry.",
      },
      { property: "og:title", content: "Support the campaign – The Pack" },
      {
        property: "og:description",
        content:
          "Help fund the final build, artist onboarding and launch of Australia's musician-owned streaming co-operative.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/support" },
    ],
    links: [{ rel: "canonical", href: "/support" }],
  }),
  component: Support,
});

function Support() {
  return (
    <PageShell tone="ember">
      <PageHero
        tk="support.hero"
        eyebrow="Fundraising"
        title={<>Support the campaign.</>}
        lead="The prototype is built. The vision is clear. What stands between us and launch is funding – for final tech development, artist onboarding and community outreach."
        gif={stanleyHero.dancing}
        gifPlain
        gifShadow="#00ffff"
      />

      <Slab>
        <h2 className="text-4xl sm:text-5xl">
          <T k="support.spendHeading" />
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {SPEND.map((k) => (
            <div key={k} className="zine grain p-6">
              <h3 className="font-display text-xl uppercase">
                <T k={`${k}.title`} />
              </h3>
              <p className="mt-2 text-base leading-relaxed">
                <T k={`${k}.body`} />
              </p>
            </div>
          ))}
        </div>

        <TornPanel tilt="l" className="mt-12 max-w-3xl px-8 pb-8 pt-10">
          <p className="font-mono text-xs uppercase tracking-[0.25em]">
            <T k="support.campaign.label" />
          </p>
          <h3 className="mt-3 font-display text-3xl uppercase">
            <T k="support.campaign.heading" />
          </h3>
          <p className="mt-3 text-lg leading-relaxed">
            <T k="support.campaign.body" />
          </p>
          <a
            href={CAMPAIGN_URL}
            target="_blank"
            rel="noreferrer"
            className="press mt-6 inline-flex rounded-full bg-yellow px-6 py-3 text-sm font-bold uppercase tracking-widest text-ink"
          >
            <T k="support.campaign.cta" />
          </a>
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
