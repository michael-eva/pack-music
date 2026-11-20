import { createFileRoute } from "@tanstack/react-router";
import { SignInApp, type Role } from "@/components/PackWelcome";

const valid: Role[] = ["listener", "artist", "business", "government"];

export const Route = createFileRoute("/sign-in")({
  validateSearch: (search: Record<string, unknown>): { role: Role } => {
    const role = String(search['role'] ?? "listener") as Role;
    return { role: valid.includes(role) ? role : "listener" };
  },
  head: () => ({ meta: [
    { title: "Sign in — The Pack" },
    { name: "description", content: "Sign in with email and password or a magic link. Separate pathways for listeners, artists, businesses and government." },
    { property: "og:title", content: "Sign in — The Pack" },
    { property: "og:description", content: "Separate sign-in pathways for listeners, artists, businesses and government." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ]}),
  component: SignInApp,
});
