import { createFileRoute } from "@tanstack/react-router";
import { MePage } from "@/components/pack/ListenerHome";

export const Route = createFileRoute("/me")({
  head: () => ({ meta: [
    { title: "Me — The Pack" },
    { name: "description", content: "Your account, tuning and data." },
    { property: "og:title", content: "Me — The Pack" },
    { property: "og:description", content: "Your account, tuning and data." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ]}),
  component: MePage,
});
