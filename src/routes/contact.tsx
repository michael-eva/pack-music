import { createFileRoute } from "@tanstack/react-router";
import { ContactPage } from "@/components/pack/ContactPage";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [
    { title: "Contact — The Pack" },
    { name: "description", content: "Contact The Pack about your account, upload status or payments." },
    { property: "og:title", content: "Contact — The Pack" },
    { property: "og:description", content: "Contact The Pack about your account, upload status or payments." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ContactPage,
});
