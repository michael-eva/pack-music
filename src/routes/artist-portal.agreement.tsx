import { createFileRoute } from "@tanstack/react-router";
import { ArtistAgreement } from "@/components/pack/ArtistJourney";

export const Route = createFileRoute("/artist-portal/agreement")({
  head: () => ({ meta: [
    { title: "Artist Agreement — The Pack" },
    { name: "description", content: "The plain-English Artist Agreement, including licence-back." },
    { property: "og:title", content: "Artist Agreement — The Pack" },
    { property: "og:description", content: "The plain-English Artist Agreement, including licence-back." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ]}),
  component: ArtistAgreement,
});
