import { createFileRoute } from "@tanstack/react-router";
import { AdminAudit } from "@/components/pack/AdminJourney";

export const Route = createFileRoute("/admin/audit")({
  head: () => ({ meta: [
    { title: "Audit log — The Pack" },
    { name: "description", content: "Every change, who made it and when." },
    { property: "og:title", content: "Audit log — The Pack" },
    { property: "og:description", content: "Every change, who made it and when." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ]}),
  component: AdminAudit,
});
