import { createFileRoute } from "@tanstack/react-router";
import { ArtistUpload } from "@/components/pack/ArtistJourney";

export const Route = createFileRoute("/artist-portal/upload")({
  head: () => ({ meta: [
    { title: "Add your music — The Pack" },
    { name: "description", content: "Receive your release from MetaGen and submit it." },
    { property: "og:title", content: "Add your music — The Pack" },
    { property: "og:description", content: "Receive your release from MetaGen and submit it." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ]}),
  component: ArtistUpload,
});
