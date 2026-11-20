import { createFileRoute } from "@tanstack/react-router";
import { BizNotice } from "@/components/pack/BusinessJourney";

export const Route = createFileRoute("/biz/")({
  head: () => ({ meta: [
    { title: "Before you switch on The Pack — The Pack" },
    { name: "description", content: "Plain-English subscription, OneMusic and Associate membership notice for Pack businesses." },
    { property: "og:title", content: "Before you switch on The Pack — The Pack" },
    { property: "og:description", content: "Plain-English subscription, OneMusic and Associate membership notice for Pack businesses." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ]}),
  component: BizNotice,
});
