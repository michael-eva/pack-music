import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer } from "@/components/site/Footer";
import {
  JoinCta,
  PackPill,
  PageHero,
  Slab,
  Stanley,
  PageShell,
  PhotoSticker,
  TornPanel,
} from "@/components/site/blocks";
import { stanleyHero } from "@/components/site/stanley";
import { T, useText } from "@/lib/site-text";
import { aboutCopy } from "@/content/copy/about";
import aboutPic from "@/assets/hp-smile.jpg.asset.json";

const FAQ = [
  { q: aboutCopy.text["about.faq1.q"], a: aboutCopy.text["about.faq1.a"] },
  { q: aboutCopy.text["about.faq2.q"], a: aboutCopy.text["about.faq2.a"] },
  { q: aboutCopy.text["about.faq3.q"], a: aboutCopy.text["about.faq3.a"] },
  { q: aboutCopy.text["about.faq4.q"], a: aboutCopy.text["about.faq4.a"] },
];

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About The Pack – a community-owned music co-operative" },
      {
        name: "description",
        content:
          "Why The Pack exists: a co-operative community built around local music, fair streaming, and one-member-one-vote ownership.",
      },
      { property: "og:title", content: "About The Pack – a community-owned music co-operative" },
      {
        property: "og:description",
        content: "The co-op, the mission, and the dog who started the argument.",
      },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: About,
});

function About() {
  const photoCaption = useText("about.photoCaption", "Members, not users");
  return (
    <PageShell tone="ember">
      <PageHero
        tk="about.hero"
        aside={
          <PhotoSticker
              src={aboutPic.url}
              alt="A listener smiling in white headphones against a pink backdrop"
              caption={photoCaption}
              variant="polaroid"
            ratio="square"
            tilt="r"
            />
        }
        gif={stanleyHero.jumping}
        gifPlain={true}
        gifShadow={null}
      />

      <Slab>
        <div className="grid gap-10 max-w-3xl">
          <TornPanel tilt="l" className="max-w-2xl space-y-5 px-8 pb-8 pt-12 text-lg leading-relaxed">
            <p>
              <T k="about.body1" />
            </p>
            <p>
              <T k="about.body2" />
            </p>
            <p>
              <T k="about.body3" />
            </p>
          </TornPanel>
        </div>
      </Slab>

      <Slab>
        <h2 className="text-4xl sm:text-5xl">
          <T k="about.faqHeading">Questions, answered</T>
        </h2>
        <dl className="mt-8 grid gap-6 md:grid-cols-2">
          {FAQ.map((f, i) => (
            <div key={f.q} className="zine grain p-6">
              <dt className="font-display text-xl uppercase">
                <T k={`about.faq${i + 1}.q`}>{f.q}</T>
              </dt>
              <dd className="mt-2 text-base leading-relaxed">
                <T k={`about.faq${i + 1}.a`}>{f.a}</T>
              </dd>
            </div>
          ))}
        </dl>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            to="/story"
            className="press inline-flex rounded-full bg-yellow px-6 py-3 text-sm font-bold uppercase tracking-widest text-ink"
          >
            <T k="about.link1">Our origin story</T>
          </Link>
          <Link
            to="/coop-model"
            className="press inline-flex rounded-full bg-cyan px-6 py-3 text-sm font-bold uppercase tracking-widest text-ink"
          >
            <T k="about.link2">The co-op model</T>
          </Link>
          <Link
            to="/board"
            className="press inline-flex rounded-full bg-magenta px-6 py-3 text-sm font-bold uppercase tracking-widest text-paper"
          >
            <T k="about.link3">Our board</T>
          </Link>
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-6">
          <JoinCta />
          <PackPill className="text-electric" />
        </div>
      </Slab>
      <Footer dark={false} />
    </PageShell>
  );
}
