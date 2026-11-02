import { createFileRoute } from "@tanstack/react-router";
import { Footer } from "@/components/site/Footer";
import { JoinCta, PackPill, PageHero, Point, Slab, PageShell, PhotoSticker } from "@/components/site/blocks";
import { stanleyHero } from "@/components/site/stanley";
import venuePic from "@/assets/hp-boombox.jpg.asset.json";
import { T, useText } from "@/lib/site-text";

export const Route = createFileRoute("/partners")({
  head: () => ({
    meta: [
      { title: "For businesses & local government | The Pack" },
      {
        name: "description",
        content:
          "Play your neighbourhood's artists in-venue, or fund a measurable per-capita patronage model for your local music economy.",
      },
      { property: "og:title", content: "For businesses & local government | The Pack" },
      {
        property: "og:description",
        content:
          "In-venue local music and a place-activation model built for measurable outcomes.",
      },
      { property: "og:url", content: "/partners" },
    ],
    links: [{ rel: "canonical", href: "/partners" }],
  }),
  component: Partners,
});

function Partners() {
  const photoCaption = useText("partners.photoCaption", "The local, on a good night");
  const cta = useText("partners.cta", "Start a conversation");
  const govItems = [
    { k: "partners.gov1", t: "Spend that stays home", b: "Every dollar is mapped to artists inside your LGA, not averaged across a national pool." },
    { k: "partners.gov2", t: "Reporting you can table", b: "Artists paid, plays counted, venues activated – quarterly figures your council can publish." },
    { k: "partners.gov3", t: "A visible funding gap, closed", b: "WA sits near 23c per person on arts against roughly $2 in NSW. This is a direct, trackable way to move that number." },
  ];
  return (
    <PageShell tone="lime">
      <PageHero
        tk="partners.hero"
        aside={
          <PhotoSticker
            src={venuePic.url}
            alt="A regular at a local venue dancing with a boombox and headphones"
            variant="polaroid"
            ratio="square"
            caption={photoCaption}
            tilt="l"
          />
        }
        gif={stanleyHero.barking}
        gifPlain
        gifShadow="#ff005b"
      />

      <Slab>

        <h2 className="text-4xl text-electric sm:text-5xl">
          <T k="partners.businessHeading">For businesses</T>
        </h2>
        <div className="mt-8 grid items-start gap-8 md:grid-cols-2">
          <Point tk="partners.point1" />
          <Point tk="partners.point2" />
        </div>
      </Slab>

      <Slab>
        <h2 className="text-4xl text-ink sm:text-5xl">
          <T k="partners.govHeading">For local government</T>
        </h2>
        <p className="mt-6 max-w-2xl text-lg text-ink">
          <T k="partners.govLead" />
        </p>
        <ul className="mt-8 grid gap-8 sm:grid-cols-3">
          {govItems.map((item) => (
            <li key={item.k} className="zine grain px-5 py-5 text-ink">
              <h3 className="font-display text-lg uppercase leading-snug">
                <T k={`${item.k}.title`}>{item.t}</T>
              </h3>
              <p className="mt-2 text-base leading-relaxed">
                <T k={`${item.k}.body`}>{item.b}</T>
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-wrap items-center gap-6">
          <JoinCta label={cta} />
          <PackPill className="text-ink" />
        </div>
      </Slab>
      <Footer dark={false} />
    </PageShell>
  );
}
