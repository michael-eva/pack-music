import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Guard } from "@/components/app/guard";
import { AppShell } from "@/components/app/ui";

export const Route = createFileRoute("/studio")({
  ssr: false,
  head: () => ({ meta: [{ title: "Artist · The Pack" }, { name: "robots", content: "noindex" }] }),
  component: StudioLayout,
});

function StudioLayout() {
  return (
    <Guard roles={["artist"]}>
      {(me) => (
        <AppShell
          area="Artist"
          areaColor="text-cyan"
          title={me.artist?.public_name ?? ""}
          tabs={[
            { to: "/studio", label: "Releases", exact: true },
            { to: "/studio/releases/new", label: "Add music" },
            { to: "/studio/earnings", label: "Earnings" },
            { to: "/studio/data", label: "My data" },
            { to: "/studio/profile", label: "Profile" },
          ]}
        >
          <Outlet />
        </AppShell>
      )}
    </Guard>
  );
}
