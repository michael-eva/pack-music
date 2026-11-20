import { createFileRoute } from "@tanstack/react-router";
import { ArtistProfileEdit } from "@/components/pack/ArtistJourney";

export const Route = createFileRoute("/artist-portal/profile")({
  head: () => ({ meta: [
    { title: "Your artist profile — The Pack" },
    { name: "description", content: "What listeners see, and what only The Pack sees." },
    { property: "og:title", content: "Your artist profile — The Pack" },
    { property: "og:description", content: "What listeners see, and what only The Pack sees." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ]}),
  component: ArtistProfileEdit,
});
