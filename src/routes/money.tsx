import { createFileRoute } from "@tanstack/react-router";
import { MoneyPage } from "@/components/pack/ListenerHome";

export const Route = createFileRoute("/money")({
  head: () => ({ meta: [
    { title: "Where your $9.99 goes — The Pack" },
    { name: "description", content: "How your membership is shared between artists and The Pack." },
    { property: "og:title", content: "Where your $9.99 goes — The Pack" },
    { property: "og:description", content: "How your membership is shared between artists and The Pack." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ]}),
  component: MoneyPage,
});
