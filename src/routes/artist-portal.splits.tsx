import { createFileRoute } from "@tanstack/react-router";
import { ArtistSplits } from "@/components/pack/ArtistJourney";

export const Route = createFileRoute("/artist-portal/splits")({
  head: () => ({ meta: [
    { title: "Who gets paid — The Pack" },
    { name: "description", content: "Confirm the split for each song." },
    { property: "og:title", content: "Who gets paid — The Pack" },
    { property: "og:description", content: "Confirm the split for each song." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ]}),
  component: ArtistSplits,
});
