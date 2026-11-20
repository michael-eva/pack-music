import { createFileRoute } from "@tanstack/react-router";
import { AdminSites } from "@/components/pack/AdminJourney";

export const Route = createFileRoute("/admin/sites")({
  head: () => ({ meta: [
    { title: "Sites — The Pack" },
    { name: "description", content: "Which sites are on air." },
    { property: "og:title", content: "Sites — The Pack" },
    { property: "og:description", content: "Which sites are on air." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ]}),
  component: AdminSites,
});
