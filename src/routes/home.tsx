import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/components/pack/ListenerHome";

export const Route = createFileRoute("/home")({
  head: () => ({ meta: [
    { title: "Home — The Pack" },
    { name: "description", content: "Human-curated music from Western Australia." },
    { property: "og:title", content: "Home — The Pack" },
    { property: "og:description", content: "Human-curated music from Western Australia." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ]}),
  component: HomePage,
});
