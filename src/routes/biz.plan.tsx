import { createFileRoute } from "@tanstack/react-router";
import { BizPlan } from "@/components/pack/BusinessJourney";

export const Route = createFileRoute("/biz/plan")({
  head: () => ({ meta: [
    { title: "Your plan — The Pack" },
    { name: "description", content: "$49.99 per site, per month during the pilot, and where it goes." },
    { property: "og:title", content: "Your plan — The Pack" },
    { property: "og:description", content: "$49.99 per site, per month during the pilot, and where it goes." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ]}),
  component: BizPlan,
});
