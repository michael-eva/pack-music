import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboard } from "@/components/pack/AdminJourney";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [
    { title: "Admin dashboard — The Pack" },
    { name: "description", content: "Curator and admin overview." },
    { property: "og:title", content: "Admin dashboard — The Pack" },
    { property: "og:description", content: "Curator and admin overview." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ]}),
  component: AdminDashboard,
});
