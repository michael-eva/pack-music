import { createFileRoute, notFound } from "@tanstack/react-router";
import { ArtistPage } from "@/components/pack/ListenerVisit";
import { artistBySlug } from "@/lib/pack-store";

export const Route = createFileRoute("/artist/$slug")({
  loader: ({ params }) => { const a = artistBySlug(params.slug); if (!a) throw notFound(); return { name: a.name, bio: a.bio }; },
  head: ({ loaderData }) => ({ meta: [
    { title: `${loaderData?.name ?? "Artist"} — The Pack` },
    { name: "description", content: loaderData?.bio ?? "A local artist on The Pack." },
    { property: "og:title", content: `${loaderData?.name ?? "Artist"} — The Pack` },
    { property: "og:description", content: loaderData?.bio ?? "A local artist on The Pack." },
    { property: "og:type", content: "profile" }, { name: "twitter:card", content: "summary" },
  ]}),
  component: () => { const { slug } = Route.useParams(); return <ArtistPage slug={slug} />; },
});
