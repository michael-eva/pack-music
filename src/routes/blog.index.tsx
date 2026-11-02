import { createFileRoute, Link } from "@tanstack/react-router";
import { CoverSlot } from "@/components/site/CoverSlot";
import { Footer } from "@/components/site/Footer";
import { JoinCta, PackPill, PageHero, PageShell, Slab } from "@/components/site/blocks";
import { stanleyHero } from "@/components/site/stanley";
import { dateLabel } from "@/lib/content-format";
import { listPosts } from "@/lib/content.functions";
import { T, useText } from "@/lib/site-text";


export const Route = createFileRoute("/blog/")({
  loader: async () => ({ posts: await listPosts() }),
  head: () => ({
    meta: [
      { title: "Blog – notes from The Pack" },
      {
        name: "description",
        content:
          "Writing from Australia's musician-owned streaming co-operative: how the payouts work, why we're a co-op, and what's happening in local scenes.",
      },
      { property: "og:title", content: "Blog – notes from The Pack" },
      {
        property: "og:description",
        content: "Co-op thinking, payout maths and local scene notes from The Pack.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/blog" },
    ],
    links: [{ rel: "canonical", href: "/blog" }],
  }),
  errorComponent: () => (
    <PageShell tone="lime">
      <Slab>
        <h1 className="text-4xl">
          <T k="blog.errorTitle">The blog is catching its breath</T>
        </h1>
        <p className="mt-4 text-lg">
          <T k="blog.errorBody">Give it a refresh in a moment.</T>
        </p>
      </Slab>
      <Footer dark={false} />
    </PageShell>
  ),
  component: Blog,
});

function Blog() {
  const { posts } = Route.useLoaderData();
  const readCta = useText("blog.readCta", "Read it");

  return (
    <PageShell tone="lime">
      <PageHero
        tk="blog"
        eyebrow="Blog"
        title={<>Notes from the pack.</>}
        lead="Payout maths, co-op arguments and dispatches from the scenes we cover. Stanley proofreads everything."
        gif={stanleyHero.listening}
        gifPlain
        gifShadow="#ff2cdf"
      />

      <Slab>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, i) => (
            <article
              key={post.slug}
              className={`zine grain flex h-full flex-col ${i % 3 === 1 ? "zine-b" : i % 3 === 2 ? "zine-c" : ""}`}
            >
              <CoverSlot src={post.cover_image} alt={post.title} className="aspect-[3/2]" />

              <div className="relative flex flex-1 flex-col p-8">
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-ink/70">
                  {dateLabel(post.published_on)} · {post.author}
                </p>
                <h2 className="mt-3 text-2xl leading-tight">{post.title}</h2>
                <p className="mt-3 flex-1 text-base leading-relaxed">{post.excerpt}</p>
                <Link
                  to="/blog/$slug"
                  params={{ slug: post.slug }}
                  className="press mt-6 inline-flex self-start rounded-full bg-electric px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-paper"
                >
                  {readCta}
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-6">
          <JoinCta />
          <PackPill className="text-electric" />
        </div>
      </Slab>
      <Footer dark={false} />
    </PageShell>
  );
}
