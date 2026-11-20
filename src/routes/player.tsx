import { createFileRoute } from "@tanstack/react-router";
import { PlayerPage } from "@/components/pack/ListenerHome";

export const Route = createFileRoute("/player")({
  validateSearch: (s: Record<string, unknown>): { song?: string | undefined } => ({ song: typeof s["song"] === "string" ? s["song"] : undefined }),
  head: () => ({ meta: [
    { title: "Now playing — The Pack" },
    { name: "description", content: "Full-screen player with your queue." },
    { property: "og:title", content: "Now playing — The Pack" },
    { property: "og:description", content: "Full-screen player with your queue." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ]}),
  component: () => { const { song } = Route.useSearch(); return <PlayerPage key={song} songId={song} />; },
});
