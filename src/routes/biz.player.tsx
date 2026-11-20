import { createFileRoute } from "@tanstack/react-router";
import { BizPlayer } from "@/components/pack/BusinessJourney";

export const Route = createFileRoute("/biz/player")({
  head: () => ({ meta: [
    { title: "Business player — The Pack" },
    { name: "description", content: "On-air player for Pack businesses, with skip reasons." },
    { property: "og:title", content: "Business player — The Pack" },
    { property: "og:description", content: "On-air player for Pack businesses, with skip reasons." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ]}),
  component: BizPlayer,
});
