import { createFileRoute } from "@tanstack/react-router";
import { ArtistDashboard } from "@/components/pack/ArtistJourney";

export const Route = createFileRoute("/artist-portal/")({
  head: () => ({ meta: [
    { title: "Artist dashboard — The Pack" },
    { name: "description", content: "Releases, plays, earnings and your data." },
    { property: "og:title", content: "Artist dashboard — The Pack" },
    { property: "og:description", content: "Releases, plays, earnings and your data." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ]}),
  component: ArtistDashboard,
});
