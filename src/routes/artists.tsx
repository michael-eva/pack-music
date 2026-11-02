import { createFileRoute } from "@tanstack/react-router";
import { Footer } from "@/components/site/Footer";
import { JoinCta, PackPill, PageHero, Point, Slab, PageShell, PhotoSticker } from "@/components/site/blocks";
import { stanleyHero } from "@/components/site/stanley";
import { useText } from "@/lib/site-text";
import artistPic from "@/assets/hp-dance-pink.jpg.asset.json";

export const Route = createFileRoute("/artists")({
  head: () => ({
    meta: [
      { title: "For artists – keep your music, keep 70% | The Pack" },
      {
        name: "description",
        content:
          "Upload free, keep full ownership, and earn 70% from the people who actually listen to you – plus a vote in how The Pack is run.",
      },
      { property: "og:title", content: "For artists – keep your music, keep 70% | The Pack" },
      {
        property: "og:description",
        content: "Free uploads, full ownership, 70% of listener revenue, and a real vote.",
      },
      { property: "og:url", content: "/artists" },
    ],
    links: [{ rel: "canonical", href: "/artists" }],
  }),
  component: Artists,
});

function Artists() {
  const photoCaption = useText("artists.photoCaption", "Upload free. Keep everything.");
  const cta = useText("artists.cta", "Register as an artist");
  return (
    <PageShell tone="sunset">
      <PageHero
        tk="artists.hero"
        aside={
          <PhotoSticker
            src={artistPic.url}
            alt="An artist dancing with headphones against a bright blue backdrop"
            variant="polaroid"
            ratio="square"
            caption={photoCaption}
            tilt="l"
          />
        }
        gif={stanleyHero.tailwag}
        gifPlain
        gifShadow="#eff623"
      />

      <Slab>

        <div className="grid gap-6 md:grid-cols-2">
          <Point tk="artists.card1" />
          <Point tk="artists.card2" />
          <Point tk="artists.card3" />
          <Point tk="artists.card4" />
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-6">
          <JoinCta label={cta} />
          <PackPill className="text-electric" />
        </div>
      </Slab>
      <Footer dark />
    </PageShell>
  );
}
