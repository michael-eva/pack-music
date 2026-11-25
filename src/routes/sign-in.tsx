import { createFileRoute } from "@tanstack/react-router";
import { SignInApp, parseRole } from "@/components/PackWelcome";

export const Route = createFileRoute("/sign-in")({
  validateSearch: parseRole,
  head: () => ({ meta: [
    { title: "Sign in — The Pack" },
    { name: "description", content: "Sign in with email and password or a magic link. Separate pathways for listeners, artists and businesses." },
    { property: "og:title", content: "Sign in — The Pack" },
    { property: "og:description", content: "Separate sign-in pathways for listeners, artists and businesses." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ]}),
  component: SignInApp,
});
