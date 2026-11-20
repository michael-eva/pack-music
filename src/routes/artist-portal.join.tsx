import { createFileRoute } from "@tanstack/react-router";
import { ArtistJoin } from "@/components/pack/ArtistJourney";

export const Route = createFileRoute("/artist-portal/join")({
  head: () => ({ meta: [
    { title: "Join The Pack — The Pack" },
    { name: "description", content: "Create your account and join the co-op as a Full member." },
    { property: "og:title", content: "Join The Pack — The Pack" },
    { property: "og:description", content: "Create your account and join the co-op as a Full member." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ]}),
  component: ArtistJoin,
});
