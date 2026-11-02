import { createFileRoute } from "@tanstack/react-router";
import { Footer } from "@/components/site/Footer";
import { JoinCta, PackPill, PageHero, Point, Slab, PageShell, PhotoSticker } from "@/components/site/blocks";
import { stanleyHero } from "@/components/site/stanley";
import { useText } from "@/lib/site-text";
import listenerPic from "@/assets/hp-phone.jpg.asset.json";

export const Route = createFileRoute("/listeners")({
  head: () => ({
    meta: [
      { title: "For listeners – hear the sounds of your home | The Pack" },
      {
        name: "description",
        content:
          "Human-curated playlists, local discovery that knows your suburb, and a subscription that lands with the artists you actually play.",
      },
      { property: "og:title", content: "For listeners – hear the sounds of your home | The Pack" },
      {
        property: "og:description",
        content: "Human curation, geo-fenced local discovery, and fan rewards that reach artists.",
      },
      { property: "og:url", content: "/listeners" },
    ],
    links: [{ rel: "canonical", href: "/listeners" }],
  }),
  component: Listeners,
});

function Listeners() {
  const photoCaption = useText("listeners.photoCaption", "Friday night, three suburbs over");
  const cta = useText("listeners.cta", "Join as a listener");
  return (
    <PageShell tone="magenta">
      <PageHero
        tk="listeners.hero"
        aside={
          <PhotoSticker
            src={listenerPic.url}
            alt="A listener dancing with her phone and headphones against a purple backdrop"
            variant="polaroid"
            ratio="square"
            caption={photoCaption}
            tilt="r"
          />
        }
        gif={stanleyHero.listening}
        gifPlain
        gifShadow="#00ffff"
      />

      <Slab>

        <div className="grid gap-6 md:grid-cols-3">
          <Point tk="listeners.card1" />
          <Point tk="listeners.card2" />
          <Point tk="listeners.card3" />
        </div>
        <div className="mt-10 flex flex-wrap items-center gap-6">
          <JoinCta label={cta} />
          <PackPill className="text-electric" />
        </div>
      </Slab>
      <Footer dark={false} />
    </PageShell>
  );
}
