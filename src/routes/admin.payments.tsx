import { createFileRoute } from "@tanstack/react-router";
import { AdminPayments } from "@/components/pack/AdminJourney";

export const Route = createFileRoute("/admin/payments")({
  head: () => ({ meta: [
    { title: "Payments architecture — The Pack" },
    { name: "description", content: "How artist payouts, listener memberships, business subscriptions and government patronage flow through Stripe." },
    { property: "og:title", content: "Payments architecture — The Pack" },
    { property: "og:description", content: "Payout, membership, subscription and patronage flows — simulated during the pilot." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ]}),
  component: AdminPayments,
});
