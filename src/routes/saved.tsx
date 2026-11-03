import { createFileRoute, redirect } from "@tanstack/react-router";

/** Old address for saved songs. */
export const Route = createFileRoute("/saved")({
  beforeLoad: () => {
    throw redirect({ to: "/listen/library" });
  },
});
