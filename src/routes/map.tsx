import { createFileRoute } from "@tanstack/react-router";
import { MapPage } from "@/components/pack/ListenerHome";

export const Route = createFileRoute("/map")({
  head: () => ({ meta: [
    { title: "Pack places near me — The Pack" },
    { name: "description", content: "Pack places near me — businesses playing The Pack, and upcoming gigs." },
    { property: "og:title", content: "Pack places near me — The Pack" },
    { property: "og:description", content: "Businesses playing The Pack, and upcoming gigs." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ]}),
  component: MapPage,
});
