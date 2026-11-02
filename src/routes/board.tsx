import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer } from "@/components/site/Footer";
import { Fold, FoldStack } from "@/components/site/Accordion";
import { JoinCta, PackPill, PageHero, PageShell, Slab, TornPanel } from "@/components/site/blocks";
import { stanleyHero } from "@/components/site/stanley";
import { listBoard } from "@/lib/content.functions";
import { T } from "@/lib/site-text";

export const Route = createFileRoute("/board")({
  loader: async () => ({ members: await listBoard() }),
  head: () => ({
    meta: [
      { title: "Our Board – The Pack" },
      {
        name: "description",
        content:
          "The Pack is governed by a twelve-member Board of Directors: musicians, arts professionals, technologists and community advocates, elected and informed by our members.",
      },
      { property: "og:title", content: "Our Board – The Pack" },
      {
        property: "og:description",
        content: "Meet the twelve directors governing Australia's musician-owned streaming co-operative.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/board" },
    ],
    links: [{ rel: "canonical", href: "/board" }],
  }),
  component: BoardPage,
});

function BoardPage() {
  const { members } = Route.useLoaderData();
  return (
    <PageShell tone="deep">
      <PageHero
        tk="board.hero"
        eyebrow="Governance"
        title={<>Our board.</>}
        lead="Twelve directors. Musicians, arts professionals, technologists and community advocates. Every major decision comes through them – and our members inform them. That's how a co-operative works."
        gif={stanleyHero.listening}
        gifPlain
        gifShadow="#00ffff"
      />

      <Slab>
        <FoldStack>
          {members.map((m, i) => (
            <Fold
              key={m.id}
              kicker={m.role}
              summary={m.name}
              sub={m.blurb}
              open={i === 0}
              media={
                <span className="grain torn-disc block h-28 w-28 shrink-0 self-start rounded-full p-2 sm:h-36 sm:w-36">
                  {m.photo_url ? (
                    <img
                      src={m.photo_url}
                      alt={`${m.name}, ${m.role}`}
                      loading="lazy"
                      style={{ objectPosition: m.photo_position || "50% 25%" }}
                      className="xerox-photo h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="grid h-full w-full place-items-center rounded-full border-2 border-dashed border-ink/25 font-display text-3xl uppercase text-ink/60">
                      {m.name.slice(0, 1)}
                    </span>
                  )}
                </span>
              }
            >
              <p>{m.bio}</p>
            </Fold>
          ))}
        </FoldStack>


        <TornPanel tilt="r" className="mt-14 max-w-3xl px-10 pb-10 pt-11 sm:px-12">
          <h2 className="font-display text-2xl uppercase">
            <T k="board.say.heading">Want a say in who sits here?</T>
          </h2>
          <p className="mt-3 text-lg leading-relaxed">
            <T k="board.say.body">
              Member Directors are elected by the membership – one member, one vote. Join the co-op and
              you get a voice in how The Pack is run, not just a subscription.
            </T>
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <JoinCta />
            <Link
              to="/coop-model"
              className="press inline-flex rounded-full bg-cyan px-6 py-3 text-sm font-bold uppercase tracking-widest text-ink"
            >
              <T k="board.say.cta">How the co-op works</T>
            </Link>
          </div>
        </TornPanel>

        <div className="mt-12">
          <PackPill className="text-cyan" />
        </div>
      </Slab>
      <Footer dark />
    </PageShell>
  );
}
