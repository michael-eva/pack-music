import { createFileRoute } from "@tanstack/react-router";
import { ResetPasswordApp } from "@/components/ListenerAuth";
import { parseRole } from "@/components/PackWelcome";

export const Route = createFileRoute("/reset-password")({
  validateSearch: parseRole,
  head: () => ({ meta: [
    { title: "Choose a new password — The Pack" },
    { name: "description", content: "Choose a new password for The Pack." },
    { name: "robots", content: "noindex" },
  ]}),
  component: ResetPasswordApp,
});
