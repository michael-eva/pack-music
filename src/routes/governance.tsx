import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer } from "@/components/site/Footer";
import { JoinCta, PackPill, PageHero, PageShell, Slab, TornPanel } from "@/components/site/blocks";
import { stanleyHero } from "@/components/site/stanley";
import { T } from "@/lib/site-text";

const SECTIONS = [
  {
    key: "library.section1",
    t: "Our Papers",
    d: "The white paper that started it, the 2026 provocations agenda, and the market and cultural impact research.",
    to: "/papers",
    cta: "Read the papers",
  },
  {
    key: "library.section2",
    t: "Our Policies",
    d: "Anti-monopoly, data sovereignty, ethics, ethical AI, sustainability, cultural preservation and ethical investment.",
    to: "/policies",
    cta: "Read the policies",
  },
  {
    key: "library.section3",
    t: "FAQs",
    d: "Payouts, geo-fencing, membership costs, licensing, rewards and the co-op model – answered plainly.",
    to: "/faqs",
    cta: "Read the FAQs",
  },
] as const;

const PRINCIPLES = [
  {
    key: "library.principle1",
    t: "One member, one vote",
    d: "Every member carries equal weight regardless of streams, catalogue size or how long they've been here.",
  },
  {
    key: "library.principle2",
    t: "No outside shareholders",
    d: "The Pack is member-owned. There is no external equity, and no exit anyone is working towards.",
  },
  {
    key: "library.principle3",
    t: "Open books",
    d: "Members receive an annual plain-language statement of income, costs and the payout split.",
  },
  {
    key: "library.principle4",
    t: "Changes go to a vote",
    d: "The revenue split and other material rules can only change by member resolution at a general meeting.",
  },
];

const POLICIES = [
  {
    key: "library.policy1",
    t: "Revenue and payouts",
    d: "70% of each subscription is allocated by what that member actually played and paid to those artists. The remaining 30% funds operations, curation and reinvestment. Payments are made monthly, with a statement of streams and amounts.",
  },
  {
    key: "library.policy2",
    t: "Membership and eligibility",
    d: "Artist membership is open to Australian-based musicians and rights holders who can evidence ownership or licence of the works they upload. Listener membership is open to anyone with a subscription. Membership can be ended by the member at any time.",
  },
  {
    key: "library.policy3",
    t: "Privacy and member data",
    d: "We collect the minimum needed to run the service: account details, payment information and listening history used to calculate payouts and local recommendations. We do not sell member data or share it for advertising.",
  },
  {
    key: "library.policy4",
    t: "Curation and editorial",
    d: "Curators are paid, credited and drawn from the scenes they cover. Placement is never sold. Curators declare conflicts of interest and step back from decisions involving artists they represent.",
  },
  {
    key: "library.policy5",
    t: "Content and conduct",
    d: "Uploads must be works the member owns or is licensed to distribute. Hateful, harassing or infringing content is removed. Members can appeal any removal to the board, which responds in writing.",
  },
  {
    key: "library.policy6",
    t: "Complaints and disputes",
    d: "Complaints go to the board in writing and receive a response within 30 days. Unresolved disputes are referred to independent mediation before any further step.",
  },
];

export const Route = createFileRoute("/governance")({
  head: () => ({
    meta: [
      { title: "Library – The Pack" },
      {
        name: "description",
        content:
          "How The Pack is governed: one member one vote, no outside shareholders, and the policies covering payouts, membership, privacy, curation and disputes.",
      },
      { property: "og:title", content: "Library – The Pack" },
      {
        property: "og:description",
        content: "The rules of a musician-owned co-operative, written in plain language.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/governance" },
    ],
    links: [{ rel: "canonical", href: "/governance" }],
  }),
  component: Governance,
});

function Governance() {
  return (
    <PageShell tone="deep">
      <PageHero
        tk="library"
        eyebrow="Library"
        title={<>The rules, in plain language.</>}
        lead="A co-operative only works if everybody can read how it works. So here it is, without the legal fog."
        gif={stanleyHero.barking}
        gifPlain
        gifShadow="#eff623"
      />

      <Slab>
        <h2 className="text-4xl sm:text-5xl">
          <T k="library.inLibraryHeading">In the Library</T>
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {SECTIONS.map((s, i) => (
            <TornPanel key={s.to} tilt={i % 2 ? "r" : "l"} className="flex flex-col px-8 pb-8 pt-10">
              <h3 className="font-display text-2xl uppercase">
                <T k={`${s.key}.title`}>{s.t}</T>
              </h3>
              <p className="mt-3 flex-1 text-base leading-relaxed">
                <T k={`${s.key}.body`}>{s.d}</T>
              </p>
              <Link
                to={s.to}
                className="press mt-6 inline-flex self-start rounded-full bg-yellow px-6 py-3 text-sm font-bold uppercase tracking-widest text-ink"
              >
                <T k={`${s.key}.cta`}>{s.cta}</T>
              </Link>
            </TornPanel>
          ))}
        </div>
      </Slab>

      <Slab>
        <h2 className="text-4xl sm:text-5xl">
          <T k="library.governedHeading">How we're governed</T>
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {PRINCIPLES.map((p) => (
            <div key={p.t} className="zine grain p-6">
              <h3 className="font-display text-xl uppercase">
                <T k={`${p.key}.title`}>{p.t}</T>
              </h3>
              <p className="mt-2 text-base leading-relaxed">
                <T k={`${p.key}.body`}>{p.d}</T>
              </p>
            </div>
          ))}
        </div>
      </Slab>

      <Slab>
        <h2 className="text-4xl sm:text-5xl">
          <T k="library.policiesHeading">Our policies</T>
        </h2>
        <div className="mt-8 space-y-6">
          {POLICIES.map((p, i) => (
            <TornPanel
              key={p.t}
              tilt={i % 2 ? "r" : "l"}
              className="max-w-3xl px-8 pb-8 pt-10"
            >
              <h3 className="font-display text-2xl uppercase">
                <T k={`${p.key}.title`}>{p.t}</T>
              </h3>
              <p className="mt-3 text-lg leading-relaxed">
                <T k={`${p.key}.body`}>{p.d}</T>
              </p>
            </TornPanel>
          ))}
        </div>

        <TornPanel tilt="l" className="mt-12 max-w-3xl px-8 pb-8 pt-10">
          <h3 className="font-display text-2xl uppercase">
            <T k="library.askHeading">Ask us anything</T>
          </h3>
          <p className="mt-3 text-lg leading-relaxed">
            <T k="library.askBody">
              Want the full rules of the co-operative, or a copy of the latest annual statement?
              Email the board and we'll send it through.
            </T>
          </p>
          <a
            href="mailto:hello@packmusic.au"
            className="press mt-6 inline-flex rounded-full bg-yellow px-6 py-3 text-sm font-bold uppercase tracking-widest text-ink"
          >
            hello@packmusic.au
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
