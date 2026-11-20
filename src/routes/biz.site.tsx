import { createFileRoute } from "@tanstack/react-router";
import { BizSite } from "@/components/pack/BusinessJourney";

export const Route = createFileRoute("/biz/site")({
  head: () => ({ meta: [
    { title: "Your site — The Pack" },
    { name: "description", content: "Set up your site, QR code, staff and followers." },
    { property: "og:title", content: "Your site — The Pack" },
    { property: "og:description", content: "Set up your site, QR code, staff and followers." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ]}),
  component: BizSite,
});
