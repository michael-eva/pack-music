import { createFileRoute } from "@tanstack/react-router";
import { BizPlaylists } from "@/components/pack/BusinessJourney";

export const Route = createFileRoute("/biz/playlists")({
  head: () => ({ meta: [
    { title: "Playlists — The Pack" },
    { name: "description", content: "Pack-curated and staff house-pick playlists for your site." },
    { property: "og:title", content: "Playlists — The Pack" },
    { property: "og:description", content: "Pack-curated and staff house-pick playlists for your site." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ]}),
  component: BizPlaylists,
});
