import { createFileRoute, notFound } from "@tanstack/react-router";
import { WhatsPlaying } from "@/components/pack/ListenerVisit";
import { businessByCode } from "@/lib/pack-store";

export const Route = createFileRoute("/c/$code")({
  loader: ({ params }) => { const b = businessByCode(params.code); if (!b) throw notFound(); return { slug: b.slug, name: b.name }; },
  head: ({ loaderData }) => ({ meta: [
    { title: `What's playing at ${loaderData?.name ?? "this business"} — The Pack` },
    { name: "description", content: "See what's playing here right now and save it." },
    { property: "og:title", content: `What's playing at ${loaderData?.name ?? "this business"}` },
    { property: "og:description", content: "See what's playing here right now and save it." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ]}),
  component: () => { const { code } = Route.useParams(); return <WhatsPlaying biz={businessByCode(code)!} />; },
});
