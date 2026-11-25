import { createFileRoute } from "@tanstack/react-router";
import { SignUpApp } from "@/components/ListenerAuth";

export const Route = createFileRoute("/sign-up")({
  head: () => ({ meta: [
    { title: "Create a listener account — The Pack" },
    { name: "description", content: "Create a free listener account with just your email. No Facebook or Google." },
  ]}),
  component: SignUpApp,
});
