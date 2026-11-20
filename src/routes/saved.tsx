import { createFileRoute } from "@tanstack/react-router";
import { SavedPage } from "@/components/pack/ListenerVisit";

export const Route = createFileRoute("/saved")({
  head: () => ({ meta: [
    { title: "Heard somewhere real — The Pack" },
    { name: "description", content: "Every song you saved, with where and when you heard it." },
    { property: "og:title", content: "Heard somewhere real — The Pack" },
    { property: "og:description", content: "Every song you saved, with where and when you heard it." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ]}),
  component: SavedPage,
});
