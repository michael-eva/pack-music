import { createFileRoute } from "@tanstack/react-router";
import { LibraryPage } from "@/components/pack/ListenerHome";

export const Route = createFileRoute("/library")({
  head: () => ({ meta: [
    { title: "Library — The Pack" },
    { name: "description", content: "Playlists you've pinched, playlists you've created, and musicians and Pack places you follow." },
    { property: "og:title", content: "Library — The Pack" },
    { property: "og:description", content: "Playlists you've pinched, playlists you've created, and musicians and Pack places you follow." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ]}),
  component: LibraryPage,
});
