import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Guard } from "@/components/app/guard";
import { AppShell, type Tab } from "@/components/app/ui";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({ meta: [{ title: "Admin · The Pack" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const ADMIN_TABS: Tab[] = [
  { to: "/admin", label: "Dashboard", exact: true },
  { to: "/admin/music", label: "Music" },
  { to: "/admin/playlists", label: "Playlists" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/settings", label: "Settings" },
  { to: "/admin/audit", label: "Audit log" },
  { to: "/listen", label: "Listener app ↗", exact: true },
];

// A curator builds playlists and tags music, but doesn't upload or publish it.
const CURATOR_TABS: Tab[] = [
  { to: "/admin/playlists", label: "Playlists" },
  { to: "/admin/music", label: "Music" },
  { to: "/listen", label: "Listener app ↗", exact: true },
];

function AdminLayout() {
  return (
    <Guard roles={["admin", "curator"]}>
      {(me) => {
        const isAdmin = me.roles.includes("admin");
        return (
          <AppShell
            wide
            area={isAdmin ? "Admin" : "Curator"}
            areaColor="text-yellow"
            title={me.displayName ?? me.email}
            tabs={isAdmin ? ADMIN_TABS : CURATOR_TABS}
          >
            <Outlet />
          </AppShell>
        );
      }}
    </Guard>
  );
}
