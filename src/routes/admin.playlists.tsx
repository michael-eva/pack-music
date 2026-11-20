import { createFileRoute } from "@tanstack/react-router";
import { AdminPlaylists } from "@/components/pack/AdminJourney";

export const Route = createFileRoute("/admin/playlists")({
  head: () => ({ meta: [
    { title: "Build a playlist — The Pack" },
    { name: "description", content: "Hand-build a playlist for a business." },
    { property: "og:title", content: "Build a playlist — The Pack" },
    { property: "og:description", content: "Hand-build a playlist for a business." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ]}),
  component: AdminPlaylists,
});
