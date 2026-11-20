import { createFileRoute } from "@tanstack/react-router";
import { AdminReview } from "@/components/pack/AdminJourney";

export const Route = createFileRoute("/admin/review")({
  head: () => ({ meta: [
    { title: "Review a release — The Pack" },
    { name: "description", content: "Listen, check and decide on a release." },
    { property: "og:title", content: "Review a release — The Pack" },
    { property: "og:description", content: "Listen, check and decide on a release." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ]}),
  component: AdminReview,
});
