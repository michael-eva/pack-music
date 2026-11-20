import { createFileRoute } from "@tanstack/react-router";
import { AdminPolicy } from "@/components/pack/AdminJourney";

export const Route = createFileRoute("/admin/policy")({
  head: () => ({ meta: [
    { title: "Policy settings — The Pack" },
    { name: "description", content: "Test mode, fees, splits and playlist rules." },
    { property: "og:title", content: "Policy settings — The Pack" },
    { property: "og:description", content: "Test mode, fees, splits and playlist rules." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ]}),
  component: AdminPolicy,
});
