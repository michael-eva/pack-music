import { createFileRoute, notFound } from "@tanstack/react-router";
import { BusinessPage } from "@/components/pack/ListenerVisit";
import { businessBySlug } from "@/lib/pack-store";

export const Route = createFileRoute("/business/$slug")({
  loader: ({ params }) => { const b = businessBySlug(params.slug); if (!b) throw notFound(); return { name: b.name, vibe: b.vibe }; },
  head: ({ loaderData }) => ({ meta: [
    { title: `${loaderData?.name ?? "Business"} — The Pack` },
    { name: "description", content: loaderData?.vibe ?? "A business playing local music with The Pack." },
    { property: "og:title", content: `${loaderData?.name ?? "Business"} — The Pack` },
    { property: "og:description", content: loaderData?.vibe ?? "A business playing local music with The Pack." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ]}),
  component: () => { const { slug } = Route.useParams(); return <BusinessPage slug={slug} />; },
});
