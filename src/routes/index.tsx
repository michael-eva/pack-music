import { createFileRoute } from "@tanstack/react-router";
import { WelcomeApp } from "@/components/PackWelcome";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "The Pack — Streaming that puts musicians first" },
    { name: "description", content: "Choose your pathway into The Pack: listener, artist or business. Co-operative streaming for local music." },
    { property: "og:title", content: "The Pack — Streaming that puts musicians first" },
    { property: "og:description", content: "Choose your pathway into The Pack: listener, artist or business." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ]}),
  component: WelcomeApp,
});
