import { createFileRoute } from "@tanstack/react-router";
import { BizStaff } from "@/components/pack/BusinessJourney";

export const Route = createFileRoute("/biz/staff")({
  head: () => ({ meta: [
    { title: "Staff — The Pack" },
    { name: "description", content: "Who can run the player at your site." },
    { property: "og:title", content: "Staff — The Pack" },
    { property: "og:description", content: "Who can run the player at your site." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ]}),
  component: BizStaff,
});
