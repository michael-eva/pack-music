import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer } from "@/components/site/Footer";
import {
  JoinCta,
  PackPill,
  PageShell,
  PhotoSticker,
  Point,
  Slab,
} from "@/components/site/blocks";
import { PackLogo } from "@/components/site/PackLogo";
import { T, useText } from "@/lib/site-text";

import solo from "@/assets/hp-solo.jpg.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Pack – A community-owned music co-operative" },
      {
        name: "description",
        content:
          "A musician-owned co-operative building thriving local music ecosystems. 70% of every subscription goes straight to the artists you play.",
      },
      { property: "og:title", content: "The Pack – A community-owned music co-operative" },
      {
        property: "og:description",
        content:
          "A co-operative home for local music. 70c of every dollar walks home to the artist you actually played, wherever The Pack calls home.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

function Home() {
  const photoCaption = useText("home.photoCaption", "Playing: someone from your postcode");
  const closingCta = useText("home.closingCta", "Join the waitlist");
  return (
    <PageShell tone="electric">
      <section>
        <div className="page-wrap grid gap-10 px-5 pb-10 pt-12 sm:pb-12 sm:pt-16 lg:grid-cols-[1.15fr_1fr] lg:items-center">
          <div>
            <div>
              <span className="stamp mono-kicker inline-block px-3 py-1.5 text-yellow">
                <T k="home.kicker">A community-owned music co-operative</T>
              </span>
            </div>
            <div className="mt-6">
              <PackLogo variant="full" className="block h-20 text-paper sm:h-24" />
            </div>
            <h1 className="mt-5 text-5xl leading-[1.05] sm:text-7xl xl:text-8xl">
              <T k="home.title">Streaming that puts</T>
              <br />
              <span className="text-yellow">
                <T k="home.titleHighlight">musicians first.</T>
              </span>
              <br />
              <T k="home.titleEnd">Finally.</T>
            </h1>
            <p className="mt-5 max-w-xl text-lg sm:text-xl xl:max-w-2xl xl:text-2xl">
              <T k="home.lead" />
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <JoinCta />
              <Link
                to="/artists"
                className="font-mono text-sm uppercase tracking-widest underline underline-offset-4 hover:text-yellow"
              >
                <T k="home.artistLink">I'm an artist</T>
              </Link>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-xs justify-self-center sm:max-w-sm lg:max-w-md">
            <PhotoSticker
              src={solo.url}
              alt="A listener smiling in white over-ear headphones against a warm pink backdrop"
              variant="cutout"
              ratio="portrait"
              caption={photoCaption}
            />
          </div>
        </div>
      </section>

      <Slab>
        <h2 className="text-4xl sm:text-5xl xl:text-6xl">
          <T k="home.worksHeading">How the community works</T>
        </h2>
        <div className="mt-8 grid gap-8 md:grid-cols-3">
          <Point tk="home.card1" tilt="l" />
          <Point tk="home.card2" tilt="r" />
          <Point tk="home.card3" tilt="l" />
        </div>

        <h2 className="mt-16 text-4xl sm:text-5xl xl:text-6xl">
          <T k="home.whoHeading">Who makes the community</T>
        </h2>

        <ul className="mt-8 grid gap-8 md:grid-cols-3">
          {[
            { to: "/artists", k: "home.who1" },
            { to: "/listeners", k: "home.who2" },
            { to: "/partners", k: "home.who3" },
          ].map((row, i) => (
            <li key={row.to}>
              <Link
                to={row.to}
                className={`zine grain press relative block p-7 pt-9 ${i % 2 ? "zine-b tilt-r" : "tilt-l"}`}
              >
                <span
                  aria-hidden
                  className={`tape-strip absolute -top-3 z-10 h-7 w-28 ${i % 2 ? "right-7 rotate-6" : "left-7 -rotate-5"}`}
                />
                <span className="block font-display text-2xl font-bold uppercase leading-[1.05] tracking-[-0.01em]">
                  <T k={`${row.k}.label`} />
                </span>
                <span className="mt-3 block text-base leading-relaxed">
                  <T k={`${row.k}.note`} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Slab>

      <Slab>
        <div className="flex flex-wrap items-end justify-between gap-8">
          <h2 className="max-w-2xl text-4xl sm:text-6xl xl:max-w-3xl xl:text-7xl">
            <T k="home.closingHeading">Help build a community that backs its musicians.</T>
          </h2>
          <div className="flex flex-col items-start gap-5">
            <JoinCta label={closingCta} />
            <PackPill className="text-yellow" />
          </div>
        </div>
      </Slab>
      <Footer dark />
    </PageShell>
  );
}
