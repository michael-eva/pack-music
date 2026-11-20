import { createFileRoute } from "@tanstack/react-router";
import { WelcomeApp } from "@/components/PackWelcome";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "The Pack — Streaming that puts musicians first" },
    { name: "description", content: "Choose your pathway into The Pack: listener, artist, business or government. Co-operative streaming for local music." },
    { property: "og:title", content: "The Pack — Streaming that puts musicians first" },
    { property: "og:description", content: "Choose your pathway into The Pack: listener, artist, business or government." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ]}),
  component: WelcomeApp,
});
