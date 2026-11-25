import { createFileRoute } from "@tanstack/react-router";
import { ForgotPasswordApp } from "@/components/ListenerAuth";
import { parseRole } from "@/components/PackWelcome";

export const Route = createFileRoute("/forgot-password")({
  validateSearch: parseRole,
  head: () => ({ meta: [
    { title: "Reset your password — The Pack" },
    { name: "description", content: "Get a link to choose a new password for The Pack." },
    { name: "robots", content: "noindex" },
  ]}),
  component: ForgotPasswordApp,
});
