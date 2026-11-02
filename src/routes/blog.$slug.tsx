import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Footer } from "@/components/site/Footer";
import { CoverSlot } from "@/components/site/CoverSlot";
import { PostBody } from "@/components/site/PostBody";
import { ShareButtons } from "@/components/site/ShareButtons";
import { JoinCta, PackPill, PageShell, Slab } from "@/components/site/blocks";
import { dateLabel } from "@/lib/content-format";
import { getPostBySlug } from "@/lib/content.functions";
import { T } from "@/lib/site-text";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const post = await getPostBySlug({ data: { slug: params.slug } });
    if (!post) throw notFound();
    return { post };
  },

  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Unavailable – The Pack" }, { name: "robots", content: "noindex" }],
      };
    }
    const { post } = loaderData;
    return {
      meta: [
        { title: `${post.title} – The Pack` },
        { name: "description", content: post.excerpt },
        { property: "og:title", content: post.title },
        { property: "og:description", content: post.excerpt },
        { property: "og:type", content: "article" },
        { property: "og:url", content: `/blog/${params.slug}` },
      ],
      links: [{ rel: "canonical", href: `/blog/${params.slug}` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            datePublished: post.published_on,
            author: { "@type": "Organization", name: post.author },
            description: post.excerpt,
          }),
        },
      ],
    };
  },
  notFoundComponent: PostNotFound,
  component: BlogPost,
});

function PostNotFound() {
  return (
    <PageShell tone="lime">
      <Slab>
        <h1 className="text-5xl">
          <T k="blog.notFoundTitle">That post has wandered off</T>
        </h1>
        <p className="mt-4 text-lg">
          <T k="blog.notFoundBody">Stanley checked under the couch. Nothing.</T>
        </p>
        <Link
          to="/blog"
          className="press mt-8 inline-flex rounded-full bg-electric px-6 py-3 text-sm font-bold uppercase tracking-widest text-paper"
        >
          <T k="blog.notFoundCta">Back to the blog</T>
        </Link>
      </Slab>
      <Footer dark={false} />
    </PageShell>
  );
}

function BlogPost() {
  const { post } = Route.useLoaderData();

  return (
    <PageShell tone="lime">
      <Slab>
        <div className="mx-auto max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-[0.25em]">
            {dateLabel(post.published_on)} · {post.author}
          </p>
          <h1 className="mt-4 text-4xl leading-tight sm:text-5xl">{post.title}</h1>

          <article className="zine grain mt-10 flex flex-col">
            <CoverSlot src={post.cover_image} alt={post.title} className="aspect-[16/7]" />
            <div className="relative px-8 py-14 sm:px-14 sm:py-16">
              <PostBody body={post.body} />
            </div>
          </article>


          <div className="mt-10">
            <ShareButtons title={post.title} path={`/blog/${post.slug}`} />
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-6">
            <JoinCta />
            <Link
              to="/blog"
              className="font-mono text-xs uppercase tracking-[0.25em] underline underline-offset-4"
            >
              <T k="blog.allPostsLink">All posts</T>
            </Link>
            <PackPill className="text-electric" />
          </div>
        </div>
      </Slab>
      <Footer dark={false} />
    </PageShell>
  );
}
