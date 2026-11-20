import { createFileRoute } from "@tanstack/react-router";
import { ArtistStatement } from "@/components/pack/ArtistJourney";

export const Route = createFileRoute("/artist-portal/statement")({
  head: () => ({ meta: [
    { title: "Earnings statement — The Pack" },
    { name: "description", content: "Your monthly earnings statement, explained." },
    { property: "og:title", content: "Earnings statement — The Pack" },
    { property: "og:description", content: "Your monthly earnings statement, explained." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ]}),
  component: ArtistStatement,
});
