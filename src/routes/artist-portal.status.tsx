import { createFileRoute } from "@tanstack/react-router";
import { ArtistStatus } from "@/components/pack/ArtistJourney";

export const Route = createFileRoute("/artist-portal/status")({
  head: () => ({ meta: [
    { title: "Release status — The Pack" },
    { name: "description", content: "Where your release is up to and what to fix." },
    { property: "og:title", content: "Release status — The Pack" },
    { property: "og:description", content: "Where your release is up to and what to fix." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ]}),
  component: ArtistStatus,
});
