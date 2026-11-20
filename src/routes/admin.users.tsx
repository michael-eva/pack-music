import { createFileRoute } from "@tanstack/react-router";
import { AdminUsers } from "@/components/pack/AdminJourney";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [
    { title: "Users — The Pack" },
    { name: "description", content: "Invite artists and businesses." },
    { property: "og:title", content: "Users — The Pack" },
    { property: "og:description", content: "Invite artists and businesses." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ]}),
  component: AdminUsers,
});
